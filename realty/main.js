'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// MERIDIAN — Luxury Real Estate Landing  ·  JARES AI  ·  Aria Voice Agent
// ══════════════════════════════════════════════════════════════════════════════

// ── Globals ───────────────────────────────────────────────────────────────────
let currentLang = 'en';
window.currentLang = currentLang;

// ── Aria widget labels (i18n) ─────────────────────────────────────────────────
const ARIA_LABELS = {
  en: '✦ Consult with Aria',
  de: '✦ Beratung mit Aria',
  fr: '✦ Consulter Aria',
  es: '✦ Consultar con Aria',
  ru: '✦ Консультация с Aria',
};

const ARIA_FIRST_MSG = {
  en: "Good day. My name is Aria, and I am a property consultant with MERIDIAN in Cyprus. I would be happy to assist you — whether you are looking to purchase, invest, or explore relocation options. How may I help you today?",
  de: "Guten Tag. Mein Name ist Aria, ich bin Immobilienberaterin bei MERIDIAN auf Zypern. Ich helfe Ihnen gerne weiter — egal ob Kauf, Investition oder Umzug. Womit kann ich Ihnen behilflich sein?",
  fr: "Bonjour. Je m'appelle Aria, conseillère immobilière chez MERIDIAN à Chypre. Je suis à votre disposition — que ce soit pour un achat, un investissement ou un projet de relocalisation. Comment puis-je vous aider?",
  es: "Buenos días. Me llamo Aria, consultora inmobiliaria en MERIDIAN, Chipre. Estaré encantada de asistirle — ya sea para comprar, invertir o explorar opciones de reubicación. ¿En qué puedo ayudarle?",
  ru: "Добрый день. Меня зовут Aria, я консультант по недвижимости агентства MERIDIAN на Кипре. Готова помочь вам — с покупкой, инвестициями или переездом. Чем могу быть полезна?",
};

// ══════════════════════════════════════════════════════════════════════════════
// i18n — applyLang
// ══════════════════════════════════════════════════════════════════════════════
function applyLang(lang) {
  if (!window.REALTY_I18N || !window.REALTY_I18N[lang]) return;
  currentLang = lang;
  window.currentLang = lang;
  const dict = window.REALTY_I18N[lang];

  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  // Active state on both nav and mobile lang buttons
  document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Sync Aria widget
  syncAriaLabel(lang);
}

window.applyLang = applyLang;

// ══════════════════════════════════════════════════════════════════════════════
// Aria widget — language sync
// ══════════════════════════════════════════════════════════════════════════════
function syncAriaLabel(lang) {
  const widget = document.getElementById('ariaWidget');
  if (!widget) return;
  widget.setAttribute('action-text', ARIA_LABELS[lang] || ARIA_LABELS.en);
  widget.setAttribute('override-language', lang);
  widget.setAttribute('override-first-message', ARIA_FIRST_MSG[lang] || ARIA_FIRST_MSG.en);
  injectAriaPillStyle(widget);
}

function injectAriaPillStyle(widget) {
  if (!widget || !widget.shadowRoot) return;
  if (widget.shadowRoot.getElementById('aria-pill-style')) return;
  const s = document.createElement('style');
  s.id = 'aria-pill-style';
  // SAFE minimal CSS — only target the action-text pill and branding.
  // Never override background of internal card elements (white on white = invisible).
  // ElevenLabs's own dark ocean card design is kept as-is (matches our palette).
  s.textContent = `
    /* ── Pill trigger — white / sky-blue ── */
    [class*="action-text"], [class*="ActionText"],
    [class*="prompt-text"], [class*="PromptText"],
    [data-testid="action-text"],
    button[part="action-text"] {
      background: rgba(255,255,255,0.97) !important;
      color: #0A2540 !important;
      border: 1.5px solid rgba(74,159,213,0.55) !important;
      border-radius: 100px !important;
      letter-spacing: 0.07em !important;
      font-weight: 500 !important;
      font-size: 0.82rem !important;
      padding: 11px 22px !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      box-shadow:
        0 4px 18px rgba(10,37,64,0.13),
        0 1px 4px rgba(74,159,213,0.18) !important;
      white-space: nowrap !important;
    }

    /* ── Hide ElevenLabs branding ── */
    a[href*="elevenlabs"],
    [class*="powered" i],
    [class*="branding" i] {
      display: none !important;
    }
  `;
  widget.shadowRoot.appendChild(s);
}

