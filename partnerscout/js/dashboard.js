/**
 * PartnerScout AI — Dashboard v3
 * - Trial: uses preview data from poll response directly (no extra fetch)
 * - Admin/paid: fetches full JSON from export endpoint
 * - Auto-reports JS errors to backend for JARVIS logging
 */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://partnerscout-api-production.up.railway.app';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 250; // ~12.5 minutes max

let pollCount = 0;
let pollTimer = null;

const params       = new URLSearchParams(window.location.search);
const orderId      = params.get('order_id') || localStorage.getItem('ps_trial_order_id');
const _adminSecret = params.get('admin') || localStorage.getItem('ps_admin_secret') || '';
const IS_ADMIN     = _adminSecret.length > 0;

if (IS_ADMIN) document.title = '⚡ PartnerScout — Admin Dashboard';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const statusTitle    = document.getElementById('statusTitle');
const statusSub      = document.getElementById('statusSub');
const statusBadge    = document.getElementById('statusBadge');
const statusIcon     = document.getElementById('statusIcon');
const progressFill   = document.getElementById('progressFill');
const progressWrap   = document.getElementById('progressWrap');
const resultsSection = document.getElementById('resultsSection');
const errorSection   = document.getElementById('errorSection');
const errorMsg       = document.getElementById('errorMsg');
const resultsTable   = document.getElementById('resultsTable');
const resultsCount   = document.getElementById('resultsCount');
const trialBanner    = document.getElementById('trialBanner');

