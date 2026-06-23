/**
 * VISTA — renderizado UI, componentes reutilizables
 * Patrón MVC: View layer
 */

// ─── TOAST ────────────────────────────────────────────────
const ToastView = {
  container: null,

  init() {
    this.container = document.querySelector('.toast-wrap');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-wrap';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  },

  show(msg, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success:'✓', error:'✗', info:'🍴' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.setAttribute('role', 'status');
    t.innerHTML = `<span aria-hidden="true">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
    this.container.appendChild(t);
    setTimeout(() => t.remove(), duration);
  },

  success(m) { this.show(m, 'success'); },
  error(m)   { this.show(m, 'error'); },
  info(m)    { this.show(m, 'info'); }
};

// ─── NAVBAR VIEW ─────────────────────────────────────────
const NavbarView = {
  render(activePage = '') {
    const user = AuthModel.getUser();
    const nav  = document.getElementById('navbar');
    if (!nav) return;

    nav.innerHTML = `
      <a href="index.html" class="nav-brand" aria-label="Sabor Ecuatoriano - Inicio">Sabor <em>Ecuatoriano</em></a>
      <ul class="nav-links" role="navigation" aria-label="Menú principal">
        <li><a href="index.html"    ${activePage==='inicio'?'aria-current="page"':''}>Inicio</a></li>
        <li><a href="menu.html"     ${activePage==='menu'?'aria-current="page"':''}>Menú</a></li>
        ${user ? `<li><a href="mis-pedidos.html" ${activePage==='pedidos'?'aria-current="page"':''}>Mis pedidos</a></li>` : ''}
      </ul>
      <div class="nav-actions">
        <button class="cart-btn" aria-label="Abrir carrito" id="cartToggle">
          🛒<span class="cart-badge" id="cartBadge" aria-label="${CartModel.count()} artículos en el carrito">${CartModel.count()}</span>
        </button>
        ${user
          ? `<button class="user-btn" id="userMenuBtn" aria-expanded="false" aria-haspopup="true">${user.nombre[0].toUpperCase()}</button>
             <div class="dropdown" id="userDropdown" role="menu" style="display:none;position:absolute;right:5%;top:68px;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);min-width:180px;overflow:hidden;z-index:500">
               <div style="padding:12px 16px;font-size:13px;color:var(--gris)">${user.nombre}</div>
               <hr style="margin:0;border-color:#f0e8d8">
               ${AuthModel.isAdmin() ? '<a href="admin.html" role="menuitem" style="display:block;padding:11px 16px;font-size:14px;text-decoration:none;color:var(--negro)">⚙ Panel admin</a>' : ''}
               <a href="mis-pedidos.html" role="menuitem" style="display:block;padding:11px 16px;font-size:14px;text-decoration:none;color:var(--negro)">📦 Mis pedidos</a>
               <a href="mi-cuenta.html" role="menuitem" style="display:block;padding:11px 16px;font-size:14px;text-decoration:none;color:var(--negro)">💳 Mi cuenta</a>
               <hr style="margin:0;border-color:#f0e8d8">
               <button id="logoutBtn" role="menuitem" style="width:100%;padding:11px 16px;font-size:14px;border:none;background:none;text-align:left;cursor:pointer;color:var(--rojo)">Cerrar sesión</button>
             </div>`
          : `<a href="login.html" class="btn btn-primary btn-sm">Ingresar</a>`
        }
      </div>
    `;

    // Eventos navbar
    document.getElementById('cartToggle')?.addEventListener('click', CartView.toggle);
    document.getElementById('userMenuBtn')?.addEventListener('click', () => {
      const d = document.getElementById('userDropdown');
      const btn = document.getElementById('userMenuBtn');
      const isOpen = d.style.display !== 'none';
      d.style.display = isOpen ? 'none' : 'block';
      btn.setAttribute('aria-expanded', !isOpen);
    });
    document.getElementById('logoutBtn')?.addEventListener('click', () => AuthModel.logout());
    document.addEventListener('click', e => {
      if (!e.target.closest('#userMenuBtn') && !e.target.closest('#userDropdown'))
        document.getElementById('userDropdown') && (document.getElementById('userDropdown').style.display = 'none');
    });
  }
};

// ─── CARRITO VIEW ─────────────────────────────────────────
const CartView = {
  toggle() {
    document.querySelector('.overlay')?.classList.toggle('open');
    document.querySelector('.carrito-drawer')?.classList.toggle('open');
    CartView.renderItems();
  },

  renderItems() {
    const items = CartModel.get();
    const el = document.getElementById('carritoItems');
    if (!el) return;

    if (!items.length) {
      el.innerHTML = '<div class="carrito-empty" role="status"><p style="font-size:40px;margin-bottom:12px">🛒</p><p>Tu carrito está vacío</p></div>';
    } else {
      el.innerHTML = items.map(i => `
        <div class="carrito-item" role="listitem">
          <div class="carrito-item-info">
            <div class="carrito-item-name">${i.nombre}</div>
            <div class="carrito-item-price">${fmt$(i.precio)} c/u</div>
          </div>
          <div class="qty-btns" aria-label="Cantidad de ${i.nombre}">
            <button class="qty-btn" onclick="CartModel.dec(${i.id});CartView.renderItems();CartView.updateBadge()" aria-label="Disminuir cantidad">−</button>
            <span aria-live="polite">${i.cantidad}</span>
            <button class="qty-btn" onclick="CartModel.inc(${i.id});CartView.renderItems();CartView.updateBadge()" aria-label="Aumentar cantidad">+</button>
          </div>
          <span style="font-weight:600;min-width:60px;text-align:right;font-size:14px">${fmt$(i.precio*i.cantidad)}</span>
        </div>
      `).join('');
    }

    document.getElementById('cartSubtotal').textContent = fmt$(CartModel.total());
    document.getElementById('cartIva').textContent      = fmt$(CartModel.iva());
    document.getElementById('cartTotal').textContent    = fmt$(CartModel.grandTotal());
    this.updateBadge();
  },

  updateBadge() {
    document.querySelectorAll('.cart-badge, #cartBadge').forEach(el => {
      el.textContent = CartModel.count();
      el.setAttribute('aria-label', `${CartModel.count()} artículos en el carrito`);
    });
  },

  initDrawer() {
    const html = `
      <div class="overlay" id="cartOverlay" role="dialog" aria-modal="true" aria-label="Carrito de compras"></div>
      <aside class="carrito-drawer" id="carritoDrawer">
        <div class="carrito-header">
          <h3>Tu pedido</h3>
          <button class="carrito-close" id="cartClose" aria-label="Cerrar carrito">✕</button>
        </div>
        <div class="carrito-items" id="carritoItems" role="list"></div>
        <div class="carrito-footer">
          <div class="total-row"><span>Subtotal</span><span id="cartSubtotal">$0.00</span></div>
          <div class="total-row"><span>IVA (15%)</span><span id="cartIva">$0.00</span></div>
          <div class="total-row bold"><span>Total</span><span id="cartTotal">$0.00</span></div>
          <button class="btn btn-primary btn-full" id="btnCheckout">Confirmar pedido</button>
        </div>
      </aside>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('cartOverlay').addEventListener('click', CartView.toggle);
    document.getElementById('cartClose').addEventListener('click', CartView.toggle);
    document.getElementById('btnCheckout').addEventListener('click', () => {
      if (!AuthModel.isLogged()) { ToastView.info('Inicia sesión para hacer tu pedido'); window.location.href='login.html'; return; }
      if (!CartModel.count())   { ToastView.error('Tu carrito está vacío'); return; }
      CartView.toggle();
      window.location.href = 'checkout.html';
    });
  }
};

// ─── PLATO CARD VIEW ──────────────────────────────────────
const PlatoCardView = {
  render(plato) {
    return `
      <article class="plato-card" aria-label="${plato.nombre}">
        <div class="plato-img" aria-hidden="true">
          ${plato.imagenUrl
            ? `<img src="${plato.imagenUrl}" alt="${plato.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='🍽'">`
            : '🍽'}
        </div>
        <div class="plato-body">
          <p class="plato-cat">${plato.categoria?.nombre || ''}</p>
          <h3 class="plato-nombre">${plato.nombre}</h3>
          <p class="plato-desc">${plato.descripcion || 'Plato tradicional ecuatoriano.'}</p>
          <div class="plato-footer">
            <span class="plato-precio" aria-label="Precio: ${fmt$(plato.precio)}">${fmt$(plato.precio)}</span>
            <button class="btn-agregar" data-id="${plato.id}" data-nombre="${plato.nombre}" data-precio="${plato.precio}" aria-label="Agregar ${plato.nombre} al carrito">+</button>
          </div>
        </div>
      </article>
    `;
  },

  renderSkeleton() {
    return `<div class="plato-card" aria-hidden="true" style="animation:pulse 1.5s infinite">
      <div class="plato-img" style="background:var(--beige)"></div>
      <div class="plato-body"><div style="height:14px;background:var(--beige);border-radius:4px;margin-bottom:8px"></div><div style="height:20px;background:var(--beige);border-radius:4px;width:70%"></div></div>
    </div>`;
  }
};

// ─── BADGE ESTADO ─────────────────────────────────────────
function badgeEstado(estado) {
  const labels = { pendiente:'Pendiente', en_preparacion:'En preparación', listo:'Listo', entregado:'Entregado', cancelado:'Cancelado', emitida:'Emitida', pagada:'Pagada', anulada:'Anulada' };
  return `<span class="badge badge-${estado}">${labels[estado]||estado}</span>`;
}