// ══════════════════════════════════════════════════════════════════════════════
// Custom Cursor (desktop only)
// ══════════════════════════════════════════════════════════════════════════════
(function initCursor() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  if (isTouch) {
    if (cursor)   cursor.style.display   = 'none';
    if (follower) follower.style.display = 'none';
    return;
  }
  if (!cursor || !follower) return;

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  (function animateFollower() {
    fx += (mx - fx) * 0.10;
    fy += (my - fy) * 0.10;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animateFollower);
  })();

  document.querySelectorAll('a, button, .property-card, .why-card, .pain-card, .price-plan, .location-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('focus', () => document.body.classList.add('cursor-text'));
    el.addEventListener('blur',  () => document.body.classList.remove('cursor-text'));
  });

  document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));
  document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));
})();

// ══════════════════════════════════════════════════════════════════════════════
// Preloader
// ══════════════════════════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
    // Trigger hero reveals after preloader clears
    document.querySelectorAll('.hero .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 80 + i * 120);
    });
  }, 700);
});

// ══════════════════════════════════════════════════════════════════════════════
// Nav — scroll state
// ══════════════════════════════════════════════════════════════════════════════
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ══════════════════════════════════════════════════════════════════════════════
// Mobile Nav
// ══════════════════════════════════════════════════════════════════════════════
const mobileNav   = document.getElementById('mobileNav');
const navBurger   = document.getElementById('navBurger');
const mobileClose = document.getElementById('mobileNavClose');
const ariaWrap    = document.getElementById('ariaWidgetWrap');

const EL_SELECTOR = 'elevenlabs-convai, [class*="elevenlabs"], iframe[src*="elevenlabs"]';

function openMobileNav() {
  if (mobileNav) mobileNav.classList.add('active');
  document.body.classList.add('mobile-nav-open');
  document.body.style.overflow = 'hidden';
  if (ariaWrap) ariaWrap.style.display = 'none';
  document.querySelectorAll(EL_SELECTOR).forEach(el => {
    el.style.visibility = 'hidden';
    el.style.pointerEvents = 'none';
  });
}

function closeMobileNav() {
  if (mobileNav) mobileNav.classList.remove('active');
  document.body.classList.remove('mobile-nav-open');
  document.body.style.overflow = '';
  if (ariaWrap) ariaWrap.style.display = '';
  document.querySelectorAll(EL_SELECTOR).forEach(el => {
    el.style.visibility = '';
    el.style.pointerEvents = '';
  });
}

if (navBurger)   navBurger.addEventListener('click', openMobileNav);
if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

// Tap backdrop to close
if (mobileNav) {
  mobileNav.addEventListener('pointerdown', e => {
    if (e.target === mobileNav) closeMobileNav();
  });
}

