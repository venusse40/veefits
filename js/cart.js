// ===== CART DATA =====
// For now we use localStorage to store cart items as JSON
// When we add a backend later this will connect to a real database

let cart = JSON.parse(localStorage.getItem('veeCart') || '[]');

// ===== RENDER CART =====
function renderCart() {
  const cartEmpty = document.getElementById('cartEmpty');
  const cartItemsList = document.getElementById('cartItemsList');
  const orderSummary = document.getElementById('orderSummary');
  const continueLink = document.getElementById('continueLink');
  const cartCountEl = document.querySelector('.cart-count');

  // Update nav cart count
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalItems;
  localStorage.setItem('cartCount', totalItems);

  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartItemsList.innerHTML = '';
    orderSummary.style.display = 'none';
    continueLink.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  orderSummary.style.display = 'block';
  continueLink.style.display = 'inline-block';

  // Render items
  cartItemsList.innerHTML = cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <div class="cart-item-img"></div>
      <div class="cart-item-details">
        <p class="cart-item-cat">Veefits Pick</p>
        <h3 class="cart-item-name">${item.name}</h3>
        <p class="cart-item-meta">Size: M &nbsp;·&nbsp; Condition: Like New</p>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">
        <span class="item-price">$${(item.price * item.qty).toFixed(2)}</span>
        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
      </div>
    </div>
  `).join('');

  updateSummary();
}

// ===== UPDATE TOTALS =====
let discountPercent = 0;

function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = subtotal * discountPercent;
  const total = subtotal - discount;

  document.getElementById('subtotalVal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('discountVal').textContent = '-$' + discount.toFixed(2);
  document.getElementById('totalVal').textContent = '$' + total.toFixed(2);

  if (subtotal >= 50) {
    document.getElementById('shippingVal').textContent = 'FREE 🎉';
  } else {
    document.getElementById('shippingVal').textContent = '$4.99';
  }
}

// ===== CHANGE QUANTITY =====
function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  localStorage.setItem('veeCart', JSON.stringify(cart));
  renderCart();
}

// ===== REMOVE ITEM =====
function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem('veeCart', JSON.stringify(cart));
  renderCart();
}

// ===== PROMO CODE =====
const promoCodes = {
  'VEEFITS10': 0.10,
  'WELCOME15': 0.15,
  'THRIFT20': 0.20
};

document.getElementById('promoBtn').addEventListener('click', () => {
  const code = document.getElementById('promoInput').value.trim().toUpperCase();
  const msg = document.getElementById('promoMsg');

  if (promoCodes[code]) {
    discountPercent = promoCodes[code];
    msg.textContent = `✓ ${Math.round(discountPercent * 100)}% discount applied!`;
    msg.className = 'promo-msg success';
    updateSummary();
  } else {
    msg.textContent = 'Invalid promo code. Try VEEFITS10 👀';
    msg.className = 'promo-msg error';
  }
});

// ===== CHECKOUT BUTTON =====
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) return;
  alert('Checkout coming soon! We will connect this to a payment gateway.');
});

// ===== ADD TO CART (from "You May Also Like") =====
document.querySelectorAll('.btn-add-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const existing = cart.find(i => i.name === name);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    localStorage.setItem('veeCart', JSON.stringify(cart));
    renderCart();
    btn.textContent = '✓ Added';
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = '+ Cart';
      btn.style.background = '';
      btn.style.color = '';
    }, 1500);
  });
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// ===== INIT =====
renderCart();