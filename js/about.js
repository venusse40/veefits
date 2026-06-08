const WA_NUMBER = '250785151401'; // ← your number

// Update WhatsApp links
const waContactBtn = document.getElementById('waContactBtn');
if (waContactBtn) waContactBtn.href = `https://wa.me/${WA_NUMBER}`;
const waNum = document.getElementById('waNumber');
if (waNum) waNum.textContent = `+${WA_NUMBER.slice(0,3)} ${WA_NUMBER.slice(3,6)} ${WA_NUMBER.slice(6,9)} ${WA_NUMBER.slice(9)}`;

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const formData = new FormData(contactForm);
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
      document.getElementById('formSuccess').style.display = 'block';
      contactForm.reset();
    } catch {
      btn.textContent = 'Send Message ✉️';
      btn.disabled = false;
    }
  });
}

// ===== COUNT UP ANIMATION =====
function countUp(el, target, suffix = '') {
  let current = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current.toLocaleString() + suffix;
  }, 30);
}

// Trigger count up when stats come into view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      countUp(document.querySelector('.about-stat:nth-child(1) span'), 500, '+');
      countUp(document.querySelector('.about-stat:nth-child(2) span'), 1200, '+');
      observer.disconnect();
    }
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) observer.observe(statsSection);

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');
const mobileMenuClose = document.getElementById('mobileMenuClose');

if (hamburger) hamburger.addEventListener('click', () => {
  mobileMenu.classList.add('open');
  menuOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
});
if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
function closeMenu() {
  mobileMenu?.classList.remove('open');
  menuOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

// Cart count
const cartCountEl = document.querySelector('.cart-count');
const cart = JSON.parse(localStorage.getItem('veeCart') || '[]');
if (cartCountEl) cartCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);