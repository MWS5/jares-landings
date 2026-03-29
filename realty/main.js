/**
 * MERIDIAN — Luxury Real Estate Landing JS
 * Aria AI Agent · JARES AI
 */

'use strict';

// ── i18n ──────────────────────────────────────────────────────────────────────
let currentLang = 'en';

const ARIA_LABELS = {
  en: '✦ Speak with Aria', de: '✦ Mit Aria sprechen',
  fr: '✦ Parler à Aria',   es: '✦ Hablar con Aria', ru: '✦ Говорить с Арией',
};
const ARIA_FIRST_MSG = {
  en: 'Welcome to MERIDIAN. I\'m Aria, your personal property consultant. Are you looking to buy, invest, or simply explore our portfolio?',
  de: 'Willkommen bei MERIDIAN. Ich bin Aria, Ihre persönliche Immobilienberaterin. Suchen Sie nach einer Immobilie zum Kauf oder zur Investition?',
  fr: 'Bienvenue chez MERIDIAN. Je suis Aria, votre conseillère immobilière personnelle. Vous cherchez à acheter, investir ou explorer notre portfolio?',
  es: 'Bienvenido a MERIDIAN. Soy Aria, su consultora inmobiliaria personal. ¿Busca comprar, invertir o explorar nuestro portfolio?',
  ru: 'Добро пожаловать в MERIDIAN. Я Ария, ваш персональный консультант по недвижимости. Вы хотите купить, инвестировать или познакомиться с нашим портфолио?',
};

function applyLang(lang) {
  if (!window.REALTY_I18N || !window.REALTY_I18N[lang]) return;
  currentLang = lang;
  const dict = window.REALTY_I18N[lang];

  // Text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  // Lang button active state (both nav and mobile)
  document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Sync Aria widget language
  syncAriaLabel(lang);
}

function syncAriaLabel(lang) {
  const widget = document.getElementById('ariaWidget');
  if (!widget) return;
  widget.setAttribute('action-text', ARIA_LABELS[lang] || ARIA_LABELS.en);
  widget.setAttribute('override-language', lang);
  widget.setAttribute('override-first-message', ARIA_FIRST_MSG[lang] || ARIA_FIRST_MSG.en);
}

// ── Cursor ────────────────────────────────────────────────────────────────────
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  function animateFollower() {
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  document.querySelectorAll('a, button, .pain-card, .price-plan, .social-quote').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('focus', () => document.body.classList.add('cursor-text'));
    el.addEventListener('blur',  () => document.body.classList.remove('cursor-text'));
  });
})();

// ── Preloader ─────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
  }, 900);
});

// ── Nav scroll state ──────────────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Mobile nav ────────────────────────────────────────────────────────────────
const mobileNav   = document.getElementById('mobileNav');
const navBurger   = document.getElementById('navBurger');
const mobileClose = document.getElementById('mobileNavClose');
const ariaWrap    = document.getElementById('ariaWidgetWrap');

function openMobileNav() {
  if (mobileNav) mobileNav.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (ariaWrap) ariaWrap.style.display = 'none';
}
function closeMobileNav() {
  if (mobileNav) mobileNav.classList.remove('active');
  document.body.style.overflow = '';
  if (ariaWrap) ariaWrap.style.display = '';
}

if (navBurger)   navBurger.addEventListener('click', openMobileNav);
if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

document.querySelectorAll('.mobile-nav-links a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

// ── Language switchers ────────────────────────────────────────────────────────
document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyLang(btn.dataset.lang);
    if (btn.classList.contains('mobile-lang-btn')) closeMobileNav();
  });
});

// ── Parallax ──────────────────────────────────────────────────────────────────
const parallaxItems = [
  { el: document.querySelector('#heroParallax'),         speed:  0.12, cur: 0 },
  { el: document.querySelector('.parallax-banner-bg'),   speed: -0.08, cur: 0 },
  { el: document.querySelector('.contact-bg'),           speed: -0.05, cur: 0 },
].filter(p => p.el);

parallaxItems.forEach(p => { p.el.style.willChange = 'transform'; });

let smoothScrollY = 0;
let rawScrollY = 0;
let rafScheduled = false;

function lerp(a, b, t) { return a + (b - a) * t; }

function parallaxTick() {
  smoothScrollY = lerp(smoothScrollY, rawScrollY, 0.07);
  parallaxItems.forEach(p => {
    const target = smoothScrollY * p.speed;
    p.cur = lerp(p.cur, target, 0.12);
    p.el.style.transform = `translateY(${p.cur}px)`;
  });
  rafScheduled = false;
  if (Math.abs(smoothScrollY - rawScrollY) > 0.1) {
    rafScheduled = true;
    requestAnimationFrame(parallaxTick);
  }
}

window.addEventListener('scroll', () => {
  rawScrollY = window.scrollY;
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(parallaxTick);
  }
}, { passive: true });

// ── Scroll reveal ─────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const delay = parseInt(entry.target.dataset.delay || 0);
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up, .reveal-card').forEach(el => {
  revealObserver.observe(el);
});

// ── Demo form ─────────────────────────────────────────────────────────────────
const demoForm = document.getElementById('demoForm');
if (demoForm) {
  demoForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = demoForm.querySelector('[type="submit"]');
    if (btn) {
      btn.textContent = '✓ Sent!';
      btn.style.opacity = '0.7';
      btn.disabled = true;
    }
    // TODO: integrate with JARES backend / Supabase / Telegram notification
  });
}

// ── Init i18n on load ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyLang('en');
});
