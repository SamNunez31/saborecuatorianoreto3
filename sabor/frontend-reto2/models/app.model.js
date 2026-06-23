/**
 * MODELO — lógica de datos del lado del cliente
 * Consume la API REST y gestiona el estado de sesión
 * Patrón MVC: Model layer
 */

const API_URL = 'https://saborecuatorianoreto3.onrender.com/api';

// ─── AUTH MODEL ───────────────────────────────────────────
const AuthModel = {
  getToken:  () => localStorage.getItem('token'),
  getUser:   () => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } },
  isLogged:  () => !!AuthModel.getToken(),
  isAdmin:   () => { const u = AuthModel.getUser(); return !!u && ['admin','cajero'].includes(u.rol); },

  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Cookie de sesión (Reto 2: uso de cookies)
    document.cookie = `sesionActiva=1; path=/; max-age=${7*86400}; SameSite=Lax`;
    document.cookie = `ultimoRol=${user.rol}; path=/; max-age=${7*86400}; SameSite=Lax`;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    document.cookie = 'sesionActiva=; path=/; max-age=0';
    document.cookie = 'ultimoRol=; path=/; max-age=0';
    window.location.href = 'login.html';
  }
};

// ─── FETCH HELPER ─────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = AuthModel.getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ─── CARRITO MODEL ────────────────────────────────────────
const CartModel = {
  KEY: 'carrito_sabor',

  get() { try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; } },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    // También en sessionStorage para la sesión actual
    sessionStorage.setItem('carritoCount', items.reduce((s,i)=>s+i.cantidad,0));
    document.cookie = `carritoActivo=${items.length>0?'1':'0'}; path=/; max-age=86400; SameSite=Lax`;
  },

  add(plato) {
    const items = this.get();
    const found = items.find(i => i.id === plato.id);
    if (found) found.cantidad++;
    else items.push({ id:plato.id, nombre:plato.nombre, precio:Number(plato.precio), cantidad:1 });
    this.save(items);
  },

  inc(id) { const items = this.get(); const f = items.find(i=>i.id===id); if(f){ f.cantidad++; this.save(items); } },

  dec(id) {
    let items = this.get();
    const f = items.find(i=>i.id===id);
    if (f) { f.cantidad > 1 ? f.cantidad-- : (items = items.filter(i=>i.id!==id)); }
    this.save(items);
  },

  remove(id) { this.save(this.get().filter(i=>i.id!==id)); },
  clear()    { this.save([]); },

  total()    { return this.get().reduce((s,i)=>s+i.precio*i.cantidad, 0); },
  iva()      { return this.total() * 0.15; },
  grandTotal(){ return this.total() + this.iva(); },
  count()    { return this.get().reduce((s,i)=>s+i.cantidad, 0); }
};

// ─── PLATOS MODEL ─────────────────────────────────────────
const PlatosModel = {
  async getAll(categoriaId = null) {
    const qs = categoriaId ? `?categoriaId=${categoriaId}` : '';
    return apiFetch(`/platos${qs}`);
  },
  async getCategorias() { return apiFetch('/platos/categorias'); },
  async getById(id)     { return apiFetch(`/platos/${id}`); },
  async create(data)    { return apiFetch('/platos', { method:'POST', body:JSON.stringify(data) }); },
  async update(id, data){ return apiFetch(`/platos/${id}`, { method:'PUT', body:JSON.stringify(data) }); },
  async delete(id)      { return apiFetch(`/platos/${id}`, { method:'DELETE' }); }
};

// ─── PEDIDOS MODEL ────────────────────────────────────────
const PedidosModel = {
  async create(data)    { return apiFetch('/pedidos', { method:'POST', body:JSON.stringify(data) }); },
  async getMios()       { return apiFetch('/pedidos/mis-pedidos'); },
  async getAll()        { return apiFetch('/pedidos'); },
  async updateEstado(id, estado) { return apiFetch(`/pedidos/${id}/estado`, { method:'PUT', body:JSON.stringify({ estado }) }); }
};

// ─── FACTURAS MODEL ───────────────────────────────────────
const FacturasModel = {
  async getAll()        { return apiFetch('/facturas'); },
  async getVentasDia()  { return apiFetch('/facturas/ventas-dia'); },
  async getById(id)     { return apiFetch(`/facturas/${id}`); }
};

// ─── TARJETAS MODEL ───────────────────────────────────────
const TarjetasModel = {
  async getAll()             { return apiFetch('/tarjetas'); },
  async create(data)         { return apiFetch('/tarjetas', { method:'POST', body:JSON.stringify(data) }); },
  async delete(id)           { return apiFetch(`/tarjetas/${id}`, { method:'DELETE' }); },
  async setPrincipal(id)     { return apiFetch(`/tarjetas/${id}/principal`, { method:'PUT' }); }
};

// ─── ADMIN MODEL ──────────────────────────────────────────
const AdminModel = {
  async getDashboard()  { return apiFetch('/admin/dashboard'); },
  async getClientes()   { return apiFetch('/admin/clientes'); }
};

// ─── UTILS ────────────────────────────────────────────────
const fmt$    = n => `$${Number(n).toFixed(2)}`;
const fmtDate = s => new Date(s).toLocaleDateString('es-EC',{ day:'2-digit', month:'short', year:'numeric' });
const fmtDT   = s => new Date(s).toLocaleString('es-EC',{ day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

function getCookie(name) {
  const c = document.cookie.split('; ').find(r=>r.startsWith(name+'='));
  return c ? decodeURIComponent(c.split('=')[1]) : null;
}
