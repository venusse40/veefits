// ===== WHATSAPP NUMBER — update this once here =====
const WA_NUMBER = '250785151401';

// Update WA promo button
const waBtn = document.getElementById('waPromoBtn');
if (waBtn) waBtn.href = `https://wa.me/${WA_NUMBER}`;

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');
const mobileMenuClose = document.getElementById('mobileMenuClose');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    menuOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}
if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', closeMenu);
}
if (menuOverlay) {
  menuOverlay.addEventListener('click', closeMenu);
}
function closeMenu() {
  mobileMenu?.classList.remove('open');
  menuOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== CART COUNT =====
const cartCountEl = document.querySelector('.cart-count');
const cart = JSON.parse(localStorage.getItem('veeCart') || '[]');
if (cartCountEl) cartCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);

// ===== GET PRODUCTS =====
function getProducts() {
  return JSON.parse(localStorage.getItem('veeProducts') || '[]');
}

// ===== WHATSAPP ORDER =====
function orderWA(name, price, size) {
  const msg = encodeURIComponent(
    `Hello Veefits! 👋\n\nI'd like to order:\n\n🛍️ *${name}*\n📏 Size: ${size}\n💰 Price: ${Number(price).toLocaleString()} RWF\n\nIs it still available?`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

// ===== WISHLIST =====
function toggleWishlist(btn) {
  btn.classList.toggle('liked');
  btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';
}

// ===== PRODUCT CARD HTML =====
function productCardHTML(p) {
  const badgeClass = {
    NEW: 'badge-new', HOT: 'badge-hot',
    SALE: 'badge-sale', 'LAST ONE': 'badge-last'
  }[p.tag] || 'badge-new';

  return `
    <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
      <div style="position:relative;overflow:hidden;">
        ${p.images && p.images[0]
          ? `<img src="${p.images[0]}" class="product-card-img" alt="${p.name}" loading="lazy"/>`
          : `<div class="product-card-img-placeholder">👗</div>`
        }
        ${p.tag ? `<span class="product-badge ${badgeClass}">${p.tag}</span>` : ''}
        <button class="wishlist-btn" onclick="event.stopPropagation();toggleWishlist(this)" aria-label="Wishlist">♡</button>
      </div>
      <div class="product-card-body">
        <p class="product-card-cat">${p.category}</p>
        <p class="product-card-name">${p.name}</p>
        <p class="product-card-meta">${p.size} · ${p.condition}</p>
        <div class="product-card-footer">
          <p class="product-card-price">${Number(p.price).toLocaleString()} <small>RWF</small></p>
          <button class="btn-wa-order" onclick="event.stopPropagation();orderWA('${p.name.replace(/'/g,"\\'")}',${p.price},'${p.size}')">
            📲 Order
          </button>
        </div>
      </div>
    </div>`;
}

// ===== RENDER HOME GRIDS =====
function renderHomeGrids() {
  const products = getProducts();
  const newGrid = document.getElementById('newArrivalsGrid');
  const popGrid = document.getElementById('popularGrid');

  if (newGrid) {
    const newest = products.slice(0, 4);
    newGrid.innerHTML = newest.length
      ? newest.map(productCardHTML).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#bbb;">
           <p style="font-size:40px;margin-bottom:12px;">👗</p>
           <p>No products yet — add some from your <a href="admin.html" style="color:var(--accent);">admin page</a>!</p>
         </div>`;
  }

  if (popGrid) {
    // Show next 4 products (or shuffle for "popular" feel)
    const popular = products.length > 4 ? products.slice(4, 8) : products.slice(0, 4);
    popGrid.innerHTML = popular.length
      ? popular.map(productCardHTML).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#bbb;">
           <p style="font-size:40px;margin-bottom:12px;">✨</p>
           <p>More arrivals coming soon!</p>
         </div>`;
  }
}

// ===== HERO SLIDER =====
function initSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.getElementById('slideDots');
  if (!slides.length || !dotsContainer) return;

  let current = 0;
  let timer;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  document.getElementById('slidePrev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('slideNext')?.addEventListener('click', () => goTo(current + 1));

  resetTimer();
}

// ===== INIT =====
renderHomeGrids();
initSlider();