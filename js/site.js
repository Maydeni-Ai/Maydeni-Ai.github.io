/**
 * Maydeni AI — Site Web JS
 */

// ─── Vidéo d'ouverture plein écran (1 fois par session) ──
// Joue la vidéo plein écran AVANT l'intro AI Neural Genesis.
// Se ferme à la fin, sur clic "Passer", ou après 20 s max.
function setupOpeningVideo() {
  const overlay = document.getElementById('video-intro-overlay');
  const video   = document.getElementById('video-intro');
  const skipBtn = document.getElementById('video-intro-skip');
  if (!overlay || !video) return;

  let alreadyShown = false;
  try { alreadyShown = sessionStorage.getItem('intro_played') === '1'; } catch (e) { /* ignore */ }

  if (alreadyShown) {
    overlay.remove();
    setupPresentationVideo();
    return;
  }

  const hide = () => {
    if (overlay.classList.contains('is-hidden')) return;
    overlay.classList.add('is-hidden');
    try { sessionStorage.setItem('intro_played', '1'); } catch (e) { /* ignore */ }
    setTimeout(() => {
      overlay.remove();
      setupPresentationVideo();
    }, 800);
  };

  video.addEventListener('ended', hide, { once: true });
  video.addEventListener('error', hide, { once: true });
  skipBtn?.addEventListener('click', hide);
  setTimeout(hide, 20000);

  const tryPlay = video.play();
  if (tryPlay && typeof tryPlay.catch === 'function') {
    tryPlay.catch(() => { hide(); });
  }
}

// ─── Vidéo de présentation (cadre futuriste) ──────────────
// Auto-skip si déjà vue dans la session.
function setupPresentationVideo() {
  const overlay = document.getElementById('presentation-overlay');
  const video   = document.getElementById('presentation-video');
  const skipBtn = document.getElementById('presentation-skip');
  const soundBtn = document.getElementById('presentation-sound');
  if (!overlay || !video) return;

  let alreadyShown = false;
  try { alreadyShown = sessionStorage.getItem('presentation_played') === '1'; } catch (e) { /* ignore */ }

  if (alreadyShown) {
    overlay.remove();
    return;
  }

  const hide = () => {
    if (overlay.classList.contains('is-leaving')) return;
    overlay.classList.add('is-leaving');
    try { sessionStorage.setItem('presentation_played', '1'); } catch (e) { /* ignore */ }
    try { video.pause(); } catch (e) { /* ignore */ }
    setTimeout(() => overlay.remove(), 750);
  };

  overlay.classList.add('is-visible');
  overlay.setAttribute('aria-hidden', 'false');

  video.addEventListener('ended', hide, { once: true });
  video.addEventListener('error', hide, { once: true });
  skipBtn?.addEventListener('click', hide);
  const onKey = (e) => { if (e.key === 'Escape') hide(); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('transitionend', () => {
    if (overlay.classList.contains('is-leaving')) document.removeEventListener('keydown', onKey);
  });

  soundBtn?.addEventListener('click', () => {
    video.muted = !video.muted;
    soundBtn.classList.toggle('is-on', !video.muted);
    soundBtn.setAttribute('aria-label', video.muted ? 'Activer le son' : 'Couper le son');
    if (!video.muted) {
      video.play().catch(() => { /* ignore */ });
    }
  });

  // Sous-titres anglais : on masque ::cue et on rend dans .pres-subtitle
  const ccBtn = document.getElementById('presentation-cc');
  const subEl = document.getElementById('pres-subtitle');
  let subsEnabled = true;

  const setTrackMode = () => {
    const t = video.textTracks && video.textTracks[0];
    if (!t) return;
    t.mode = 'hidden';
    if (!t._boundCueChange) {
      t.addEventListener('cuechange', () => {
        if (!subEl) return;
        const active = t.activeCues && t.activeCues.length ? t.activeCues[0] : null;
        if (subsEnabled && active && active.text) {
          subEl.textContent = active.text.replace(/<[^>]+>/g, '').trim();
          subEl.classList.add('is-visible');
        } else {
          subEl.classList.remove('is-visible');
          subEl.textContent = '';
        }
      });
      t._boundCueChange = true;
    }
  };
  if (video.textTracks && video.textTracks.length) setTrackMode();
  video.addEventListener('loadedmetadata', setTrackMode);

  ccBtn?.addEventListener('click', () => {
    subsEnabled = !subsEnabled;
    ccBtn.classList.toggle('is-on', subsEnabled);
    ccBtn.classList.toggle('is-off', !subsEnabled);
    ccBtn.setAttribute('aria-pressed', subsEnabled ? 'true' : 'false');
    if (!subsEnabled && subEl) {
      subEl.classList.remove('is-visible');
      subEl.textContent = '';
    }
  });

  setTimeout(hide, 90000);

  const tryPlay = video.play();
  if (tryPlay && typeof tryPlay.catch === 'function') {
    tryPlay.catch(() => { /* l'utilisateur pourra cliquer sur Suivant */ });
  }
}

// ─── Intro → disparition après 13s ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupOpeningVideo();

  setTimeout(() => {
    const intro = document.getElementById('intro-overlay');
    if (intro) intro.style.display = 'none';
  }, 13500);

  setupNavbar();
  setupSmoothScroll();
  setupAnimations();
});

// ─── Navbar scroll effect ────────────────────────────────
function setupNavbar() {
  const navbar = document.getElementById('navbar');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Mobile burger
  const burger = document.getElementById('burger-btn');
  if (burger) {
    burger.setAttribute('aria-label', 'Menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', () => {
      const links = document.querySelector('.nav-links');
      const isOpen = links.classList.toggle('mobile-open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Close menu when clicking a nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        const links = document.querySelector('.nav-links');
        links.classList.remove('mobile-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

// ─── Smooth scroll ───────────────────────────────────────
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── Scroll animations ──────────────────────────────────
function setupAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Observer les cartes features, download, security, steps
  document.querySelectorAll(
    '.feature-card, .download-card, .security-item, .step-card'
  ).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `all 0.6s ease ${i * 0.1}s`;
    observer.observe(el);
  });
}

// CSS class added by observer
const style = document.createElement('style');
style.textContent = `
  .visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(style);
