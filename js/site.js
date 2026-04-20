/**
 * Maydeni AI — Site Web JS
 */

// ═══════════════════════════════════════════════════════════
// SÉQUENCE D'ENTRÉE MAYDENI
//   1. Vidéo d'ouverture plein écran (intro.mp4, 4,6 s)
//   2. Vidéo de présentation avatar (presentation.mp4, 76 s)
//   3. Intro AI Neural Genesis (MAYDENI + Dr. Slim Lamouchi)
//   4. Site
//
// L'AI Neural Genesis (étape 3) est masquée en HTML via style="display:none"
// pour que SES @keyframes ne tournent pas pendant les étapes 1 et 2. Elle est
// ensuite clonée-remplacée pour forcer un redémarrage propre des animations
// CSS (technique garantie par la spec DOM).
// ═══════════════════════════════════════════════════════════

// Durée totale de l'AI Neural Genesis (en ms). Le crédit Dr. Slim Lamouchi
// s'affiche à ~9,5 s, le fondu de sortie `introExit` démarre à 12 s et dure
// 1,2 s. On laisse 13,8 s pour que tout soit confortablement visible avant
// d'entrer sur le site.
const AI_INTRO_DURATION_MS = 13800;

// ─── 1. Vidéo d'ouverture plein écran ────────────────────
// Attend que le navigateur ait assez buffé (`canplay`) avant de lancer la
// lecture, pour éliminer tout stutter / freeze au démarrage.
function setupOpeningVideo() {
  const overlay = document.getElementById('video-intro-overlay');
  const video   = document.getElementById('video-intro');
  const skipBtn = document.getElementById('video-intro-skip');
  if (!overlay || !video) {
    setupPresentationVideo();
    return;
  }

  let played = false;
  const hide = () => {
    if (overlay.classList.contains('is-hidden')) return;
    overlay.classList.add('is-hidden');
    setTimeout(() => {
      overlay.remove();
      setupPresentationVideo();
    }, 700);
  };

  // Démarre la lecture seulement quand il y a assez de buffer pour lire
  // fluidement. Évite tout freeze visible au début.
  const start = () => {
    if (played) return;
    played = true;
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { hide(); });
    }
  };

  if (video.readyState >= 3) {
    start();
  } else {
    video.addEventListener('canplay', start, { once: true });
    // Garde-fou : si le réseau est très lent, on démarre quand même au bout
    // d'1 s pour ne pas bloquer l'utilisateur.
    setTimeout(start, 1000);
  }

  video.addEventListener('ended', hide, { once: true });
  video.addEventListener('error', hide, { once: true });
  skipBtn?.addEventListener('click', hide);

  // Safety net : intro.mp4 fait 4,6 s. 12 s max couvre largement même avec
  // un réseau lent. Au-delà, on passe à la suite sans bloquer l'utilisateur.
  setTimeout(hide, 12000);
}

// ─── 3. Intro AI Neural Genesis (étape finale avant le site) ──
// Clone-replace pour redémarrage garanti de toutes les @keyframes CSS,
// puis efface l'overlay pour révéler le site.
function playAiNeuralGenesis() {
  const intro = document.getElementById('intro-overlay');
  if (!intro) return; // site directement visible

  const fresh = intro.cloneNode(true);
  fresh.style.display = '';
  intro.parentNode.replaceChild(fresh, intro);

  // Redémarre le moteur canvas sur le nouveau <canvas>.
  if (typeof window.initMaydeniIntroCanvas === 'function') {
    try { window.initMaydeniIntroCanvas(); } catch (e) { /* ignore */ }
  }

  setTimeout(() => {
    const current = document.getElementById('intro-overlay');
    if (current) current.style.display = 'none';
  }, AI_INTRO_DURATION_MS);
}

// ─── 2. Vidéo de présentation (avatar) dans cadre futuriste ──
// Enchaîne sur l'intro AI Neural Genesis à la fin / skip / erreur.
function setupPresentationVideo() {
  const overlay = document.getElementById('presentation-overlay');
  const video   = document.getElementById('presentation-video');
  const skipBtn = document.getElementById('presentation-skip');
  const soundBtn = document.getElementById('presentation-sound');
  if (!overlay || !video) {
    playAiNeuralGenesis();
    return;
  }

  const hide = () => {
    if (overlay.classList.contains('is-leaving')) return;
    overlay.classList.add('is-leaving');
    try { video.pause(); } catch (e) { /* ignore */ }
    setTimeout(() => {
      overlay.remove();
      playAiNeuralGenesis();
    }, 700);
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

// ─── Bootstrap : séquence orchestrée
//   setupOpeningVideo → setupPresentationVideo → playAiNeuralGenesis → site
//   (aucun setTimeout concurrent ici : chaque étape enchaîne la suivante).
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