document.querySelectorAll('.mobile-nav-links a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

// ── Language buttons ──────────────────────────────────────────────────────────
document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyLang(btn.dataset.lang);
    if (btn.classList.contains('mobile-lang-btn')) closeMobileNav();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Parallax Engine — smooth LERP RAF loop
// ══════════════════════════════════════════════════════════════════════════════
const heroParallax      = document.getElementById('heroParallax');
const lifestyleSection  = document.getElementById('lifestyleParallax');
const lifestyleBg       = lifestyleSection ? lifestyleSection.querySelector('.lifestyle-bg-img') : null;

const _lerp = (a, b, t) => a + (b - a) * t;
const LERP_SPEED = 0.07;

let rawScrollY    = window.scrollY;
let smoothScrollY = rawScrollY;
let heroSmooth    = 0;
let lifestyleSmooth = 0;

window.addEventListener('scroll', () => { rawScrollY = window.scrollY; }, { passive: true });

(function parallaxLoop() {
  smoothScrollY = _lerp(smoothScrollY, rawScrollY, LERP_SPEED);

  // Hero image parallax
  if (heroParallax && rawScrollY < window.innerHeight * 1.5) {
    heroSmooth = _lerp(heroSmooth, smoothScrollY * 0.25, LERP_SPEED);
    heroParallax.style.transform = `scale(1.08) translateY(${heroSmooth}px)`;
  }

  // Lifestyle section parallax
  if (lifestyleBg && lifestyleSection) {
    const rect = lifestyleSection.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      const offset = (window.innerHeight / 2 - rect.top) * 0.15;
      lifestyleSmooth = _lerp(lifestyleSmooth, offset, LERP_SPEED);
      lifestyleBg.style.transform = `translateY(${lifestyleSmooth}px)`;
    }
  }

  requestAnimationFrame(parallaxLoop);
})();

// ══════════════════════════════════════════════════════════════════════════════
// Scroll Reveal
// ══════════════════════════════════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const delay = parseInt(entry.target.dataset.delay || '0');
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up, .reveal-card').forEach(el => {
  if (!el.closest('.hero')) revealObserver.observe(el);
});

// ══════════════════════════════════════════════════════════════════════════════
// Hero Stats Counter Animation
// ══════════════════════════════════════════════════════════════════════════════
function animateCounter(el, target, prefix, suffix) {
  const duration = 1800;
  const start = performance.now();
  const isFloat = target.toString().includes('.');

  (function update(now) {
    const elapsed = Math.min((now - start) / duration, 1);
    const eased   = 1 - Math.pow(1 - elapsed, 3);
    const val = isFloat
      ? (eased * parseFloat(target)).toFixed(1)
      : Math.round(eased * parseInt(target));
    el.textContent = prefix + val + suffix;
    if (elapsed < 1) requestAnimationFrame(update);
  })(performance.now());
}

const statsData = [
  { prefix: '',  val: '120', suffix: '+' },
  { prefix: '€', val: '2.4', suffix: 'B' },
  { prefix: '',  val: '15',  suffix: '+' },
];

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const nums = entry.target.querySelectorAll('.stat-num');
    nums.forEach((el, i) => {
      if (statsData[i]) animateCounter(el, statsData[i].val, statsData[i].prefix, statsData[i].suffix);
    });
    statsObserver.unobserve(entry.target);
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ══════════════════════════════════════════════════════════════════════════════
// Property Filter
// ══════════════════════════════════════════════════════════════════════════════
const filterBtns     = document.querySelectorAll('.filter-btn');
const propertyCards  = document.querySelectorAll('.property-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    // First, ensure all cards are visible (reset display)
    propertyCards.forEach(card => { card.style.display = ''; });

    propertyCards.forEach(card => {
      const show = filter === 'all' || card.dataset.type === filter;
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      if (show) {
        card.style.opacity = '1';
        card.style.transform = '';
        card.style.pointerEvents = '';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.96)';
        card.style.pointerEvents = 'none';
        setTimeout(() => {
          if (!btn.classList.contains('active')) return;
          if (card.dataset.type !== filter) card.style.display = 'none';
        }, 360);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Quote Strip — pause on hover
// ══════════════════════════════════════════════════════════════════════════════
const quoteTrack = document.querySelector('.quote-track');
if (quoteTrack) {
  quoteTrack.addEventListener('mouseenter', () => quoteTrack.style.animationPlayState = 'paused');
  quoteTrack.addEventListener('mouseleave', () => quoteTrack.style.animationPlayState = 'running');
}

// ══════════════════════════════════════════════════════════════════════════════
// Demo Form — Web3Forms + Supabase CRM
// ══════════════════════════════════════════════════════════════════════════════
const W3F_KEY       = '1fb778bd-80cc-4c24-be65-904282e7b356';
const FORM_LOAD_TS  = Date.now();
const RATE_KEY      = 'meridian_last_submit';
const RATE_MS       = 20 * 60 * 1000; // 20 min

const SUPA_URL = 'https://jdvivkzggloetuakbqky.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkdml2a3pnZ2xvZXR1YWticWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTk4MjYsImV4cCI6MjA4OTczNTgyNn0.HGVDXVwW4skDFjbdiN-eOoThnQRNS0Mwa84Wm6oEQws';

async function saveToCRM(data) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/realty_leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ ...data, page_url: 'jares-ai.com/realty' }),
    });
  } catch (err) {
    console.warn('[CRM] Supabase save failed:', err);
  }
}

