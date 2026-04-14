/**
 * PartnerScout AI — Trial Order Form
 * Handles form submission → API call → redirect to dashboard
 */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://partnerscout-api-production.up.railway.app';

// ── Admin / Demo mode detection ───────────────────────────────────────────────
// Admin: ?admin=SECRET in URL (owner only, 50 leads)
// Demo:  automatic for jares-ai.com domain (20 full leads, for showcase)
const _adminSecret = new URLSearchParams(window.location.search).get('admin') || '';
const IS_ADMIN = _adminSecret.length > 0;
const IS_DEMO  = !IS_ADMIN && (
  window.location.hostname.includes('jares-ai.com') ||
  window.location.hostname === 'www.jares-ai.com'
);
// Demo secret embedded for jares-ai.com domain (separate from admin secret)
const _demoSecret = 'ps_demo_jares_2026';

if (IS_ADMIN) {
  console.log('[PartnerScout] Admin mode active — full results, no blur');
  document.title = '⚡ PartnerScout — Admin Mode';
}
if (IS_DEMO) {
  console.log('[PartnerScout] Demo mode active — 20 full leads for showcase');
}

// ── Toast notifications ──────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

// ── Trial form submit ────────────────────────────────────────────────────────

const trialForm = document.getElementById('trialForm');
const trialBtn  = document.getElementById('trialSubmitBtn');
const trialBtnText = document.getElementById('trialBtnText');

if (trialForm) {
  trialForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('trialEmail').value.trim();
    if (!email) { showToast('Please enter your email', 'error'); return; }

    // Collect checked niches
    const nicheBoxes = document.querySelectorAll('input[name="niches"]:checked');
    const niches = Array.from(nicheBoxes).map(cb => cb.value);
    if (niches.length === 0) { showToast('Please select at least one category', 'error'); return; }

    // Parse regions
    const regionRaw = document.getElementById('trialRegion').value.trim();
    const regions = regionRaw
      ? regionRaw.split(',').map(r => r.trim()).filter(Boolean)
      : ['Nice', 'Cannes', 'Monaco'];

    const segment = document.getElementById('trialSegment').value;

    // Loading state
    trialBtn.classList.add('btn--loading');
    trialBtnText.innerHTML = '<span class="spinner"></span> Starting AI search...';

    try {
      let endpoint, headers;
      if (IS_ADMIN) {
        endpoint = `${API_BASE}/api/v1/orders/admin`;
        headers = { 'Content-Type': 'application/json', 'X-Admin-Secret': _adminSecret };
      } else if (IS_DEMO) {
        endpoint = `${API_BASE}/api/v1/orders/demo`;
        headers = { 'Content-Type': 'application/json', 'X-Demo-Secret': _demoSecret };
      } else {
        endpoint = `${API_BASE}/api/v1/orders/trial`;
        headers = { 'Content-Type': 'application/json' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email, niches, regions, segment,
          count_target: IS_ADMIN ? 50 : IS_DEMO ? 20 : 10,
          is_trial: !IS_ADMIN && !IS_DEMO,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${response.status}`);
      }

      const data = await response.json();
      const orderId = data.order_id;

      if (!orderId) throw new Error('No order ID returned');

      // Save to localStorage for dashboard to pick up
      localStorage.setItem('ps_trial_order_id', orderId);
      localStorage.setItem('ps_trial_email', email);
      if (IS_ADMIN) localStorage.setItem('ps_admin_secret', _adminSecret);

      const msg = IS_ADMIN
        ? '⚡ Admin mode — 50 full leads incoming!'
        : IS_DEMO ? '✅ Searching for 20 verified partners...'
        : '✅ AI is searching! Redirecting to your results...';
      showToast(msg, 'success');

      const dashUrl = IS_ADMIN
        ? `/partnerscout/dashboard?order_id=${orderId}&admin=${encodeURIComponent(_adminSecret)}`
        : IS_DEMO ? `/partnerscout/dashboard?order_id=${orderId}&demo=true`
        : `/partnerscout/dashboard?order_id=${orderId}`;

      setTimeout(() => {
        window.location.href = dashUrl;
      }, 1500);

    } catch (err) {
      console.error('[ORDER] Trial submit error:', err);
      showToast(`Error: ${err.message}`, 'error');
      trialBtn.classList.remove('btn--loading');
      trialBtnText.textContent = '🔍 Run free preview';
    }
  });
}
