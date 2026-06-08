// ===== PASSWORD =====
// Change this to your own password!
const ADMIN_PASSWORD = 'veefits2025';
const API_BASE = 'http://localhost:3000/api';

let uploadedImages = [];
let editingProductId = null;

function isValidImageSrc(src) {
  if (typeof src !== 'string' || !src.trim()) return false;
  const value = src.trim();
  if (value.startsWith('data:')) {
    const payload = value.split(',')[1] || '';
    return payload.trim().length > 0;
  }
  return value.startsWith('http://') || value.startsWith('https://');
}

function sanitizeImages(images) {
  return (images || []).filter(isValidImageSrc);
}

// ===== LOGIN =====
document.addEventListener('DOMContentLoaded', initAdmin);

function initAdmin() {
  document.getElementById('loginBtn')?.addEventListener('click', login);
  document.getElementById('adminPassword')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('addProductShortcut')?.addEventListener('click', () => switchSection('add'));
  document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
  document.getElementById('clearFormBtn')?.addEventListener('click', clearForm);
  document.getElementById('adminSearch')?.addEventListener('input', loadProducts);
  document.getElementById('adminCatFilter')?.addEventListener('change', loadProducts);
  switchSection('products');
}

async function login() {
  const val = document.getElementById('adminPassword').value;
  if (val === ADMIN_PASSWORD) {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    switchSection('products');
    await Promise.all([loadProducts(), updateStats()]);
  } else {
    document.getElementById('loginError').textContent = 'Wrong password. Try again.';
  }
}

function logout() {
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
}

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.admin-nav-item[data-section]');
const sections = ['products', 'add', 'stats'];

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = item.dataset.section;
    if (!sec) return;
    switchSection(sec);
  });
});

function switchSection(sec) {
  navItems.forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${sec}"]`)?.classList.add('active');
  sections.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.style.display = s === sec ? 'block' : 'none';
  });
  const headings = {
    products: ['My Products', 'Manage your Veefits collection'],
    add: ['Add New Product', 'Upload a new item to your store'],
    stats: ['Overview', 'Your store at a glance']
  };
  document.getElementById('sectionHeading').textContent = headings[sec][0];
  document.getElementById('sectionSub').textContent = headings[sec][1];
}

// ===== IMAGE UPLOAD =====
document.getElementById('imageUploadArea').addEventListener('click', () => {
  document.getElementById('productImageInput').click();
});

document.getElementById('productImageInput').addEventListener('change', function () {
  const files = Array.from(this.files).slice(0, 5);
  uploadedImages = [];
  const previews = document.getElementById('imagePreviews');
  const placeholder = document.getElementById('uploadPlaceholder');
  previews.innerHTML = '';

  if (files.length > 0) placeholder.style.display = 'none';

  files.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push(e.target.result);
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-img' + (i === 0 ? ' main' : '');
      previews.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// ===== SAVE PRODUCT =====
async function saveProduct() {
  const name = document.getElementById('pName').value.trim();
  const price = document.getElementById('pPrice').value.trim();
  const category = document.getElementById('pCategory').value;
  const size = document.getElementById('pSize').value;
  const condition = document.getElementById('pCondition').value;
  const tag = document.getElementById('pTag').value;
  const desc = document.getElementById('pDesc').value.trim();
  const msg = document.getElementById('saveMsg');

  if (!name || !price || !category) {
    msg.textContent = 'Please fill in name, price and category.';
    msg.className = 'save-msg error';
    return;
  }

  const validImages = sanitizeImages(uploadedImages);

  const payload = {
    name,
    price: parseFloat(price),
    category,
    size,
    condition,
    tag,
    desc,
    images: validImages
  };

  try {
    const endpoint = editingProductId ? `${API_BASE}/products/${editingProductId}` : `${API_BASE}/products`;
    const method = editingProductId ? 'PUT' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unable to save product.');
    }

    msg.textContent = '✓ Product saved and live in your shop!';
    msg.className = 'save-msg success';
    clearForm();
    editingProductId = null;

    setTimeout(() => {
      switchSection('products');
      loadProducts();
      updateStats();
    }, 1200);
  } catch (error) {
    msg.textContent = error.message;
    msg.className = 'save-msg error';
  }
}

function clearForm() {
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pCategory').value = '';
  document.getElementById('pSize').value = 'One Size';
  document.getElementById('pCondition').value = 'Like New';
  document.getElementById('pTag').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('imagePreviews').innerHTML = '';
  document.getElementById('uploadPlaceholder').style.display = 'block';
  uploadedImages = [];
  document.getElementById('saveMsg').textContent = '';
  document.getElementById('productImageInput').value = '';
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  const products = await fetchProducts();
  const grid = document.getElementById('adminProductsGrid');
  const noProducts = document.getElementById('noProducts');
  const search = document.getElementById('adminSearch').value.toLowerCase();
  const cat = document.getElementById('adminCatFilter').value;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search);
    const matchCat = cat === 'all' || p.category === cat;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noProducts.style.display = 'block';
    return;
  }

  noProducts.style.display = 'none';
  grid.innerHTML = filtered.map(p => {
    const images = sanitizeImages(p.images);
    return `
    <div class="admin-product-card" data-id="${p.id}">
      ${images[0]
        ? `<img src="${images[0]}" class="admin-product-img" alt="${p.name}" />`
        : `<div class="admin-product-img"></div>`
      }
      <div class="admin-product-info">
        ${p.tag ? `<span style="font-size:10px;background:var(--accent);color:#fff;padding:2px 10px;border-radius:20px;font-weight:700;letter-spacing:0.08em;">${p.tag}</span><br><br>` : ''}
        <h4>${p.name}</h4>
        <p class="admin-product-meta">${p.category} · ${p.size} · ${p.condition}</p>
        <p class="admin-product-price">${Number(p.price).toLocaleString()} RWF</p>
        <div class="admin-product-actions">
          <button class="admin-btn-edit" onclick="editProduct(${p.id})">Edit</button>
          <button class="admin-btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// ===== DELETE =====
async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  await loadProducts();
  await updateStats();
}

// ===== EDIT (loads product back into form) =====
async function editProduct(id) {
  const product = await fetchProductById(id);
  if (!product) return;

  switchSection('add');
  document.getElementById('pName').value = product.name;
  document.getElementById('pPrice').value = product.price;
  document.getElementById('pCategory').value = product.category;
  document.getElementById('pSize').value = product.size;
  document.getElementById('pCondition').value = product.condition;
  document.getElementById('pTag').value = product.tag || '';
  document.getElementById('pDesc').value = product.desc || '';

  const validImages = sanitizeImages(product.images);
  if (validImages.length > 0) {
    uploadedImages = validImages;
    const previews = document.getElementById('imagePreviews');
    document.getElementById('uploadPlaceholder').style.display = 'none';
    previews.innerHTML = validImages.map((src, i) =>
      `<img src="${src}" class="preview-img${i === 0 ? ' main' : ''}" />`
    ).join('');
  }

  editingProductId = id;
}

// ===== STATS =====
async function updateStats() {
  const products = await fetchProducts();
  document.getElementById('statTotal').textContent = products.length;
  document.getElementById('statDresses').textContent = products.filter(p => p.category === 'dresses').length;
  document.getElementById('statTops').textContent = products.filter(p => p.category === 'tops').length;
  document.getElementById('statAccessories').textContent = products.filter(p => p.category === 'accessories').length;
}

// ===== SEARCH & FILTER =====

// ===== API HELPERS =====
async function fetchProducts() {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) return [];
  return await response.json();
}

async function fetchProductById(id) {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) return null;
  return await response.json();
}
