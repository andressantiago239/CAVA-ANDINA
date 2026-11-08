"use strict";

/* =========================================================
   1. DATOS Y CONSTANTES
   ========================================================= */
const PRODUCTS = [
  { id: 1,  name: "Whisky Highland 12 años", category: "Whisky",      price: 189000, oldPrice: 219000, volume: "750 ml", abv: 40,   emoji: "🥃", theme: "theme-whisky",      desc: "Whisky de malta suave, con notas de miel, vainilla y roble. Ideal para tomar solo o con hielo." },
  { id: 2,  name: "Whisky Blend Clásico",    category: "Whisky",      price: 129000, oldPrice: null,   volume: "1 L",    abv: 40,   emoji: "🥃", theme: "theme-whisky",      desc: "Mezcla equilibrada y versátil, perfecta para cocteles y para compartir." },
  { id: 3,  name: "Ron Añejo Caribe",        category: "Ron",         price: 89900,  oldPrice: null,   volume: "750 ml", abv: 38,   emoji: "🍾", theme: "theme-ron",         desc: "Ron añejado 8 años en barricas de roble con aroma a caramelo y frutos secos." },
  { id: 4,  name: "Ron Dorado Especiado",    category: "Ron",         price: 74900,  oldPrice: 84900,  volume: "750 ml", abv: 35,   emoji: "🍾", theme: "theme-ron",         desc: "Ron con especias y toques de canela. Excelente para mezclar con gaseosa o cola." },
  { id: 5,  name: "Vino Tinto Malbec",       category: "Vino",        price: 59900,  oldPrice: null,   volume: "750 ml", abv: 13,   emoji: "🍷", theme: "theme-vino",        desc: "Vino tinto de cuerpo medio con frutas rojas maduras. Acompaña carnes y pastas." },
  { id: 6,  name: "Vino Blanco Sauvignon",   category: "Vino",        price: 54900,  oldPrice: 62900,  volume: "750 ml", abv: 12,   emoji: "🥂", theme: "theme-vino",        desc: "Vino blanco fresco y cítrico. Ideal con pescados, mariscos y ensaladas." },
  { id: 7,  name: "Cerveza Artesanal IPA x6", category: "Cerveza",    price: 38900,  oldPrice: null,   volume: "6 x 330 ml", abv: 6, emoji: "🍺", theme: "theme-cerveza",     desc: "Pack de seis cervezas artesanales de aroma intenso y amargor marcado." },
  { id: 8,  name: "Cerveza Lager x12",       category: "Cerveza",     price: 42000,  oldPrice: 49900,  volume: "12 x 330 ml", abv: 4.5, emoji: "🍻", theme: "theme-cerveza",    desc: "Pack de doce cervezas lager, ligeras y refrescantes para reuniones." },
  { id: 9,  name: "Aguardiente Tradicional", category: "Aguardiente", price: 52000,  oldPrice: null,   volume: "750 ml", abv: 29,   emoji: "🍶", theme: "theme-aguardiente", desc: "Licor anisado tradicional colombiano, infaltable en cualquier celebración." },
  { id: 10, name: "Aguardiente Sin Azúcar",  category: "Aguardiente", price: 55000,  oldPrice: null,   volume: "750 ml", abv: 29,   emoji: "🍶", theme: "theme-aguardiente", desc: "La versión sin azúcar del clásico anisado, con sabor limpio y suave." },
  { id: 11, name: "Vodka Premium",           category: "Vodka",       price: 79900,  oldPrice: null,   volume: "750 ml", abv: 40,   emoji: "🍸", theme: "theme-vodka",       desc: "Vodka destilado cinco veces, muy suave. Base ideal para cocteles." },
  { id: 12, name: "Vodka Saborizado Limón",  category: "Vodka",       price: 68000,  oldPrice: 76000,  volume: "750 ml", abv: 37.5, emoji: "🍸", theme: "theme-vodka",       desc: "Vodka con sabor a limón natural. Perfecto para tragos frescos de verano." }
];

