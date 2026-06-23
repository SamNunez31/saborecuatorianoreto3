/**
 * CONTROLADOR — manejo de eventos, navegación y flujos
 * Patrón MVC: Controller layer
 */

// ─── MENU CONTROLLER ─────────────────────────────────────
const MenuController = {
  platos: [],

  async init() {
    NavbarView.render('menu');
    CartView.initDrawer();
    ToastView.init();

    // Skeleton mientras carga
    document.getElementById('platosGrid').innerHTML =
      Array(6).fill(PlatoCardView.renderSkeleton()).join('');

    try {
      const [platos, categorias] = await Promise.all([
        PlatosModel.getAll(),
        PlatosModel.getCategorias()
      ]);
      this.platos = platos;

      // Renderizar filtros
      const filtrosEl = document.getElementById('filtros');
      categorias.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'filtro-btn';
        btn.textContent = c.nombre;
        btn.dataset.id  = c.id;
        btn.addEventListener('click', () => this.filtrar(c.id, btn));
        filtrosEl.appendChild(btn);
      });

      this.renderPlatos(platos);
    } catch(e) {
      document.getElementById('platosGrid').innerHTML =
        `<p role="alert" style="color:var(--rojo);padding:40px">Error al cargar el menú: ${e.message}</p>`;
    }

    // Evento cargar categoría preferida de cookie
    const prefCat = getCookie('categoriaPreferida');
    if (prefCat && prefCat !== 'all') {
      const btn = document.querySelector(`[data-id="${prefCat}"]`);
      if (btn) this.filtrar(parseInt(prefCat), btn);
    }
  },

  filtrar(catId, btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.cookie = `categoriaPreferida=${catId}; path=/; max-age=${7*86400}; SameSite=Lax`;
    const filtrados = this.platos.filter(p => p.categoriaId === catId);
    this.renderPlatos(filtrados);
  },

  renderPlatos(platos) {
    const grid = document.getElementById('platosGrid');
    if (!platos.length) {
      grid.innerHTML = `<p style="color:var(--gris);padding:40px;text-align:center" role="status">Sin platos en esta categoría.</p>`;
      return;
    }
    grid.innerHTML = platos.map(p => PlatoCardView.render(p)).join('');

    // Eventos agregar al carrito
    grid.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', () => {
        CartModel.add({ id:+btn.dataset.id, nombre:btn.dataset.nombre, precio:+btn.dataset.precio });
        CartView.updateBadge();
        ToastView.success(`${btn.dataset.nombre} agregado`);
      });
    });
  }
};

// ─── HOME CONTROLLER ──────────────────────────────────────
const HomeController = {
  async init() {
    NavbarView.render('inicio');
    CartView.initDrawer();
    ToastView.init();

    // Registrar visita con cookie
    const visitas = parseInt(getCookie('numVisitas') || '0') + 1;
    document.cookie = `numVisitas=${visitas}; path=/; max-age=${365*86400}; SameSite=Lax`;
    document.cookie = `ultimaVisita=${new Date().toISOString()}; path=/; max-age=${365*86400}; SameSite=Lax`;

    try {
      const platos = await PlatosModel.getAll();
      const grid = document.getElementById('featuredPlatos');
      if (grid) grid.innerHTML = platos.slice(0,3).map(p => PlatoCardView.render(p)).join('');
      grid?.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', () => {
          CartModel.add({ id:+btn.dataset.id, nombre:btn.dataset.nombre, precio:+btn.dataset.precio });
          CartView.updateBadge();
          ToastView.success(`${btn.dataset.nombre} agregado`);
        });
      });
    } catch(e) {}
  }
};

