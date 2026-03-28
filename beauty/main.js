'use strict';

// ==========================================
// CUSTOM CURSOR (desktop only)
// ==========================================
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

if (!isTouchDevice()) {
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  function animateCursor() {
    followerX += (mouseX - followerX) * 0.08;
    followerY += (mouseY - followerY) * 0.08;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, .service-card, .gallery-item, .t-nav-btn, select').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-text'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-text'));
  });

  document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));
  document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));
} else {
  // Touch: hide cursor elements
  if (cursor) cursor.style.display = 'none';
  if (cursorFollower) cursorFollower.style.display = 'none';
}

// ==========================================
// PRELOADER
// ==========================================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
    document.querySelectorAll('.hero .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 80 + i * 120);
    });
  }, 600);
});

// ==========================================
// NAVIGATION SCROLL STATE
// ==========================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// ==========================================
// MOBILE NAVIGATION
// ==========================================
const navBurger = document.getElementById('navBurger');
const mobileOverlay = document.createElement('div');
mobileOverlay.className = 'mobile-nav-overlay';
mobileOverlay.innerHTML = `
  <button class="mobile-nav-close" id="mobileNavClose">✕</button>
  <a href="#about" data-i18n="nav.about">About</a>
  <a href="#services" data-i18n="nav.services">Services</a>
  <a href="#gallery" data-i18n="nav.gallery">Gallery</a>
  <a href="#team" data-i18n="nav.team">Masters</a>
  <a href="#contact" data-i18n="nav.contact">Contact</a>
  <a href="#contact" data-i18n="nav.cta" style="color: var(--gold);">Book Now</a>
`;
document.body.appendChild(mobileOverlay);

navBurger.addEventListener('click', () => mobileOverlay.classList.add('open'));
document.getElementById('mobileNavClose').addEventListener('click', () => mobileOverlay.classList.remove('open'));
mobileOverlay.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileOverlay.classList.remove('open'));
});

// ==========================================
// PARALLAX ENGINE (RAF throttled)
// ==========================================
const heroParallax = document.getElementById('heroParallax');
const parallaxBannerBg = document.getElementById('parallaxBannerBg');
const parallaxBanner = document.getElementById('parallaxBanner');

const parallaxSections = [
  { el: document.querySelector('.about-bg-figure'),       speed: 0.12 },
  { el: document.querySelector('.about-img-1'),            speed: -0.08 },
  { el: document.querySelector('.about-img-2'),            speed: 0.10 },
  { el: document.querySelector('.services-bg'),            speed: 0.06 },
  { el: document.querySelector('.parallax-banner-figure'), speed: -0.10 },
  { el: document.querySelector('.testimonials-bg-figure'), speed: 0.09 },
  { el: document.querySelector('.contact-bg'),             speed: -0.06 },
];

function updateHeroParallax() {
  const scrollY = window.scrollY;
  if (scrollY < window.innerHeight * 1.5 && heroParallax) {
    heroParallax.style.transform = `translateY(${scrollY * 0.32}px)`;
  }
}

function updateBannerParallax() {
  if (!parallaxBanner || !parallaxBannerBg) return;
  const rect = parallaxBanner.getBoundingClientRect();
  if (rect.bottom > 0 && rect.top < window.innerHeight) {
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    parallaxBannerBg.style.transform = `translateY(${(progress - 0.5) * -100}px)`;
    const figure = parallaxBanner.querySelector('.parallax-banner-figure');
    if (figure) figure.style.transform = `translateY(${(progress - 0.5) * 40}px)`;
  }
}

function updateSectionParallax() {
  parallaxSections.forEach(({ el, speed }) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
    const vy = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
    el.style.transform = `translateY(${vy}px)`;
  });

  document.querySelectorAll('.gallery-item[data-parallax-speed]').forEach(item => {
    const rect = item.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
    const speed = parseFloat(item.dataset.parallaxSpeed);
    const vy = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
    item.style.transform = `translateY(${vy}px)`;
  });
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateHeroParallax();
      updateBannerParallax();
      updateSectionParallax();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// ==========================================
