// ===== GENERATE ORDER NUMBER =====
function generateOrderNumber() {
  const saved = localStorage.getItem('veeOrderNum');
  if (saved) return saved;
  const num = 'VF-' + Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem('veeOrderNum', num);
  return num;
}

document.getElementById('orderNum').textContent = '#' + generateOrderNumber();

// ===== LOAD LAST ORDER =====
// We read from a snapshot saved at checkout
// Fall back to current cart if snapshot not found
const lastOrder = JSON.parse(localStorage.getItem('veeLastOrder') || '[]');
const cart = lastOrder.length ? lastOrder : JSON.parse(localStorage.getItem('veeCart') || '[]');

// ===== RENDER ITEMS =====
function renderConfirmedItems() {
  const container = document.getElementById('confirmedItems');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No order details found.</p>';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="confirmed-item">
      <div class="confirmed-item-img"></div>
      <div class="confirmed-item-info">
        <p>${item.name}</p>
        <span>Qty: ${item.qty} &nbsp;·&nbsp; Size: M</span>
      </div>
      <span class="confirmed-item-price">$${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('');

  renderSummary();
}

// ===== RENDER SUMMARY =====
function renderSummary() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = parseFloat(localStorage.getItem('veeDiscount') || '0');
  const discountAmt = subtotal * discount;
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal - discountAmt + shipping;

  document.getElementById('cfSubtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('cfDiscount').textContent = '-$' + discountAmt.toFixed(2);
  document.getElementById('cfShipping').textContent = shipping === 0 ? 'FREE 🎉' : '$' + shipping.toFixed(2);
  document.getElementById('cfTotal').textContent = '$' + total.toFixed(2);
}

// ===== CART COUNT (should be 0 now) =====
const cartCountEl = document.querySelector('.cart-count');
if (cartCountEl) cartCountEl.textContent = '0';

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ===== CLEANUP OLD ORDER DATA =====
// Clear after rendering so it doesn't show stale data next visit
window.addEventListener('beforeunload', () => {
  localStorage.removeItem('veeLastOrder');
  localStorage.removeItem('veeOrderNum');
  localStorage.removeItem('veeDiscount');
});

// ===== INIT =====
renderConfirmedItems();