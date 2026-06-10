// ===== CONFIG — update these two values =====
const WA_NUMBER = VEEFITS.whatsapp;
const SHEET_URL = VEEFITS.sheetURL;

// ===== FETCH PRODUCTS FROM GOOGLE SHEETS =====
async function fetchProducts() {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFfviAg2YVAss8sHB23_ExdCN-qrwtM4og9iRzRRWa7RfXQNs63e2DGoKJa4AHqcaNvcoZYbbRf77e/pub?gid=0&single=true&output=csv';

  // Try direct fetch first
  try {
    const res = await fetch(SHEET_URL);
    if (res.ok) {
      const csv = await res.text();
      return parseCSV(csv);
    }
  } catch (e) {
    console.warn('Direct fetch failed, trying proxy...');
  }

  // Try with proxy
  try {
    const PROXY = 'https://api.allorigins.win/raw?url=';
    const res = await fetch(PROXY + encodeURIComponent(SHEET_URL));
    if (res.ok) {
      const csv = await res.text();
      return parseCSV(csv);
    }
  } catch (e) {
    console.warn('Proxy fetch failed, using localStorage...');
  }

  // Fall back to localStorage
  return JSON.parse(localStorage.getItem('veeProducts') || '[]');
}

function parseCSV(csv) {
  try {
    const rows = csv.trim().split('\n');
    if (rows.length < 2) return [];
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const products = rows.slice(1).map(row => {
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (cols[i] || '').replace(/"/g, '').trim();
      });
      return {
        id: parseInt(obj.id) || Date.now(),
        name: obj.name || '',
        price: parseFloat(obj.price) || 0,
        category: (obj.category || '').toLowerCase(),
        size: obj.size || 'One Size',
        condition: obj.condition || 'Like New',
        tag: obj.tag || '',
        desc: obj.desc || '',
        images: [obj.image1, obj.image2, obj.image3].filter(Boolean)
      };
    }).filter(p => p.name);

    if (products.length > 0) {
      localStorage.setItem('veeProducts', JSON.stringify(products));
    }
    return products;
  } catch (e) {
    console.error('CSV parse error:', e);
    return JSON.parse(localStorage.getItem('veeProducts') || '[]');
  }
}

// ===== PRODUCT CARD HTML =====
function productCardHTML(p) {
  const badgeClass = {
    NEW: 'badge-new',
    HOT: 'badge-hot',
    SALE: 'badge-sale',
    'LAST ONE': 'badge-last'
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
          <button class="btn-wa-order" onclick="event.stopPropagation();orderWA('${p.name.replace(/'/g, "\\'")}',${p.price},'${p.size}')">
            📲 Order
          </button>
        </div>
      </div>
    </div>`;
}

// ===== RENDER HOME GRIDS =====
async function renderHomeGrids() {
  const products = await fetchProducts();

  const newGrid = document.getElementById('newArrivalsGrid');
  const popGrid = document.getElementById('popularGrid');

  const emptyHTML = (msg) => `
    <div style="grid-column:1/-1;text-align:center;padding:60px;color:#bbb;">
      <p style="font-size:40px;margin-bottom:12px;">👗</p>
      <p>${msg}</p>
    </div>`;

  if (newGrid) {
    const newest = products.slice(0, 4);
    newGrid.innerHTML = newest.length
      ? newest.map(productCardHTML).join('')
      : emptyHTML('No products yet — add some from your <a href="admin.html" style="color:var(--accent);">admin page</a>!');
  }

  if (popGrid) {
    const popular = products.length > 4
      ? products.slice(4, 8)
      : products.slice(0, 4);
    popGrid.innerHTML = popular.length
      ? popular.map(productCardHTML).join('')
      : emptyHTML('More arrivals coming soon!');
  }
}

// ===== HERO SLIDER =====
function initSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.getElementById('slideDots');
  if (!slides.length || !dotsContainer) return;

  let current = 0;
  let timer;

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

// ===== WA PROMO BUTTON =====
const waBtn = document.getElementById('waPromoBtn');
if (waBtn) waBtn.href = `https://wa.me/${WA_NUMBER}`;

// ===== INIT =====
renderHomeGrids();
initSlider();