const demoForm = document.getElementById('demoForm');
if (demoForm) {
  demoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('[type="submit"]');
    const dict = (window.REALTY_I18N && currentLang) ? window.REALTY_I18N[currentLang] : null;
    const t = (k, fb) => (dict && dict[k]) || fb;

    // 1. Honeypot
    const hp = form.querySelector('#hpotField');
    if (hp && hp.value !== '') return;

    // 2. Timing (bot guard)
    if (Date.now() - FORM_LOAD_TS < 4000) return;

    // 3. Rate limit
    const last = localStorage.getItem(RATE_KEY);
    if (last && (Date.now() - parseInt(last)) < RATE_MS) {
      const orig = btn.textContent;
      btn.textContent = t('form.rateLimit', 'Please wait 20 min before resubmitting');
      setTimeout(() => { btn.textContent = orig; }, 4000);
      return;
    }

    // 4. Required fields
    const agency = form.querySelector('#fagency')?.value.trim() || '';
    const name   = form.querySelector('#fname')?.value.trim()   || '';
    const phone  = form.querySelector('#fphone')?.value.trim()  || '';
    if (!agency || !name || !phone) return;

    const origText = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: W3F_KEY,
          subject:    `🏠 Новая заявка на демо MERIDIAN — ${agency}`,
          from_name:  'MERIDIAN Aria Demo Form',
          agency, name, phone,
          email:  form.querySelector('#femail')?.value.trim() || '—',
          source: 'jares-ai.com/realty',
          lang:   currentLang || 'en',
          botcheck: '',
        })
      });
      const json = await res.json();

      if (json.success) {
        localStorage.setItem(RATE_KEY, Date.now().toString());
        saveToCRM({
          source:      'form',
          name,
          phone,
          agency_name: agency,
          email:       form.querySelector('#femail')?.value.trim() || null,
          lang:        currentLang || 'en',
        });
        btn.textContent = t('form.sent', 'Request sent ✓');
        btn.style.background = 'linear-gradient(135deg,#1a5c2a,#2d8a42)';
        btn.disabled = false;
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.background = '';
          form.reset();
        }, 4500);
      } else {
        throw new Error('api');
      }
    } catch {
      btn.textContent = t('form.error', 'Error — try again');
      btn.style.background = 'linear-gradient(135deg,#7a1f1f,#b03030)';
      btn.disabled = false;
      setTimeout(() => { btn.textContent = origText; btn.style.background = ''; }, 4000);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Aria Client Tools — save_lead
// ══════════════════════════════════════════════════════════════════════════════
function _ariaToolHandlers() {
  return {
    save_lead: async (params) => {
      const { client_name, phone, email, agency_name, interest, lang } = params || {};
      console.log('[Aria] save_lead called:', params);

      try {
        await saveToCRM({
          source:      'aria_voice',
          name:        client_name  || null,
          phone:       phone        || null,
          email:       email        || null,
          agency_name: agency_name  || null,
          interest:    interest     || null,
          lang:        lang || currentLang || 'en',
        });
        console.log('[Aria] CRM saved OK');
      } catch (e) {
        console.error('[Aria] CRM save failed:', e);
      }

      // Pre-fill form fields
      const fill = (id, val) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el && !el.value) el.value = val;
      };
      fill('fname',   client_name);
      fill('fphone',  phone);
      fill('femail',  email);
      fill('fagency', agency_name);

      return {
        success: true,
        message: 'Contact information saved. Our team will reach out within a few hours!',
      };
    },
  };
}