// ─── AUTH CONTROLLER ──────────────────────────────────────
const AuthController = {
  initLogin() {
    if (AuthModel.isLogged()) { window.location.href = AuthModel.isAdmin() ? 'admin.html' : 'index.html'; return; }
    ToastView.init();

    document.getElementById('loginForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass  = document.getElementById('loginPass').value;
      const btn   = document.getElementById('btnLogin');

      if (!this.validateField('loginEmail', email, 'Email inválido', v => /\S+@\S+\.\S+/.test(v))) return;
      if (!this.validateField('loginPass', pass, 'Contraseña requerida', v => v.length > 0)) return;

      btn.disabled = true; btn.textContent = 'Ingresando...';
      try {
        const { token, usuario } = await apiFetch('/auth/login', { method:'POST', body:JSON.stringify({ email, password:pass }) });
        AuthModel.save(token, usuario);
        // Guardar en sessionStorage para la sesión
        sessionStorage.setItem('loginTimestamp', Date.now());
        ToastView.success(`¡Bienvenido, ${usuario.nombre}!`);
        setTimeout(() => { window.location.href = usuario.rol==='admin'||usuario.rol==='cajero' ? 'admin.html' : 'index.html'; }, 800);
      } catch(err) {
        ToastView.error(err.message);
        btn.disabled = false; btn.textContent = 'Ingresar';
      }
    });
  },

  initRegister() {
    if (AuthModel.isLogged()) { window.location.href = 'index.html'; return; }
    ToastView.init();

    document.getElementById('registerForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const nombre   = document.getElementById('regNombre').value.trim();
      const apellido = document.getElementById('regApellido').value.trim();
      const email    = document.getElementById('regEmail').value.trim();
      const pass     = document.getElementById('regPass').value;
      const tel      = document.getElementById('regTel').value.trim();
      const dir      = document.getElementById('regDir').value.trim();

      let valid = true;
      if (!this.validateField('regNombre', nombre, 'Nombre requerido', v => v.length>0)) valid=false;
      if (!this.validateField('regEmail', email, 'Email inválido', v => /\S+@\S+\.\S+/.test(v))) valid=false;
      if (!this.validateField('regPass', pass, 'Mínimo 6 caracteres', v => v.length>=6)) valid=false;
      if (!valid) return;

      const btn = document.getElementById('btnRegister');
      btn.disabled=true; btn.textContent='Creando cuenta...';
      try {
        const { token, usuario } = await apiFetch('/auth/register', { method:'POST', body:JSON.stringify({ nombre, apellido, email, password:pass, telefono:tel, direccion:dir }) });
        AuthModel.save(token, usuario);
        ToastView.success('¡Cuenta creada exitosamente!');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      } catch(err) {
        ToastView.error(err.message);
        btn.disabled=false; btn.textContent='Crear cuenta';
      }
    });
  },

  validateField(id, value, msg, fn) {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`${id}Err`);
    if (!fn(value)) {
      input?.setAttribute('aria-invalid','true');
      if (errEl) { errEl.textContent=msg; errEl.style.display='block'; }
      return false;
    }
    input?.setAttribute('aria-invalid','false');
    if (errEl) errEl.style.display='none';
    return true;
  }
};