const CATEGORIES = [
  { name: "Whisky",      emoji: "🥃" },
  { name: "Ron",         emoji: "🍾" },
  { name: "Vino",        emoji: "🍷" },
  { name: "Cerveza",     emoji: "🍺" },
  { name: "Aguardiente", emoji: "🍶" },
  { name: "Vodka",       emoji: "🍸" }
];

const COUPONS = { CAVA10: 0.10, BIENVENIDO: 0.05 };   // código -> porcentaje
const SHIPPING_COST = 12000;
const FREE_SHIPPING_FROM = 200000;
const CART_KEY = "cavaandina_cart";
const AGE_KEY = "cavaandina_age_ok";

/* =========================================================
   2. ESTADO
   ========================================================= */
let cart = loadCart();          // [{ id, qty }]
let appliedCoupon = null;       // { code, rate } | null
let selectedProduct = null;     // producto abierto en el modal
const filters = { category: "Todas", search: "", sort: "default", onlyOffers: false };

/* =========================================================
   3. UTILIDADES
   ========================================================= */
const $ = (selector) => document.querySelector(selector);

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    /* si el navegador bloquea el almacenamiento, el carrito sigue funcionando en memoria */
  }
}

function showToast(message) {
  $("#toastMsg").textContent = message;
  bootstrap.Toast.getOrCreateInstance($("#appToast"), { delay: 2500 }).show();
}

/* =========================================================
   4. VERIFICACIÓN DE EDAD
   ========================================================= */
function initAgeGate() {
  let verified = false;
  try { verified = sessionStorage.getItem(AGE_KEY) === "yes"; } catch (e) { /* ignorar */ }
  if (verified) return;

  const modal = new bootstrap.Modal($("#ageModal"));
  modal.show();

  $("#btnAdult").addEventListener("click", () => {
    try { sessionStorage.setItem(AGE_KEY, "yes"); } catch (e) { /* ignorar */ }
    modal.hide();
  });

  $("#btnMinor").addEventListener("click", () => {
    document.body.innerHTML = `
      <main class="d-flex align-items-center justify-content-center text-center vh-100 p-4">
        <div>
          <div class="display-1" aria-hidden="true">🚫</div>
          <h1 class="h3 mt-3">Acceso restringido</h1>
          <p class="text-secondary">Este sitio es solo para mayores de 18 años. Vuelve cuando cumplas la mayoría de edad.</p>
        </div>
      </main>`;
  });
}

/* =========================================================
   5. CATEGORÍAS Y FILTROS
   ========================================================= */
function renderCategories() {
  // Tarjetas de categoría
  $("#categoryGrid").innerHTML = CATEGORIES.map((c) => `
    <div class="col">
      <button type="button" class="card category-card p-3 shadow-sm" data-category="${c.name}" aria-pressed="false">
        <span class="cat-emoji" aria-hidden="true">${c.emoji}</span>
        <span class="fw-semibold mt-1">${c.name}</span>
      </button>
    </div>`).join("");

  // Select de categorías
  $("#categorySelect").innerHTML =
    `<option value="Todas">Todas</option>` +
    CATEGORIES.map((c) => `<option value="${c.name}">${c.name}</option>`).join("");
}

function syncCategoryUI() {
  document.querySelectorAll(".category-card").forEach((btn) => {
    const active = btn.dataset.category === filters.category;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active);
  });
  $("#categorySelect").value = filters.category;
}

