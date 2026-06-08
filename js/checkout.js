// ===== LOAD CART =====
const cart = JSON.parse(localStorage.getItem('veeCart') || '[]');
const cartCountEl = document.querySelector('.cart-count');
const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
if (cartCountEl) cartCountEl.textContent = totalItems;

// ===== RENDER ORDER ITEMS =====
function renderCheckoutItems() {
  const container = document.getElementById('checkoutItems');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No items in cart.</p>';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <div class="checkout-item-img"></div>
      <div class="checkout-item-info">
        <p>${item.name}</p>
        <span>Qty: ${item.qty}</span>
      </div>
      <span class="checkout-item-price">$${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('');

  updateTotals();
}

// ===== TOTALS =====
let shippingCost = 4.99;
const discount = parseFloat(localStorage.getItem('veeDiscount') || '0');

function updateTotals() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmt = subtotal * discount;
  const total = subtotal - discountAmt + (subtotal >= 50 ? 0 : shippingCost);

  document.getElementById('coSubtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('coDiscount').textContent = '-$' + discountAmt.toFixed(2);
  document.getElementById('coTotal').textContent = '$' + total.toFixed(2);

  if (subtotal >= 50) {
    document.getElementById('coShipping').textContent = 'FREE 🎉';
    shippingCost = 0;
  } else {
    document.getElementById('coShipping').textContent = '$' + shippingCost.toFixed(2);
  }
}

// ===== SHIPPING OPTIONS =====
document.querySelectorAll('.shipping-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    const val = option.querySelector('input').value;
    if (val === 'standard') shippingCost = 4.99;
    if (val === 'express') shippingCost = 12.99;
    if (val === 'overnight') shippingCost = 24.99;
    updateTotals();
  });
});

// ===== PAYMENT TABS =====
document.querySelectorAll('.pay-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ===== CARD NUMBER FORMATTING =====
const cardNum = document.getElementById('cardNum');
if (cardNum) {
  cardNum.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
  });
}

// ===== EXPIRY FORMATTING =====
const expiry = document.getElementById('expiry');
if (expiry) {
  expiry.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) val = val.substring(0, 2) + ' / ' + val.substring(2);
    e.target.value = val;
  });
}

// ===== FORM VALIDATION =====
function validateForm() {
  const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'zip', 'country'];
  let valid = true;

  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.style.borderColor = 'var(--accent)';
      valid = false;
    } else {
      el.style.borderColor = '';
    }
  });

  const activeTab = document.querySelector('.pay-tab.active')?.dataset.tab;
  if (activeTab === 'card') {
    ['cardName', 'cardNum', 'expiry', 'cvv'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--accent)';
        valid = false;
      } else {
        el.style.borderColor = '';
      }
    });
  }

  return valid;
}

// ===== PLACE ORDER =====
document.getElementById('placeOrderBtn').addEventListener('click', () => {
  if (!validateForm()) {
    alert('Please fill in all required fields.');
    return;
  }

  const activeTab = document.querySelector('.pay-tab.active')?.dataset.tab;

  if (activeTab === 'whatsapp') {
    const items = cart.map(i => `${i.name} x${i.qty}`).join(', ');
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    const msg = encodeURIComponent(`Hi Veefits! I'd like to order:\n${items}\nTotal: $${total}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    return;
  }
// Save order snapshot then clear cart
localStorage.setItem('veeLastOrder', localStorage.getItem('veeCart') || '[]');
localStorage.removeItem('veeCart');
localStorage.setItem('cartCount', '0');
window.location.href = 'confirmation.html';
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ===== INIT =====
renderCheckoutItems();