// ─── CHECKOUT CONTROLLER ──────────────────────────────────
const CheckoutController = {
  formaPagoId: null,
  tarjetaId: null,
  tipoEntrega: 'retiro',

  async init() {
    if (!AuthModel.isLogged()) { window.location.href='login.html'; return; }
    if (!CartModel.count())   { window.location.href='menu.html'; return; }
    NavbarView.render();
    ToastView.init();

    this.renderResumen();
    await this.loadFormasPago();
    await this.loadTarjetas();

    document.querySelectorAll('input[name="entrega"]').forEach(r => {
      r.addEventListener('change', e => { this.tipoEntrega = e.target.value; });
    });

    document.getElementById('btnConfirmar')?.addEventListener('click', () => this.confirmar());
  },

  renderResumen() {
    const items = CartModel.get();
    document.getElementById('resumenItems').innerHTML = items.map(i =>
      `<div class="pedido-row"><span>${i.cantidad}× ${i.nombre}</span><span>${fmt$(i.precio*i.cantidad)}</span></div>`
    ).join('');
    document.getElementById('ckSubtotal').textContent = fmt$(CartModel.total());
    document.getElementById('ckIva').textContent      = fmt$(CartModel.iva());
    document.getElementById('ckTotal').textContent    = fmt$(CartModel.grandTotal());
  },

  async loadFormasPago() {
    const formas = [
      { id:1, tipo:'Efectivo', icon:'💵' },
      { id:2, tipo:'Tarjeta de crédito', icon:'💳' },
      { id:3, tipo:'Tarjeta de débito', icon:'💳' },
      { id:4, tipo:'Transferencia bancaria', icon:'🏦' }
    ];
    const el = document.getElementById('formasPago');
    if (!el) return;
    el.innerHTML = formas.map(f => `
      <div class="forma-opcion" role="radio" tabindex="0" data-id="${f.id}" aria-checked="false"
           style="border:1.5px solid #ddd;border-radius:8px;padding:12px 14px;cursor:pointer;transition:.2s;display:flex;align-items:center;gap:10px;margin-bottom:8px"
           onclick="CheckoutController.selectForma(${f.id})"
           onkeydown="if(event.key==='Enter'||event.key===' ')CheckoutController.selectForma(${f.id})">
        <span style="font-size:20px">${f.icon}</span>
        <span style="font-size:14px;font-weight:500">${f.tipo}</span>
      </div>
    `).join('');
  },

  selectForma(id) {
    this.formaPagoId = id;
    document.querySelectorAll('.forma-opcion').forEach(el => {
      const active = +el.dataset.id === id;
      el.style.borderColor = active ? 'var(--dorado)' : '#ddd';
      el.style.background  = active ? 'rgba(201,150,26,.06)' : '';
      el.setAttribute('aria-checked', active);
    });
    document.getElementById('seccionTarjetas').style.display = [2,3].includes(id) ? 'block' : 'none';
  },

  async loadTarjetas() {
    try {
      const tarjetas = await TarjetasModel.getAll();
      const el = document.getElementById('tarjetasLista');
      if (!el) return;
      if (!tarjetas.length) { el.innerHTML='<p style="font-size:13px;color:var(--gris)">Sin tarjetas guardadas. <a href="mi-cuenta.html">Agregar</a></p>'; return; }
      el.innerHTML = tarjetas.map(t => `
        <div class="tarjeta-opcion" data-id="${t.id}" role="radio" tabindex="0" aria-checked="${t.esPrincipal}"
             style="border:1.5px solid ${t.esPrincipal?'var(--dorado)':'#ddd'};border-radius:8px;padding:11px;cursor:pointer;display:flex;gap:10px;align-items:center;margin-bottom:8px;font-size:13px;transition:.2s;${t.esPrincipal?'background:rgba(201,150,26,.06)':''}"
             onclick="CheckoutController.selectTarjeta(${t.id})"
             onkeydown="if(event.key==='Enter')CheckoutController.selectTarjeta(${t.id})">
          <span>💳</span>
          <div><div style="font-weight:600">${t.marca} ${t.numeroMasked}</div><div style="color:var(--gris)">${t.titular}</div></div>
        </div>
      `).join('');
      if (tarjetas.find(t=>t.esPrincipal)) this.tarjetaId = tarjetas.find(t=>t.esPrincipal).id;
    } catch(e) {}
  },

  selectTarjeta(id) {
    this.tarjetaId = id;
    document.querySelectorAll('.tarjeta-opcion').forEach(el => {
      const active = +el.dataset.id === id;
      el.style.borderColor = active ? 'var(--dorado)' : '#ddd';
      el.style.background  = active ? 'rgba(201,150,26,.06)' : '';
      el.setAttribute('aria-checked', active);
    });
  },

  async confirmar() {
    if (!this.formaPagoId) { ToastView.error('Selecciona una forma de pago'); return; }
    if ([2,3].includes(this.formaPagoId) && !this.tarjetaId) { ToastView.error('Selecciona una tarjeta'); return; }

    const btn = document.getElementById('btnConfirmar');
    btn.disabled=true; btn.textContent='Procesando...';

    try {
      const items = CartModel.get();
      const obs   = document.getElementById('observaciones')?.value || '';

      const { pedido, factura } = await PedidosModel.create({
        items: items.map(i => ({ platoId:i.id, cantidad:i.cantidad })),
        tipoEntrega: this.tipoEntrega,
        observaciones: obs
      });

      await apiFetch('/pagos', { method:'POST', body:JSON.stringify({
        facturaId:   factura.id,
        formaPagoId: this.formaPagoId,
        tarjetaId:   [2,3].includes(this.formaPagoId) ? this.tarjetaId : null,
        monto:       factura.total
      }) });

      CartModel.clear();
      CartView.updateBadge();
      // Guardar último pedido en sessionStorage
      sessionStorage.setItem('ultimoPedido', JSON.stringify({ pedidoId:pedido.id, facturaId:factura.id }));
      ToastView.success('¡Pedido confirmado! Redirigiendo...');
      setTimeout(() => { window.location.href='mis-pedidos.html'; }, 1500);
    } catch(e) {
      ToastView.error(e.message);
      btn.disabled=false; btn.textContent='Confirmar y pagar';
    }
  }
};

