const WA_NUMBER = VEEFITS.whatsapp;
const SHEET_URL = VEEFITS.sheetURL;

// ===== GET PRODUCT ID FROM URL =====
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

const productId = parseInt(getParam('id'));

// ===== LOAD PRODUCT =====
function loadProduct() {
  const products = JSON.parse(localStorage.getItem('veeProducts') || '[]');
  const product = products.find(p => p.id === productId);

  if (!product) {
    document.getElementById('productDetail').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted);">
        <p style="font-size:52px;margin-bottom:16px;">😕</p>
        <h2 style="font-family:var(--font-display);font-style:italic;margin-bottom:12px;">Product not found</h2>
        <p style="margin-bottom:28px;">This item may have been sold or removed.</p>
        <a href="shop.html" class="btn-primary">Browse Shop</a>
      </div>`;
    return;
  }

  // Update page title
  document.title = `${product.name} — Veefits`;

  // Breadcrumb
  document.getElementById('breadcrumbName').textContent = product.name;

  // Badge
  if (product.tag) {
    const badge = document.getElementById('productBadge');
    const cls = { NEW:'badge-new', HOT:'badge-hot', SALE:'badge-sale', 'LAST ONE':'badge-last' }[product.tag] || 'badge-new';
    badge.textContent = product.tag;
    badge.className = `product-badge ${cls}`;
    badge.style.display = 'inline-block';
  }

  // Images
  const mainImg = document.getElementById('mainImage');
  const mainPlaceholder = document.getElementById('mainImagePlaceholder');
  const thumbsContainer = document.getElementById('imageThumbs');

  if (product.images && product.images.length > 0) {
    mainImg.src = product.images[0];
    mainImg.alt = product.name;
    mainPlaceholder.style.display = 'none';

    // Thumbnails
    if (product.images.length > 1) {
      thumbsContainer.innerHTML = product.images.map((src, i) => `
        <div class="thumb ${i === 0 ? 'active' : ''}" onclick="switchImage('${src}', this)">
          <img src="${src}" alt="${product.name} ${i + 1}" />
        </div>
      `).join('');
    }
  } else {
    mainImg.style.display = 'none';
  }

  // Text info
  document.getElementById('detailCat').textContent = product.category;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailPrice').textContent =
    Number(product.price).toLocaleString() + ' RWF';
  document.getElementById('detailCondition').textContent = product.condition;
  document.getElementById('detailSize').textContent = product.size;
  document.getElementById('detailCondition2').textContent = product.condition;
  document.getElementById('detailCat2').textContent = product.category;

  // Description
  if (product.desc) {
    document.getElementById('detailDesc').style.display = 'block';
    document.getElementById('descText').textContent = product.desc;
  }

  // WhatsApp order button
  document.getElementById('waOrderBtn').addEventListener('click', () => {
    const msg = encodeURIComponent(
      `Hello Veefits! 👋\n\nI'd like to order:\n\n🛍️ *${product.name}*\n📏 Size: ${product.size}\n💰 Price: ${Number(product.price).toLocaleString()} RWF\n\nIs it still available?`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  });

  // Wishlist button
  const wishlistBtn = document.getElementById('wishlistBtn');
  wishlistBtn.addEventListener('click', () => {
    wishlistBtn.classList.toggle('liked');
    wishlistBtn.textContent = wishlistBtn.classList.contains('liked')
      ? '♥ Saved!' : '♡ Save';
  });

  // Also like grid
  loadAlsoLike(products, product);
}

// ===== SWITCH MAIN IMAGE =====
function switchImage(src, thumb) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

// ===== ALSO LIKE =====
function loadAlsoLike(products, current) {
  const grid = document.getElementById('alsoLikeGrid');
  if (!grid) return;

  const others = products
    .filter(p => p.id !== current.id)
    .slice(0, 4);

  if (others.length === 0) {
    grid.style.display = 'none';
    return;
  }

  grid.innerHTML = others.map(p => {
    const badgeClass = {
      NEW:'badge-new', HOT:'badge-hot',
      SALE:'badge-sale', 'LAST ONE':'badge-last'
    }[p.tag] || 'badge-new';

    return `
      <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
        <div style="position:relative;overflow:hidden;">
          ${p.images && p.images[0]
            ? `<img src="${p.images[0]}" class="product-card-img" alt="${p.name}" loading="lazy"/>`
            : `<div class="product-card-img-placeholder">👗</div>`
          }
          ${p.tag ? `<span class="product-badge ${badgeClass}">${p.tag}</span>` : ''}
        </div>
        <div class="product-card-body">
          <p class="product-card-cat">${p.category}</p>
          <p class="product-card-name">${p.name}</p>
          <p class="product-card-meta">${p.size} · ${p.condition}</p>
          <div class="product-card-footer">
            <p class="product-card-price">${Number(p.price).toLocaleString()} <small>RWF</small></p>
            <button class="btn-wa-order" onclick="event.stopPropagation();waOrder('${p.name.replace(/'/g,"\\'")}',${p.price},'${p.size}')">
              📲 Order
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function waOrder(name, price, size) {
  const msg = encodeURIComponent(
    `Hello Veefits! 👋\n\nI'd like to order:\n\n🛍️ *${name}*\n📏 Size: ${size}\n💰 Price: ${Number(price).toLocaleString()} RWF\n\nIs it still available?`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

// ===== SHARE =====
function shareWA() {
  const msg = encodeURIComponent(
    `Check out this item on Veefits! 👗\n${window.location.href}`
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied!';
    btn.style.borderColor = '#25d366';
    btn.style.color = '#25d366';
    setTimeout(() => {
      btn.textContent = 'Copy Link';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  });
}

// ===== INIT =====
loadProduct();