function initAriaClientTools() {
  const widget = document.getElementById('ariaWidget') || document.querySelector('elevenlabs-convai');
  if (!widget) return false;
  widget.clientTools = _ariaToolHandlers();
  console.log('[Aria] clientTools registered');
  return true;
}

// 3-layer registration (immediate → whenDefined → interval poll)
if (!initAriaClientTools()) {
  customElements.whenDefined('elevenlabs-convai').then(() => {
    if (!initAriaClientTools()) {
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (initAriaClientTools() || attempts > 40) clearInterval(poll);
      }, 300);
    }
  });
}

document.addEventListener('elevenlabs-convai:call_started', () => {
  initAriaClientTools();
  console.log('[Aria] clientTools re-registered on call_started');
});

// ══════════════════════════════════════════════════════════════════════════════
// Aria widget — deferred init
// ══════════════════════════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  setTimeout(() => syncAriaLabel(currentLang || 'en'), 400);
});
setTimeout(() => syncAriaLabel(currentLang || 'en'), 1500);
setTimeout(() => syncAriaLabel(currentLang || 'en'), 3500);

// ══════════════════════════════════════════════════════════════════════════════
// Smooth Anchor Navigation
// ══════════════════════════════════════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 80,
      behavior: 'smooth'
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Magnetic Buttons
// ══════════════════════════════════════════════════════════════════════════════
document.querySelectorAll('.btn-primary, .btn-outline, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${cx * 0.14}px, ${cy * 0.14}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    setTimeout(() => btn.style.transition = '', 400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Golden Particles on Click
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('click', e => {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    const angle = (i / 8) * Math.PI * 2;
    const v     = 40 + Math.random() * 60;
    p.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;background:hsl(${38 + Math.random() * 15},70%,${55 + Math.random() * 20}%);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);`;
    document.body.appendChild(p);
    p.animate([
      { opacity: 1, transform: 'translate(-50%,-50%) translate(0,0) scale(1)' },
      { opacity: 0, transform: `translate(-50%,-50%) translate(${Math.cos(angle)*v}px,${Math.sin(angle)*v}px) scale(0)` },
    ], {
      duration: 500 + Math.random() * 300,
      easing: 'cubic-bezier(.25,.46,.45,.94)',
      fill: 'forwards',
    }).onfinish = () => p.remove();
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Aria Voice Status Indicator — live state badge near the widget
// ══════════════════════════════════════════════════════════════════════════════
(function initAriaStatusBadge() {
  // Inject the badge into the page
  const badge = document.createElement('div');
  badge.id = 'ariaStatusBadge';
  badge.setAttribute('aria-live', 'polite');
  badge.style.cssText = `
    position: fixed;
    bottom: 92px;
    right: 28px;
    z-index: 9989;
    display: none;
    align-items: center;
    gap: 8px;
    padding: 7px 14px 7px 10px;
    background: rgba(10, 37, 64, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(74, 159, 213, 0.30);
    border-radius: 100px;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.88);
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform: translateY(6px);
    opacity: 0;
  `;

  // Dot element
  const dot = document.createElement('span');
  dot.id = 'ariaStatusDot';
  dot.style.cssText = `
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4A9FD5;
    flex-shrink: 0;
  `;

  const label = document.createElement('span');
  label.id = 'ariaStatusLabel';

  badge.appendChild(dot);
  badge.appendChild(label);
  document.body.appendChild(badge);

  // Waveform bars (shown only during speaking)
  const barsWrap = document.createElement('span');
  barsWrap.id = 'ariaWaveBars';
  barsWrap.style.cssText = 'display:inline-flex;gap:2px;align-items:center;margin-left:2px;';
  for (let i = 0; i < 4; i++) {
    const bar = document.createElement('span');
    bar.style.cssText = `
      display: inline-block;
      width: 2.5px;
      background: #4A9FD5;
      border-radius: 2px;
      animation: ariaWaveBar ${0.5 + i * 0.13}s ease-in-out infinite alternate;
      animation-delay: ${i * 0.08}s;
    `;
    barsWrap.appendChild(bar);
  }
  badge.appendChild(barsWrap);

  // Inject keyframes for waveform animation
  if (!document.getElementById('aria-wave-kf')) {
    const kfStyle = document.createElement('style');
    kfStyle.id = 'aria-wave-kf';
    kfStyle.textContent = `
      @keyframes ariaWaveBar {
        from { height: 3px; }
        to   { height: 13px; }
      }
      @keyframes ariaStatusDotPulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.35; }
      }
    `;
    document.head.appendChild(kfStyle);
  }

  // Status text by language
  const STATUS_LABELS = {
    listening: { en: 'Aria is listening', de: 'Aria hört zu',   fr: 'Aria vous écoute', es: 'Aria escucha', ru: 'Aria слушает' },
    thinking:  { en: 'Aria is thinking',  de: 'Aria denkt nach', fr: 'Aria réfléchit',   es: 'Aria piensa',  ru: 'Aria думает'  },
    speaking:  { en: 'Aria is speaking',  de: 'Aria spricht',    fr: 'Aria parle',       es: 'Aria habla',   ru: 'Aria говорит' },
  };

  function showBadge(state) {
    const lang  = window.currentLang || 'en';
    const texts = STATUS_LABELS[state] || STATUS_LABELS.listening;
    label.textContent = texts[lang] || texts.en;

    // Dot + bars styling per state
    const isSpeaking  = state === 'speaking';
    const isThinking  = state === 'thinking';
    dot.style.background = isSpeaking ? '#C9A96E'
                         : isThinking ? '#A8D4F0'
                         : '#4A9FD5';
    dot.style.animation  = isThinking
      ? 'ariaStatusDotPulse 1s ease-in-out infinite'
      : 'none';
    barsWrap.style.display  = isSpeaking ? 'inline-flex' : 'none';

    badge.style.display   = 'flex';
    // Force reflow for transition
    badge.getBoundingClientRect();
    badge.style.opacity   = '1';
    badge.style.transform = 'translateY(0)';
  }

  function hideBadge() {
    badge.style.opacity   = '0';
    badge.style.transform = 'translateY(6px)';
    setTimeout(() => { badge.style.display = 'none'; }, 320);
  }

  // Listen to ElevenLabs Convai events
  document.addEventListener('elevenlabs-convai:call_started',   () => showBadge('listening'));
  document.addEventListener('elevenlabs-convai:call_ended',     () => hideBadge());
  document.addEventListener('elevenlabs-convai:listening',      () => showBadge('listening'));
  document.addEventListener('elevenlabs-convai:processing',     () => showBadge('thinking'));
  document.addEventListener('elevenlabs-convai:speaking',       () => showBadge('speaking'));

  // Also watch for user_transcript / agent_response events via MutationObserver
  // on the widget's shadow DOM conversation events (fallback)
  document.addEventListener('elevenlabs-convai:user_transcript',  () => showBadge('thinking'));
  document.addEventListener('elevenlabs-convai:agent_response',   () => showBadge('speaking'));

  // Graceful fallback: watch widget's custom events via the element
  function attachWidgetEvents(widget) {
    if (!widget || widget._ariaEventsAttached) return;
    widget._ariaEventsAttached = true;

    widget.addEventListener('user_transcript',  () => showBadge('thinking'));
    widget.addEventListener('agent_response',   () => showBadge('speaking'));
    widget.addEventListener('conversation_initiation_metadata', () => showBadge('listening'));
  }

  const checkWidget = setInterval(() => {
    const w = document.getElementById('ariaWidget') || document.querySelector('elevenlabs-convai');
    if (w) { attachWidgetEvents(w); clearInterval(checkWidget); }
  }, 800);
})();

// ══════════════════════════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  applyLang('en');
});
