/**
 * Maydeni AI — Site Web JS
 */

// ─── Intro → disparition après 13s ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
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
