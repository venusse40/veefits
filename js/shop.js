const WA_NUMBER = VEEFITS.whatsapp;
const SHEET_URL = VEEFITS.sheetURL;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFfviAg2YVAss8sHB23_ExdCN-qrwtM4og9iRzRRWa7RfXQNs63e2DGoKJa4AHqcaNvcoZYbbRf77e/pub?gid=0&single=true&output=csv';
const API_BASE = 'http://localhost:3000/api';

function sanitizeImages(images) {
  return (images || []).filter(src => {
    if (typeof src !== 'string' || !src.trim()) return false;
    const value = src.trim();
    if (value.startsWith('data:')) {
      const payload = value.split(',')[1] || '';
      return payload.trim().length > 0;
    }
    return value.startsWith('http://') || value.startsWith('https://');
  });
}

async function fetchProducts() {
  try {
    // Use Netlify function — works perfectly on live site
    const res = await fetch('/.netlify/functions/products');
    if (res.ok) {
      const csv = await res.text();
      const products = parseCSV(csv);
      if (products.length > 0) {
        localStorage.setItem('veeProducts', JSON.stringify(products));
        return products;
      }
    }
  } catch (e) {
    console.warn('Netlify function failed, using localStorage...');
  }

  // Fallback to localStorage
  return JSON.parse(localStorage.getItem('veeProducts') || '[]');
}

function parseCSV(csv) {
  try {
    const rows = csv.trim().split('\n');
    if (rows.length < 2) return [];

    // Make headers lowercase to handle any capitalisation
    const headers = rows[0].split(',').map(h =>
      h.trim().replace(/"/g, '').toLowerCase()
    );

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

// ===== RENDER GRID =====
function renderGrid(products) {
  const grid = document.getElementById('shopGrid');
  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = products.length;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="shop-empty">
        <p>👗</p>
        <p>No items found.<br>Try a different filter or check back soon for new arrivals!</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const badgeClass = { NEW:'badge-new', HOT:'badge-hot', SALE:'badge-sale', 'LAST ONE':'badge-last' }[p.tag] || 'badge-new';
    const images = sanitizeImages(p.images);
    return `
      <div class="product-card">
        <div style="position:relative;overflow:hidden;">
          ${images[0]
            ? `<img src="${images[0]}" class="product-card-img" alt="${p.name}" loading="lazy"/>`
            : `<div class="product-card-img-placeholder">👗</div>`
          }
          ${p.tag ? `<span class="product-badge ${badgeClass}">${p.tag}</span>` : ''}
          <button class="wishlist-btn" onclick="toggleWishlist(this)" aria-label="Wishlist">♡</button>
        </div>
        <div class="product-card-body">
          <p class="product-card-cat">${p.category}</p>
          <p class="product-card-name">${p.name}</p>
          <p class="product-card-meta">${p.size} · ${p.condition}</p>
          <div class="product-card-footer">
            <div>
              <p class="product-card-price">${Number(p.price).toLocaleString()} <small>RWF</small></p>
            </div>
            <button class="btn-wa-order" onclick="orderWA('${p.name.replace(/'/g,"\\'")}', ${p.price}, '${p.size}')">
              📲 Order
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ===== WHATSAPP ORDER =====
function orderWA(name, price, size) {
  const msg = encodeURIComponent(
    `Hello Veefits! 👋\n\nI'd like to order this item:\n\n🛍️ *${name}*\n📏 Size: ${size}\n💰 Price: ${Number(price).toLocaleString()} RWF\n\nIs it still available?`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

// ===== WISHLIST TOGGLE =====
function toggleWishlist(btn) {
  btn.classList.toggle('liked');
  btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';
}

// ===== FILTERS STATE =====
let activeCategory = 'all';
let sortOrder = 'newest';

async function applyFilters() {
  let products = await fetchProductsFromApi();

  if (activeCategory !== 'all') {
    products = products.filter(p => p.category === activeCategory);
  }

  // Search
  const q = document.getElementById('navSearch')?.value.toLowerCase() || '';
  if (q) products = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );

  if (sortOrder === 'price-low') products.sort((a, b) => a.price - b.price);
  if (sortOrder === 'price-high') products.sort((a, b) => b.price - a.price);

  renderGrid(products);
}

// ===== CATEGORY PILLS =====
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.cat;
    applyFilters();
  });
});

// ===== SORT =====
document.getElementById('sortSelect')?.addEventListener('change', function() {
  sortOrder = this.value;
  applyFilters();
});

// ===== SEARCH =====
document.getElementById('navSearch')?.addEventListener('input', applyFilters);

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));

// ===== CART COUNT =====
const cart = JSON.parse(localStorage.getItem('veeCart') || '[]');
const cartCountEl = document.querySelector('.cart-count');
function refreshCartCount() {
  const total = JSON.parse(localStorage.getItem('veeCart') || '[]').reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = total;
}
refreshCartCount();

window.addEventListener('storage', (event) => {
  if (event.key === 'veeCart' || event.key === 'cartCount') {
    refreshCartCount();
  }
});

// ===== INIT =====
applyFilters();