// ─── MIS PEDIDOS CONTROLLER ───────────────────────────────
const MisPedidosController = {
  async init() {
    if (!AuthModel.isLogged()) { window.location.href='login.html'; return; }
    NavbarView.render('pedidos');
    CartView.initDrawer();
    ToastView.init();

    const el = document.getElementById('pedidosList');
    el.innerHTML = '<div role="status" aria-live="polite" style="text-align:center;padding:60px;color:var(--gris)">Cargando tus pedidos...</div>';

    try {
      const pedidos = await PedidosModel.getMios();
      if (!pedidos.length) {
        el.innerHTML = `<div style="text-align:center;padding:60px" role="status">
          <p style="font-size:40px;margin-bottom:12px">📦</p>
          <h3>Aún no tienes pedidos</h3>
          <p style="color:var(--gris);margin-bottom:20px">Explora el menú y haz tu primer pedido.</p>
          <a href="menu.html" class="btn btn-primary">Ver menú</a>
        </div>`;
        return;
      }
      el.innerHTML = pedidos.map(p => {
        const f = p.factura;
        return `
        <article class="pedido-card" aria-label="Pedido ${f?.numeroFactura||'#'+p.id}">
          <div class="pedido-head">
            <div>
              <strong>${f?.numeroFactura||'#'+p.id}</strong>
              <span style="font-size:13px;color:var(--gris);margin-left:10px">${fmtDT(p.fechaPedido)}</span>
              <span style="margin-left:10px">${p.tipoEntrega==='domicilio'?'🛵':'🏪'}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              ${badgeEstado(p.estado)}
              ${f ? `<button class="btn btn-outline btn-sm" onclick="MisPedidosController.verFactura(${f.id})" aria-label="Ver factura ${f.numeroFactura}">Ver factura</button>` : ''}
            </div>
          </div>
          <div class="pedido-body">
            ${p.detalles.map(d=>`<div class="pedido-row"><span>${d.cantidad}× ${d.plato?.nombre}</span><span>${fmt$(d.precioUnitario*d.cantidad)}</span></div>`).join('')}
          </div>
          ${f ? `<div class="pedido-foot" style="display:flex;justify-content:space-between">
            <div style="font-size:14px"><div style="color:var(--gris)">Subtotal: ${fmt$(f.subtotal)}</div><div style="color:var(--gris)">IVA: ${fmt$(f.iva)}</div></div>
            <div style="font-weight:700;font-size:16px">Total: ${fmt$(f.total)}</div>
          </div>` : ''}
        </article>`;
      }).join('');
    } catch(e) {
      el.innerHTML = `<p role="alert" style="color:var(--rojo);padding:40px">${e.message}</p>`;
    }
  },

  async verFactura(id) {
    try {
      const f = await FacturasModel.getById(id);
      const c = f.pedido?.cliente;
      const modal = document.getElementById('facturaModal');
      document.getElementById('facturaContent').innerHTML = `
        <div style="border:1.5px solid #e8e2d8;border-radius:10px;padding:22px;font-size:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:18px">
            <div><strong style="font-family:var(--serif)">Sabor Ecuatoriano</strong><div style="font-size:12px;color:var(--gris)">RUC 1234567890001</div></div>
            <div style="text-align:right"><strong>${f.numeroFactura}</strong><div style="font-size:12px;color:var(--gris)">${fmtDate(f.fechaEmision)}</div></div>
          </div>
          <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0e8d8">
            <div style="font-size:11px;color:var(--gris);text-transform:uppercase;margin-bottom:4px">Cliente</div>
            <div style="font-weight:600">${c?.nombre} ${c?.apellido}</div>
            <div style="color:var(--gris)">${c?.cedula?'CI: '+c.cedula:'Consumidor final'}</div>
          </div>
          ${f.pedido.detalles.map(d=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f0e8"><span>${d.cantidad}× ${d.plato?.nombre}</span><span>${fmt$(d.precioUnitario*d.cantidad)}</span></div>`).join('')}
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid #e8e2d8">
            <div style="display:flex;justify-content:space-between;color:var(--gris);margin-bottom:4px"><span>Subtotal</span><span>${fmt$(f.subtotal)}</span></div>
            <div style="display:flex;justify-content:space-between;color:var(--gris);margin-bottom:8px"><span>IVA 15%</span><span>${fmt$(f.iva)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px"><span>TOTAL</span><span>${fmt$(f.total)}</span></div>
          </div>
          <div style="margin-top:14px;text-align:center">${badgeEstado(f.estado)}</div>
        </div>
      `;
      modal.classList.add('open');
    } catch(e) { ToastView.error('No se pudo cargar la factura'); }
  }
};

// ─── MI CUENTA CONTROLLER ─────────────────────────────────
const MiCuentaController = {
  marcaActual: 'Visa',

  async init() {
    if (!AuthModel.isLogged()) { window.location.href='login.html'; return; }
    NavbarView.render();
    ToastView.init();
    this.renderPerfil();
    await this.loadTarjetas();
    this.initCardForm();
  },

  renderPerfil() {
    const u = AuthModel.getUser();
    document.getElementById('perfilNombre').textContent = u?.nombre || '';
    document.getElementById('perfilEmail').textContent  = u?.email  || '';
    document.getElementById('perfilRol').innerHTML      = `<span class="badge" style="background:var(--beige);color:var(--negro)">${u?.rol||''}</span>`;
  },

  async loadTarjetas() {
    try {
      const tarjetas = await TarjetasModel.getAll();
      const el = document.getElementById('tarjetasList');
      if (!tarjetas.length) { el.innerHTML='<p style="font-size:14px;color:var(--gris);margin-bottom:16px">Sin tarjetas guardadas.</p>'; return; }
      el.innerHTML = tarjetas.map(t => `
        <div style="display:flex;align-items:center;gap:14px;padding:14px;border:1.5px solid ${t.esPrincipal?'var(--dorado)':'#e8e2d8'};border-radius:10px;margin-bottom:10px;background:${t.esPrincipal?'rgba(201,150,26,.04)':'#fff'}">
          <span style="font-size:28px">💳</span>
          <div style="flex:1">
            <div style="font-weight:600">${t.marca} ${t.numeroMasked}</div>
            <div style="font-size:13px;color:var(--gris)">${t.titular} · Vence ${t.mesExp}/${t.anioExp}</div>
            ${t.esPrincipal?'<span class="badge badge-pagada" style="margin-top:4px">Principal</span>':''}
          </div>
          <div style="display:flex;gap:8px">
            ${!t.esPrincipal?`<button class="btn btn-outline btn-sm" onclick="MiCuentaController.setPrincipal(${t.id})" aria-label="Marcar ${t.marca} como principal">Principal</button>`:''}
            <button class="btn btn-danger btn-sm" onclick="MiCuentaController.deleteTarjeta(${t.id})" aria-label="Eliminar tarjeta ${t.marca}">✕</button>
          </div>
        </div>
      `).join('');
    } catch(e) { ToastView.error(e.message); }
  },

  initCardForm() {
    // Preview de tarjeta virtual
    const inputs = ['cardNum','cardTitular','cardMes','cardAnio'];
    inputs.forEach(id => document.getElementById(id)?.addEventListener('input', () => this.updatePreview()));

    document.querySelectorAll('.marca-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.marca-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.marcaActual = btn.dataset.marca;
        const card = document.getElementById('virtualCard');
        card.className = `card-virtual ${this.marcaActual}`;
        this.updatePreview();
      });
    });

    document.getElementById('cardNum')?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,16);
      e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
      this.updatePreview();
    });

    document.getElementById('cardTitular')?.addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase();
      this.updatePreview();
    });

    document.getElementById('saveTarjetaBtn')?.addEventListener('click', () => this.saveTarjeta());
  },

  updatePreview() {
    const num     = document.getElementById('cardNum')?.value || '';
    const titular = document.getElementById('cardTitular')?.value || 'TU NOMBRE';
    const mes     = document.getElementById('cardMes')?.value || 'MM';
    const anio    = (document.getElementById('cardAnio')?.value||'AAAA').slice(-2);
    const parts   = num.split(' ');
    const display = parts.map((p,i)=>i<parts.length-1?'****':p.padEnd(4,'*')).join(' ');
    const el = document.getElementById('virtualCard');
    if (el) {
      el.querySelector('.card-num').textContent = display||'**** **** **** ****';
      el.querySelector('#cvTitular').textContent = titular.substring(0,20);
      el.querySelector('#cvExp').textContent = `${mes}/${anio}`;
    }
  },

  async saveTarjeta() {
    const numero  = document.getElementById('cardNum')?.value.replace(/\s/g,'');
    const titular = document.getElementById('cardTitular')?.value.trim();
    const mes     = document.getElementById('cardMes')?.value;
    const anio    = document.getElementById('cardAnio')?.value;
    const cvv     = document.getElementById('cardCvv')?.value;

    if (!numero||numero.length<13) { ToastView.error('Número de tarjeta inválido'); return; }
    if (!titular) { ToastView.error('Ingresa el titular'); return; }
    if (!mes||!anio) { ToastView.error('Ingresa la fecha de vencimiento'); return; }
    if (!cvv) { ToastView.error('Ingresa el CVV'); return; }

    const btn = document.getElementById('saveTarjetaBtn');
    btn.disabled=true; btn.textContent='Guardando...';
    try {
      await TarjetasModel.create({ titular, numero, marca:this.marcaActual, mesExp:mes, anioExp:anio });
      ToastView.success('Tarjeta guardada');
      ['cardNum','cardTitular','cardMes','cardAnio','cardCvv'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value=''; });
      this.updatePreview();
      await this.loadTarjetas();
    } catch(e) { ToastView.error(e.message); }
    finally { btn.disabled=false; btn.textContent='Guardar tarjeta'; }
  },

  async deleteTarjeta(id) {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    try { await TarjetasModel.delete(id); ToastView.success('Tarjeta eliminada'); await this.loadTarjetas(); }
    catch(e) { ToastView.error(e.message); }
  },

  async setPrincipal(id) {
    try { await TarjetasModel.setPrincipal(id); ToastView.success('Tarjeta principal actualizada'); await this.loadTarjetas(); }
    catch(e) { ToastView.error(e.message); }
  }
};

// ─── ADMIN CONTROLLER ─────────────────────────────────────
const AdminController = {
  seccionActual: 'dashboard',

  async init() {
    if (!AuthModel.isLogged()||!AuthModel.isAdmin()) { window.location.href='login.html'; return; }
    ToastView.init();
    await this.showSection('dashboard');
  },

  async showSection(id) {
    this.seccionActual = id;
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.toggle('active', b.dataset.sec===id));
    document.querySelectorAll('.sec').forEach(s => s.style.display = s.id===`sec-${id}` ? 'block' : 'none');
    const loaders = { dashboard:()=>this.loadDashboard(), pedidos:()=>this.loadPedidos(), facturas:()=>this.loadFacturas(), ventas:()=>this.loadVentas(), platos:()=>this.loadPlatos(), clientes:()=>this.loadClientes() };
    await loaders[id]?.();
  },

  async loadDashboard() {
    try {
      const d = await AdminModel.getDashboard();
      document.getElementById('stVentas').textContent    = fmt$(d.ventasHoy);
      document.getElementById('stPedidos').textContent   = d.pedidosHoy;
      document.getElementById('stPend').textContent      = d.pedidosPendientes;
      document.getElementById('stClientes').textContent  = d.totalClientes;
      document.getElementById('stPlatos').textContent    = d.totalPlatos;
    } catch(e) { ToastView.error(e.message); }
  },

  async loadPedidos() {
    try {
      const pedidos = await PedidosModel.getAll();
      document.getElementById('pedidosBody').innerHTML = pedidos.map(p=>`
        <tr>
          <td style="font-weight:600">#${p.id}</td>
          <td>${p.cliente?.nombre} ${p.cliente?.apellido}</td>
          <td>${p.tipoEntrega==='domicilio'?'🛵':'🏪'} ${p.tipoEntrega}</td>
          <td style="font-size:13px;color:var(--gris)">${p.detalles?.slice(0,2).map(d=>d.plato?.nombre).join(', ')||'—'}</td>
          <td style="font-weight:600">${fmt$(p.factura?.total||0)}</td>
          <td>${badgeEstado(p.estado)}</td>
          <td style="font-size:13px">${fmtDT(p.fechaPedido)}</td>
          <td>
            <select class="form-input btn-sm" onchange="AdminController.cambiarEstado(${p.id},this.value)" aria-label="Cambiar estado del pedido #${p.id}" style="padding:6px;font-size:13px">
              ${['pendiente','en_preparacion','listo','entregado','cancelado'].map(e=>`<option value="${e}" ${p.estado===e?'selected':''}>${e.replace('_',' ')}</option>`).join('')}
            </select>
          </td>
        </tr>
      `).join('');
    } catch(e) { ToastView.error(e.message); }
  },

  async loadFacturas() {
    try {
      const facturas = await FacturasModel.getAll();
      document.getElementById('facturasBody').innerHTML = facturas.map(f=>`
        <tr>
          <td style="font-weight:600">${f.numeroFactura}</td>
          <td>${f.pedido?.cliente?.nombre} ${f.pedido?.cliente?.apellido}</td>
          <td>${fmt$(f.subtotal)}</td><td>${fmt$(f.iva)}</td>
          <td style="font-weight:700">${fmt$(f.total)}</td>
          <td>${f.pagos?.[0]?.formaPago?.tipo||'—'}</td>
          <td>${badgeEstado(f.estado)}</td>
          <td style="font-size:13px">${fmtDate(f.fechaEmision)}</td>
        </tr>
      `).join('');
    } catch(e) { ToastView.error(e.message); }
  },

  async loadVentas() {
    try {
      const { facturas, resumen } = await FacturasModel.getVentasDia();
      document.getElementById('vdTotal').textContent = fmt$(resumen.totalDia);
      document.getElementById('vdCant').textContent  = resumen.cantPedidos;
      document.getElementById('vdIva').textContent   = fmt$(resumen.totalIva);
      document.getElementById('ventasBody').innerHTML = facturas.length
        ? facturas.map(f=>`<tr><td style="font-weight:600">${f.numeroFactura}</td><td>${f.pedido?.cliente?.nombre} ${f.pedido?.cliente?.apellido}</td><td>${f.pedido?.tipoEntrega}</td><td>${fmt$(f.subtotal)}</td><td>${fmt$(f.iva)}</td><td style="font-weight:700">${fmt$(f.total)}</td><td>${f.pagos?.[0]?.formaPago?.tipo||'—'}</td><td>${badgeEstado(f.estado)}</td></tr>`).join('')
        : '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gris)">Sin ventas hoy</td></tr>';
    } catch(e) { ToastView.error(e.message); }
  },

  async loadPlatos() {
    try {
      const [platos, cats] = await Promise.all([PlatosModel.getAll(), PlatosModel.getCategorias()]);
      document.getElementById('platosBody').innerHTML = platos.map(p=>`
        <tr>
          <td style="font-weight:600">${p.nombre}</td>
          <td><span class="badge" style="background:var(--beige);color:var(--negro)">${p.categoria?.nombre}</span></td>
          <td style="font-weight:600">${fmt$(p.precio)}</td>
          <td>${p.stock}</td>
          <td>${p.disponible?'<span style="color:var(--verde)">✓</span>':'<span style="color:var(--rojo)">✗</span>'}</td>
          <td style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="AdminController.toggleDisp(${p.id},${!p.disponible},'${p.nombre}',${p.precio},${p.categoriaId})">${p.disponible?'Deshabilitar':'Habilitar'}</button>
          </td>
        </tr>
      `).join('');
      // Opciones en form
      const sel = document.getElementById('pCategoria');
      if (sel) sel.innerHTML = cats.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
    } catch(e) { ToastView.error(e.message); }
  },

  async loadClientes() {
    try {
      const clientes = await AdminModel.getClientes();
      document.getElementById('clientesBody').innerHTML = clientes.map(c=>`
        <tr>
          <td style="font-weight:600">${c.nombre} ${c.apellido}</td>
          <td>${c.usuario?.email||'—'}</td>
          <td>${c.telefono||'—'}</td>
          <td>${c.cedula||'—'}</td>
          <td><span class="badge badge-pagada">${c._count?.pedidos||0}</span></td>
          <td style="font-size:13px">${fmtDate(c.createdAt)}</td>
        </tr>
      `).join('');
    } catch(e) { ToastView.error(e.message); }
  },

  async cambiarEstado(id, estado) {
    try { await PedidosModel.updateEstado(id, estado); ToastView.success('Estado actualizado'); }
    catch(e) { ToastView.error(e.message); }
  },

  async toggleDisp(id, disp, nombre, precio, catId) {
    try { await PlatosModel.update(id, { disponible:disp, nombre, precio, categoriaId:catId }); ToastView.success('Plato actualizado'); await this.loadPlatos(); }
    catch(e) { ToastView.error(e.message); }
  },

  async guardarPlato() {
    const data = {
      categoriaId: document.getElementById('pCategoria').value,
      nombre:      document.getElementById('pNombre').value.trim(),
      descripcion: document.getElementById('pDesc').value.trim(),
      precio:      document.getElementById('pPrecio').value,
      stock:       document.getElementById('pStock').value||100,
      imagenUrl:   document.getElementById('pImagen').value.trim()||null
    };
    if (!data.nombre||!data.precio) { ToastView.error('Nombre y precio son requeridos'); return; }
    try {
      await PlatosModel.create(data);
      ToastView.success('Plato agregado');
      document.getElementById('platoModal').classList.remove('open');
      await this.loadPlatos();
    } catch(e) { ToastView.error(e.message); }
  }
};