// SCROLL REVEAL
// ==========================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.delay || '0');
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal-up, .reveal-card, .reveal-gallery').forEach(el => {
  if (!el.closest('.hero')) revealObserver.observe(el);
});

// ==========================================
// GALLERY HOVER PARALLAX
// ==========================================
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    item.style.transform = `perspective(600px) rotateX(${cy * -4}deg) rotateY(${cx * 4}deg) scale(1.02)`;
  });
  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
    item.style.transition = 'transform 0.5s var(--ease-smooth)';
    setTimeout(() => item.style.transition = '', 500);
  });
});

// ==========================================
// SERVICE CARD TILT
// ==========================================
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) perspective(800px) rotateX(${cy * -3}deg) rotateY(${cx * 3}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ==========================================
// TESTIMONIALS SLIDER
// ==========================================
const testimonialCards = document.querySelectorAll('.testimonial-card');
const tDots = document.querySelectorAll('.t-dot');
let currentTestimonial = 0;
let testimonialTimer;

function showTestimonial(index) {
  testimonialCards[currentTestimonial].classList.remove('active');
  tDots[currentTestimonial].classList.remove('active');
  currentTestimonial = (index + testimonialCards.length) % testimonialCards.length;
  testimonialCards[currentTestimonial].classList.add('active');
  tDots[currentTestimonial].classList.add('active');
}

function startTestimonialTimer() {
  clearInterval(testimonialTimer);
  testimonialTimer = setInterval(() => showTestimonial(currentTestimonial + 1), 5000);
}

document.getElementById('tNext').addEventListener('click', () => { showTestimonial(currentTestimonial + 1); startTestimonialTimer(); });
document.getElementById('tPrev').addEventListener('click', () => { showTestimonial(currentTestimonial - 1); startTestimonialTimer(); });
tDots.forEach((dot, i) => dot.addEventListener('click', () => { showTestimonial(i); startTestimonialTimer(); }));
startTestimonialTimer();

// ==========================================
// CONTACT FORM
// ==========================================
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  const orig = btn.textContent;
  const dict = (window.i18n && window.currentLang) ? window.i18n[window.currentLang] : null;
  btn.textContent = (dict && dict['form.sent']) || 'Request sent ✓';
  btn.style.background = 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; e.target.reset(); }, 3500);
});

// ==========================================
// SMOOTH ANCHOR NAVIGATION
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});

// ==========================================
// MAGNETIC BUTTONS
// ==========================================
document.querySelectorAll('.btn-primary, .btn-outline, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${cx * 0.15}px, ${cy * 0.15}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.transition = 'transform 0.4s var(--ease-elastic)';
    setTimeout(() => btn.style.transition = '', 400);
  });
});

// ==========================================
// GOLDEN PARTICLES ON CLICK
// ==========================================
document.addEventListener('click', (e) => {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    const angle = (i / 8) * Math.PI * 2;
    const v = 40 + Math.random() * 60;
    p.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;background:hsl(${40 + Math.random() * 20},80%,${55 + Math.random() * 20}%);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);`;
    document.body.appendChild(p);
    p.animate([
      { opacity: 1, transform: 'translate(-50%,-50%) translate(0,0) scale(1)' },
      { opacity: 0, transform: `translate(-50%,-50%) translate(${Math.cos(angle)*v}px,${Math.sin(angle)*v}px) scale(0)` }
    ], { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' }).onfinish = () => p.remove();
  }
});

// ==========================================
// QUOTE STRIP PAUSE ON HOVER
// ==========================================
const quoteTrack = document.querySelector('.quote-track');
if (quoteTrack) {
  quoteTrack.addEventListener('mouseenter', () => quoteTrack.style.animationPlayState = 'paused');
  quoteTrack.addEventListener('mouseleave', () => quoteTrack.style.animationPlayState = 'running');
}

// ==========================================
// TEAM CARD HOVER
// ==========================================
document.querySelectorAll('.team-card').forEach(card => {
  const photo = card.querySelector('.team-photo');
  card.addEventListener('mouseenter', () => { photo.style.boxShadow = '0 0 0 4px rgba(212,160,23,0.15), 0 0 40px rgba(212,160,23,0.2)'; });
  card.addEventListener('mouseleave', () => { photo.style.boxShadow = ''; });
});