// ── Auto error reporting to JARVIS ────────────────────────────────────────────
async function reportError(context, message) {
  try {
    await fetch(`${API_BASE}/api/v1/log/error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, message, order_id: orderId, ts: new Date().toISOString() }),
    });
  } catch (_) { /* non-fatal */ }
}

// ── Progress steps ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'step1', threshold: 10,  label: '🔎 Generating queries' },
  { id: 'step2', threshold: 30,  label: '📡 Searching sources' },
  { id: 'step3', threshold: 70,  label: '🏗️ Extracting contacts' },
  { id: 'step4', threshold: 85,  label: '✅ Validating luxury' },
  { id: 'step5', threshold: 100, label: '📦 Preparing report' },
];

function updateProgressSteps(progress) {
  STEPS.forEach(step => {
    const el = document.getElementById(step.id);
    if (!el) return;
    if (progress >= step.threshold) {
      el.classList.remove('pstep--active');
      el.classList.add('pstep--done');
    } else if (progress >= step.threshold - 20) {
      el.classList.add('pstep--active');
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CAT_LABELS = {
  hotel: '🏨 Hotel', event_agency: '🎪 Event', wedding: '💍 Wedding',
  concierge: '🎩 Concierge', travel: '✈️ Travel', venue: '🏛️ Venue',
};
const catLabel = cat => CAT_LABELS[cat] || cat;

function scoreBadge(score) {
  const pct = Math.round((score || 0) * 100);
  const cls = pct >= 80 ? 'score-badge--high' : 'score-badge--mid';
  const stars = pct >= 90 ? '★★★' : pct >= 75 ? '★★' : '★';
  return `<span class="score-badge ${cls}">${stars} ${pct}%</span>`;
}

// ── Data availability badges ──────────────────────────────────────────────────
function dataBadges(c) {
  const fields = [
    { key: 'address',        icon: '📍', label: 'Address' },
    { key: 'phone',          icon: '📞', label: 'Phone' },
    { key: 'email',          icon: '📧', label: 'Email' },
    { key: 'contact_person', icon: '👤', label: 'Contact' },
    { key: 'personal_phone', icon: '📱', label: 'Direct phone' },
    { key: 'personal_email', icon: '✉️', label: 'Direct email' },
  ];
  return fields.map(f => {
    const val = c[f.key] || '';
    const isLocked = val.includes('🔒');
    const isFound  = val && val !== 'Not found' && !isLocked;
    const cls = isFound ? 'data-dot data-dot--found' : isLocked ? 'data-dot data-dot--locked' : 'data-dot data-dot--missing';
    const title = isFound ? `${f.label}: found` : isLocked ? `${f.label}: locked (upgrade)` : `${f.label}: not found`;
    return `<span class="${cls}" title="${title}">${f.icon}</span>`;
  }).join('');
}

// ── Blur helpers ──────────────────────────────────────────────────────────────
function blurEmail(email, isTrial) {
  if (!email || email === 'Not found') return `<span class="data-missing">—</span>`;
  if (email.includes('🔒')) return `<span class="data-locked">🔒 <a href="/partnerscout#pricing" class="unlock-link">Upgrade</a></span>`;
  if (!isTrial || IS_ADMIN) return `<a href="mailto:${email}" class="data-found">${email}</a>`;
  return `<span class="data-blurred">${email}</span>`;
}

function blurPhone(phone, isTrial) {
  if (!phone || phone === 'Not found') return `<span class="data-missing">—</span>`;
  if (!isTrial || IS_ADMIN) return `<a href="tel:${phone.replace(/\s/g,'')}" class="data-found">${phone}</a>`;
  const visible = phone.replace(/\s/g, '').slice(0, 4);
  return `<span class="data-blurred">${visible}•••</span>`;
}

function contactPerson(c, isTrial) {
  if (!c.contact_person || c.contact_person === 'Not found') return `<span class="data-missing">—</span>`;
  if (!isTrial || IS_ADMIN) return `<span class="data-found">${c.contact_person}</span>`;
  return `<span class="data-blurred">${c.contact_person}</span>`;
}

// ── Render results table ──────────────────────────────────────────────────────
function renderResults(companies, isTrial) {
  if (!resultsTable) return;

  if (!companies || !companies.length) {
    resultsTable.innerHTML = `<div style="padding:32px;text-align:center;color:var(--text-muted)">
      No results found for this search. Try different niches or regions.
    </div>`;
    return;
  }

  const emailsFound   = companies.filter(c => c.email && c.email !== 'Not found' && !c.email.includes('🔒')).length;
  const phonesFound   = companies.filter(c => c.phone && c.phone !== 'Not found').length;
  const contactsFound = companies.filter(c => c.contact_person && c.contact_person !== 'Not found').length;

  const statsBar = `
    <div class="results-stats">
      <span class="stat-item stat-item--good">📧 ${emailsFound} emails found</span>
      <span class="stat-item stat-item--good">📞 ${phonesFound} phones found</span>
      <span class="stat-item stat-item--good">👤 ${contactsFound} contacts found</span>
      ${isTrial && !IS_ADMIN ? `<span class="stat-item stat-item--locked">🔒 Full data in paid report</span>` : ''}
    </div>`;

  const header = `
    <div class="result-row result-row--header">
      <span>Company</span>
      <span>Category</span>
      <span>Email</span>
      <span>Phone</span>
      <span>Contact</span>
      <span>Score</span>
      <span title="Data fields available">Data</span>
    </div>`;

  const rows = companies.map(c => {
    const website = c.website && c.website !== 'Not found'
      ? `<a href="${c.website}" target="_blank" rel="noopener" class="company-link">${c.website.replace(/^https?:\/\//, '').slice(0, 28)}…</a>`
      : '';
    return `
      <div class="result-row">
        <div>
          <div class="company-name">${c.company_name || '—'}</div>
          <div class="company-website">${website}</div>
        </div>
        <div><span class="cat-tag">${catLabel(c.category)}</span></div>
        <div>${blurEmail(c.email, isTrial)}</div>
        <div>${blurPhone(c.phone, isTrial)}</div>
        <div>${contactPerson(c, isTrial)}</div>
        <div>${scoreBadge(c.luxury_score)}</div>
        <div class="data-badges">${dataBadges(c)}</div>
      </div>`;
  }).join('');

  const fullReportCTA = (isTrial && !IS_ADMIN) ? `
    <div class="full-report-cta">
      <div class="full-report-cta__title">📦 Your full report also includes:</div>
      <div class="full-report-cta__fields">
        <span>📍 Full address</span>
        <span>📞 Direct phone</span>
        <span>📧 Full email (unblurred)</span>
        <span>👤 Contact name & title</span>
        <span>📱 Personal mobile</span>
        <span>✉️ Personal email</span>
      </div>
      <div class="full-report-cta__sub">Ready as CSV & JSON — import directly into your CRM</div>
      <a href="/partnerscout#pricing" class="btn btn--primary btn--sm">Unlock full report →</a>
    </div>` : '';

  resultsTable.innerHTML = statsBar + header + rows + fullReportCTA;

  if (resultsCount) {
    const total = companies.length;
    resultsCount.textContent = IS_ADMIN
      ? `${total} companies (admin — full data)`
      : isTrial ? `${total} preview leads` : `${total} companies found`;
  }
}

// ── Show done state ────────────────────────────────────────────────────────────
/**
 * @param {string} orderId
 * @param {boolean} isTrial
 * @param {object} pollData - Full response from GET /orders/{id} (already has preview!)
 */
async function showDone(orderId, isTrial, pollData) {
  // Update status UI
  statusIcon.textContent = '✅';
  statusTitle.textContent = IS_ADMIN
    ? '⚡ Admin: full results ready!'
    : isTrial ? '10 preview leads ready!' : 'Your leads are ready!';
  statusSub.textContent = IS_ADMIN
    ? 'Full unblurred data — 50 companies'
    : isTrial ? 'Emails & phones shown — upgrade for full contacts + CSV'
    : 'Download your full database below';
  if (statusBadge) {
    statusBadge.textContent = 'Done';
    statusBadge.classList.add('status-badge--done');
  }
  if (progressFill) progressFill.style.width = '100%';
  updateProgressSteps(100);

  let companies = [];

  if (IS_ADMIN || !isTrial) {
    // ── Admin / paid: fetch full JSON export ────────────────────────────────
    try {
      const fetchHeaders = IS_ADMIN ? { 'X-Admin-Secret': _adminSecret } : {};
      const resp = await fetch(`${API_BASE}/api/v1/export/${orderId}/json`, { headers: fetchHeaders });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} from /json`);
      const data = await resp.json();
      companies = Array.isArray(data) ? data : (data.companies || []);
    } catch (err) {
      console.error('[DASHBOARD] Full export fetch failed:', err);
      await reportError('showDone/json', err.message);
    }

  } else {
    // ── Trial: use preview data already in the poll response ────────────────
    // The GET /orders/{id} endpoint ALREADY returns response["preview"] for done+trial orders.
    // No second HTTP request needed — eliminates extra failure point.
    companies = Array.isArray(pollData?.preview) ? pollData.preview : [];

    // Fallback: if poll response somehow didn't include preview, fetch /preview
    if (!companies.length) {
      console.warn('[DASHBOARD] Poll data had no preview — trying /preview endpoint');
      try {
        const resp = await fetch(`${API_BASE}/api/v1/export/${orderId}/preview`);
        if (resp.ok) {
          const pData = await resp.json();
          companies = Array.isArray(pData.companies) ? pData.companies : [];
        } else {
          const errMsg = `HTTP ${resp.status} from /preview`;
          console.error('[DASHBOARD] Preview fallback failed:', errMsg);
          await reportError('showDone/preview_fallback', errMsg);
        }
      } catch (fbErr) {
        console.error('[DASHBOARD] Preview fallback exception:', fbErr);
        await reportError('showDone/preview_exception', fbErr.message);
      }
    }
  }

  // Render whatever we have
  renderResults(companies, isTrial);
  if (resultsSection) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Show error state ───────────────────────────────────────────────────────────
function showError(message) {
  if (statusIcon) statusIcon.textContent = '❌';
  if (statusTitle) statusTitle.textContent = 'Search failed';
  if (statusSub)   statusSub.textContent = 'An error occurred during the search';
  if (statusBadge) {
    statusBadge.textContent = 'Error';
    statusBadge.classList.add('status-badge--error');
  }
  if (progressWrap) progressWrap.style.display = 'none';
  if (errorMsg)     errorMsg.textContent = message || 'Unknown error.';
  if (errorSection) errorSection.style.display = 'block';
  reportError('showError', message);
}

// ── Poll order status ─────────────────────────────────────────────────────────
async function pollStatus(orderId) {
  if (pollCount >= MAX_POLLS) {
    clearInterval(pollTimer);
    showError('Search timed out. Please try again or contact support.');
    return;
  }
  pollCount++;

  try {
    const resp = await fetch(`${API_BASE}/api/v1/orders/${orderId}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    const { status, progress, is_trial, error_msg } = data;

    if (typeof progress === 'number') {
      if (progressFill) progressFill.style.width = `${progress}%`;
      updateProgressSteps(progress);
    }

    if (status === 'done') {
      clearInterval(pollTimer);
      // Pass full poll data — it contains data.preview for trial orders!
      await showDone(orderId, is_trial !== false, data);
    } else if (status === 'failed') {
      clearInterval(pollTimer);
      showError(error_msg || 'Pipeline failed. Please try again.');
    }
    // else: still running — keep polling

  } catch (err) {
    console.warn(`[DASHBOARD] Poll ${pollCount}:`, err.message);
    // Don't stop polling on network hiccups (Railway cold starts)
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
if (!orderId) {
  showError('No order ID. Please start a new search.');
} else {
  pollStatus(orderId);
  pollTimer = setInterval(() => pollStatus(orderId), POLL_INTERVAL_MS);
}