function getFilteredProducts() {
  let list = PRODUCTS.filter((p) => {
    const matchCategory = filters.category === "Todas" || p.category === filters.category;
    const text = `${p.name} ${p.category}`.toLowerCase();
    const matchSearch = text.includes(filters.search.toLowerCase().trim());
    const matchOffer = !filters.onlyOffers || p.oldPrice !== null;
    return matchCategory && matchSearch && matchOffer;
  });

  if (filters.sort === "asc") list.sort((a, b) => a.price - b.price);
  if (filters.sort === "desc") list.sort((a, b) => b.price - a.price);
  if (filters.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return list;
}

/* =========================================================
   6. CATÁLOGO
   ========================================================= */
function productCard(p) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article class="card product-card h-100 shadow-sm">
        <div class="product-img ${p.theme}">
          ${discount ? `<span class="badge bg-danger badge-promo">-${discount}%</span>` : ""}
          <span role="img" aria-label="${p.name}">${p.emoji}</span>
        </div>
        <div class="card-body d-flex flex-column">
          <span class="small text-gold text-uppercase fw-semibold">${p.category}</span>
          <h3 class="h6 card-title mt-1">${p.name}</h3>
          <p class="small text-secondary mb-2">${p.volume} · ${p.abv}% alc.</p>
          <div class="mb-3">
            ${p.oldPrice ? `<div class="price-old">${formatCOP(p.oldPrice)}</div>` : ""}
            <div class="price-now">${formatCOP(p.price)}</div>
          </div>
          <div class="d-grid gap-2 mt-auto">
            <button type="button" class="btn btn-gold btn-sm" data-action="add" data-id="${p.id}">
              <i class="bi bi-cart-plus" aria-hidden="true"></i> Agregar
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-action="detail" data-id="${p.id}">
              Ver detalle
            </button>
          </div>
        </div>
      </article>
    </div>`;
}

function renderProducts() {
  const list = getFilteredProducts();
  $("#productGrid").innerHTML = list.map(productCard).join("");
  $("#noResults").classList.toggle("d-none", list.length > 0);
  $("#resultCount").textContent = `Mostrando ${list.length} de ${PRODUCTS.length} productos`;
}

function applyFilters() {
  syncCategoryUI();
  renderProducts();
}

/* =========================================================
   7. MODAL DE DETALLE
   ========================================================= */
function openProductModal(id) {
  selectedProduct = getProduct(id);
  if (!selectedProduct) return;
  const p = selectedProduct;

  $("#productModalTitle").textContent = p.name;
  $("#productModalBody").innerHTML = `
    <div class="product-img ${p.theme} rounded mb-3"><span role="img" aria-label="${p.name}">${p.emoji}</span></div>
    <p>${p.desc}</p>
    <ul class="list-unstyled small text-secondary">
      <li><strong>Categoría:</strong> ${p.category}</li>
      <li><strong>Contenido:</strong> ${p.volume}</li>
      <li><strong>Grado alcohólico:</strong> ${p.abv}%</li>
    </ul>
    <div>
      ${p.oldPrice ? `<span class="price-old me-2">${formatCOP(p.oldPrice)}</span>` : ""}
      <span class="price-now fs-4">${formatCOP(p.price)}</span>
    </div>`;
  bootstrap.Modal.getOrCreateInstance($("#productModal")).show();
}

/* =========================================================
   8. CARRITO: LÓGICA
   ========================================================= */
function addToCart(id) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`"${getProduct(id).name}" agregado al carrito`);
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  appliedCoupon = null;
  $("#couponMsg").textContent = "";
  $("#couponInput").value = "";
  saveCart();
  renderCart();
}

function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + getProduct(item.id).price * item.qty, 0);
  const discount = appliedCoupon ? Math.round(subtotal * appliedCoupon.rate) : 0;
  const afterDiscount = subtotal - discount;
  const shipping = cart.length === 0 || afterDiscount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  const total = afterDiscount + shipping;
  const units = cart.reduce((sum, item) => sum + item.qty, 0);
  return { subtotal, discount, shipping, total, units };
}

function applyCoupon(codeText) {
  const code = codeText.trim().toUpperCase();
  const msg = $("#couponMsg");

  if (!code) {
    msg.className = "small mb-2 text-danger";
    msg.textContent = "Escribe un cupón.";
    return;
  }
  if (COUPONS[code] === undefined) {
    appliedCoupon = null;
    msg.className = "small mb-2 text-danger";
    msg.textContent = "Cupón no válido.";
  } else {
    appliedCoupon = { code, rate: COUPONS[code] };
    msg.className = "small mb-2 text-success";
    msg.textContent = `Cupón ${code} aplicado: ${COUPONS[code] * 100}% de descuento.`;
  }
  renderCart();
}

/* =========================================================
   9. CARRITO: INTERFAZ
   ========================================================= */
function renderCart() {
  const list = $("#cartItems");
  const totals = calculateTotals();
  const isEmpty = cart.length === 0;

  $("#cartEmpty").classList.toggle("d-none", !isEmpty);
  $("#cartFooter").classList.toggle("d-none", isEmpty);
  $("#cartBadge").firstChild.textContent = totals.units;

  list.innerHTML = cart.map((item) => {
    const p = getProduct(item.id);
    return `
      <li class="list-group-item px-0">
        <div class="d-flex gap-2 align-items-center">
          <div class="cart-item-emoji" aria-hidden="true">${p.emoji}</div>
          <div class="flex-grow-1">
            <div class="fw-semibold small">${p.name}</div>
            <div class="small text-secondary">${formatCOP(p.price)} c/u</div>
            <div class="d-flex align-items-center gap-2 mt-1">
              <button type="button" class="btn btn-outline-secondary qty-btn" data-cart="minus" data-id="${p.id}" aria-label="Disminuir cantidad de ${p.name}">−</button>
              <span aria-live="polite">${item.qty}</span>
              <button type="button" class="btn btn-outline-secondary qty-btn" data-cart="plus" data-id="${p.id}" aria-label="Aumentar cantidad de ${p.name}">+</button>
            </div>
          </div>
          <div class="text-end">
            <div class="fw-bold small">${formatCOP(p.price * item.qty)}</div>
            <button type="button" class="btn btn-link btn-sm text-danger p-0" data-cart="remove" data-id="${p.id}" aria-label="Quitar ${p.name} del carrito">
              <i class="bi bi-trash" aria-hidden="true"></i> Quitar
            </button>
          </div>
        </div>
      </li>`;
  }).join("");

  $("#sumSubtotal").textContent = formatCOP(totals.subtotal);
  $("#sumDiscount").textContent = totals.discount ? `- ${formatCOP(totals.discount)}` : formatCOP(0);
  $("#sumShipping").textContent = totals.shipping === 0 && !isEmpty ? "Gratis" : formatCOP(totals.shipping);
  $("#sumTotal").textContent = formatCOP(totals.total);
}

/* =========================================================
   10. FINALIZAR COMPRA (SIMULADA)
   ========================================================= */
function openCheckout() {
  if (cart.length === 0) {
    showToast("Tu carrito está vacío");
    return;
  }
  const t = calculateTotals();

  const rows = cart.map((item) => {
    const p = getProduct(item.id);
    return `<tr><td>${p.name}</td><td class="text-center">${item.qty}</td><td class="text-end">${formatCOP(p.price * item.qty)}</td></tr>`;
  }).join("");

  $("#checkoutBody").innerHTML = `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr><th>Producto</th><th class="text-center">Cant.</th><th class="text-end">Valor</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <ul class="list-unstyled small mb-3">
      <li class="d-flex justify-content-between"><span>Subtotal</span><span>${formatCOP(t.subtotal)}</span></li>
      <li class="d-flex justify-content-between text-success"><span>Descuento ${appliedCoupon ? "(" + appliedCoupon.code + ")" : ""}</span><span>- ${formatCOP(t.discount)}</span></li>
      <li class="d-flex justify-content-between"><span>Envío</span><span>${t.shipping === 0 ? "Gratis" : formatCOP(t.shipping)}</span></li>
      <li class="d-flex justify-content-between fs-5 fw-bold mt-2"><span>Total</span><span>${formatCOP(t.total)}</span></li>
    </ul>
    <div class="alert alert-warning small mb-0" role="alert">
      Simulación académica: no se realiza ningún cobro ni venta real.
    </div>`;

  const offcanvas = bootstrap.Offcanvas.getInstance($("#cartCanvas"));
  if (offcanvas) offcanvas.hide();
  bootstrap.Modal.getOrCreateInstance($("#checkoutModal")).show();
}

function confirmOrder() {
  const t = calculateTotals();
  const orderNumber = "CA-" + Date.now().toString().slice(-6);
  bootstrap.Modal.getInstance($("#checkoutModal")).hide();
  clearCart();
  showToast(`Pedido ${orderNumber} simulado por ${formatCOP(t.total)}. ¡Gracias!`);
}

/* =========================================================
   11. FORMULARIO DE CONTACTO
   ========================================================= */
function isAdult(dateString) {
  const birth = new Date(dateString);
  if (isNaN(birth)) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

function initContactForm() {
  const form = $("#contactForm");
  const birth = $("#cBirth");
  birth.max = new Date().toISOString().split("T")[0]; // no permite fechas futuras

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Validación personalizada: mayoría de edad
    if (birth.value && !isAdult(birth.value)) {
      birth.setCustomValidity("Debes ser mayor de 18 años.");
      $("#birthFeedback").textContent = "Debes ser mayor de 18 años.";
    } else {
      birth.setCustomValidity("");
      $("#birthFeedback").textContent = "Ingresa tu fecha de nacimiento.";
    }

    form.classList.add("was-validated");
    if (!form.checkValidity()) return;

    $("#formAlert").innerHTML = `
      <div class="alert alert-success alert-dismissible fade show" role="alert">
        <strong>¡Mensaje enviado!</strong> Gracias, ${$("#cName").value.trim()}. Te responderemos pronto (simulación).
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar alerta"></button>
      </div>`;
    form.reset();
    form.classList.remove("was-validated");
  });

  // Quita el error personalizado al cambiar la fecha
  birth.addEventListener("input", () => birth.setCustomValidity(""));
}

/* =========================================================
   12. EVENTOS
   ========================================================= */
function initEvents() {
  // Catálogo: delegación de eventos (agregar / detalle)
  $("#productGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "add") addToCart(id);
    if (btn.dataset.action === "detail") openProductModal(id);
  });

  // Categorías (tarjetas)
  $("#categoryGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    filters.category = filters.category === btn.dataset.category ? "Todas" : btn.dataset.category;
    applyFilters();
    $("#catalogo").scrollIntoView();
  });

  // Filtros
  $("#categorySelect").addEventListener("change", (e) => { filters.category = e.target.value; applyFilters(); });
  $("#sortSelect").addEventListener("change", (e) => { filters.sort = e.target.value; applyFilters(); });
  $("#searchInput").addEventListener("input", (e) => { filters.search = e.target.value; applyFilters(); });
  $("#filterForm").addEventListener("submit", (e) => e.preventDefault());

  $("#btnClearFilters").addEventListener("click", () => {
    filters.category = "Todas";
    filters.search = "";
    filters.sort = "default";
    filters.onlyOffers = false;
    $("#searchInput").value = "";
    $("#sortSelect").value = "default";
    applyFilters();
  });

  // Promociones
  $("#btnOnlyOffers").addEventListener("click", () => {
    filters.onlyOffers = true;
    filters.category = "Todas";
    applyFilters();
    $("#catalogo").scrollIntoView();
    showToast("Mostrando solo productos en oferta");
  });

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast(`Cupón ${btn.dataset.copy} copiado`);
      } catch (error) {
        showToast(`Tu cupón es ${btn.dataset.copy}`);
      }
    });
  });

  // Modal de detalle
  $("#productModalAdd").addEventListener("click", () => {
    if (selectedProduct) addToCart(selectedProduct.id);
    bootstrap.Modal.getInstance($("#productModal")).hide();
  });

  // Carrito: delegación (+, −, quitar)
  $("#cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cart]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.cart === "plus") changeQty(id, 1);
    if (btn.dataset.cart === "minus") changeQty(id, -1);
    if (btn.dataset.cart === "remove") removeFromCart(id);
  });

  $("#couponForm").addEventListener("submit", (e) => {
    e.preventDefault();
    applyCoupon($("#couponInput").value);
  });

  $("#btnClearCart").addEventListener("click", clearCart);
  $("#btnCheckout").addEventListener("click", openCheckout);
  $("#btnConfirmOrder").addEventListener("click", confirmOrder);
}

/* =========================================================
   13. INICIO DE LA APLICACIÓN
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  renderCategories();
  applyFilters();
  renderCart();
  initEvents();
  initContactForm();
  initAgeGate();
});