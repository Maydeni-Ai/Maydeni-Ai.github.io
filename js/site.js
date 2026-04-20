/**
 * Maydeni AI — Site Web JS
 */

// ─── Séquence complète : vidéo d'ouverture → intro AI Neural Genesis →
//     vidéo de présentation (avatar) → site.
//
// Technique bulletproof : l'intro AI Neural Genesis est initialement masquée
// (display:none inline en HTML) donc AUCUNE de ses @keyframes ne tourne
// pendant que la vidéo d'ouverture joue. Quand la vidéo se termine, on
// *clone* le nœud DOM de l'intro : c'est garanti par la spec de redémarrer
// toutes ses animations CSS et celles de ses enfants depuis 0 (bien plus
// fiable que `display:none → flex` + reflow, qui dépend du navigateur).

// Durée totale de l'AI Neural Genesis (en ms) — le crédit Dr. Slim Lamouchi
// s'affiche à 9,5 s, le fondu de sortie démarre à 13 s. On laisse 14,5 s
// pour que tout soit confortablement visible avant la vidéo avatar.
const AI_INTRO_DURATION_MS = 14500;

// ─── Vidéo d'ouverture plein écran ──────────────────────
// Se ferme à la fin de la vidéo, sur clic "Passer", ou après 25 s max.
function setupOpeningVideo() {
  const overlay = document.getElementById('video-intro-overlay');
  const video   = document.getElementById('video-intro');
  const skipBtn = document.getElementById('video-intro-skip');
  if (!overlay || !video) {
    playAiIntroThenPresentation();
    return;
  }

  const hide = () => {
    if (overlay.classList.contains('is-hidden')) return;
    overlay.classList.add('is-hidden');
    setTimeout(() => {
      overlay.remove();
      playAiIntroThenPresentation();
    }, 800);
  };

  video.addEventListener('ended', hide, { once: true });
  video.addEventListener('error', hide, { once: true });
  skipBtn?.addEventListener('click', hide);
  setTimeout(hide, 25000);

  const tryPlay = video.play();
  if (tryPlay && typeof tryPlay.catch === 'function') {
    tryPlay.catch(() => { hide(); });
  }
}

// ─── Révèle l'intro AI Neural Genesis (clone-replace pour redémarrer
//     toutes les @keyframes à 0) puis enchaîne sur la vidéo de présentation.
function playAiIntroThenPresentation() {
  const intro = document.getElementById('intro-overlay');

  if (intro) {
    // Clone = reset garanti de toutes les animations CSS (intro + enfants).
    const fresh = intro.cloneNode(true);
    fresh.style.display = '';   // retire le display:none inline
    intro.parentNode.replaceChild(fresh, intro);

    // Redémarre le moteur canvas (AI Neural Genesis) sur le canvas cloné,
    // sinon il resterait noir (l'ancien moteur pointait sur le vieux canvas).
    if (typeof window.initMaydeniIntroCanvas === 'function') {
      try { window.initMaydeniIntroCanvas(); } catch (e) { /* ignore */ }
    }

    // Cache l'intro et lance la présentation quand l'AI intro a fini.
    setTimeout(() => {
      const current = document.getElementById('intro-overlay');
      if (current) current.style.display = 'none';
      setupPresentationVideo();
    }, AI_INTRO_DURATION_MS);
  } else {
    setupPresentationVideo();
  }
}

// ─── Vidéo de présentation (cadre futuriste) ──────────────
function setupPresentationVideo() {
  const overlay = document.getElementById('presentation-overlay');
  const video   = document.getElementById('presentation-video');
  const skipBtn = document.getElementById('presentation-skip');
  const soundBtn = document.getElementById('presentation-sound');
  if (!overlay || !video) return;

  const hide = () => {
    if (overlay.classList.contains('is-leaving')) return;
    overlay.classList.add('is-leaving');
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

// ─── Bootstrap : la séquence vidéo → intro AI → présentation est pilotée
//     uniquement par setupOpeningVideo + playAiIntroThenPresentation. Le
//     masquage final de l'intro est géré par playAiIntroThenPresentation
//     (surtout PAS un setTimeout concurrent ici, sinon ça coupe l'AI intro).
document.addEventListener('DOMContentLoaded', () => {
  setupOpeningVideo();
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
