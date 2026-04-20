/**
 * Maydeni AI — Site Web JS
 */

// Mode "validation" : les 2 vidéos jouent à CHAQUE chargement (pas de
// sessionStorage). Pour revenir à "1 fois par session" plus tard, réactiver
// le garde-fou sessionStorage ci-dessous (clé versionnée à bumper à chaque
// changement de contenu vidéo : _vN).

// ─── Vidéo d'ouverture plein écran ──────────────────────
// Joue la vidéo plein écran AVANT l'intro AI Neural Genesis.
// Se ferme à la fin, sur clic "Passer", ou après 20 s max.
function setupOpeningVideo() {
  const overlay = document.getElementById('video-intro-overlay');
  const video   = document.getElementById('video-intro');
  const skipBtn = document.getElementById('video-intro-skip');
  if (!overlay || !video) {
    runAiIntroThenPresentation();
    return;
  }

  const hide = () => {
    if (overlay.classList.contains('is-hidden')) return;
    overlay.classList.add('is-hidden');
    setTimeout(() => {
      overlay.remove();
      runAiIntroThenPresentation();
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

// ─── Orchestration : vidéo intro → AI Neural Genesis → présentation ──
// L'AI Neural Genesis est gardé en display:none tant que la vidéo d'ouverture
// joue, puis réactivé (display:flex). Ça force ses @keyframes à redémarrer
// proprement de 0 (brain, pulses, MAYDENI reveal, loader, crédit Dr. Slim
// Lamouchi, puis introExit qui fait le fondu de sortie à 15 s + 1.2 s).
function runAiIntroThenPresentation() {
  const intro = document.getElementById('intro-overlay');

  if (intro) {
    intro.classList.remove('is-hold');      // réveille l'intro
    // force un reflow pour que le passage display:none → flex redémarre les anims
    // eslint-disable-next-line no-unused-expressions
    intro.offsetHeight;
  }

  // Durée totale AI Neural Genesis : 16.5 s introExit delay + 1.2 s fade + marge
  // Le crédit "Développé par Dr. Slim Lamouchi" (anim 9.5 s → 11 s) reste ainsi
  // parfaitement visible entre 11 s et 16.5 s avant le fondu de sortie.
  setTimeout(() => {
    if (intro) intro.style.display = 'none';
    setupPresentationVideo();
  }, 18500);
}

document.addEventListener('DOMContentLoaded', () => {
  // Tant que la vidéo d'ouverture joue, on cache complètement l'AI Neural
  // Genesis (display:none) — ses animations ne tourneront pas dans le vide
  // derrière et repartiront fraîches quand on la dévoilera.
  const intro = document.getElementById('intro-overlay');
  if (intro) intro.classList.add('is-hold');

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
