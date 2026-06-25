import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Plato, CategoriaPlato, CreatePlatoDto,
  Pedido, CreatePedidoDto,
  Factura, VentasDia,
  Pago, CreatePagoDto,
  Tarjeta, CreateTarjetaDto,
  Cliente, DashboardStats,
  Mesa, EstadoMesa
} from '../models';

const API = environment.apiUrl;

// ── PLATOS ───────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PlatosService {
  constructor(private http: HttpClient) {}
  getAll(categoriaId?: number): Observable<Plato[]> {
    const qs = categoriaId ? `?categoriaId=${categoriaId}` : '';
    return this.http.get<Plato[]>(`${API}/platos${qs}`);
  }
  getCategorias(): Observable<CategoriaPlato[]> { return this.http.get<CategoriaPlato[]>(`${API}/platos/categorias`); }
  getById(id: number): Observable<Plato>        { return this.http.get<Plato>(`${API}/platos/${id}`); }
  create(data: CreatePlatoDto): Observable<Plato>          { return this.http.post<Plato>(`${API}/platos`, data); }
  update(id: number, data: Partial<any>): Observable<Plato> { return this.http.put<Plato>(`${API}/platos/${id}`, data); }
  delete(id: number): Observable<{ message: string }>      { return this.http.delete<{ message: string }>(`${API}/platos/${id}`); }
}

// ── PEDIDOS ──────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PedidosService {
  constructor(private http: HttpClient) {}
  create(data: CreatePedidoDto): Observable<{ pedido: Pedido; factura: Factura }> { return this.http.post<{ pedido: Pedido; factura: Factura }>(`${API}/pedidos`, data); }
  getMisPedidos(): Observable<Pedido[]>  { return this.http.get<Pedido[]>(`${API}/pedidos/mis-pedidos`); }
  getAll(): Observable<Pedido[]>         { return this.http.get<Pedido[]>(`${API}/pedidos`); }
  updateEstado(id: number, estado: string): Observable<Pedido> { return this.http.put<Pedido>(`${API}/pedidos/${id}/estado`, { estado }); }
}

// ── FACTURAS ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FacturasService {
  constructor(private http: HttpClient) {}
  getAll(): Observable<Factura[]>         { return this.http.get<Factura[]>(`${API}/facturas`); }
  getById(id: number): Observable<Factura>{ return this.http.get<Factura>(`${API}/facturas/${id}`); }
  getVentasDia(): Observable<VentasDia>   { return this.http.get<VentasDia>(`${API}/facturas/ventas-dia`); }
}

// ── PAGOS ────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PagosService {
  constructor(private http: HttpClient) {}
  create(data: CreatePagoDto): Observable<Pago> { return this.http.post<Pago>(`${API}/pagos`, data); }
}

// ── TARJETAS ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TarjetasService {
  constructor(private http: HttpClient) {}
  getAll(): Observable<Tarjeta[]>                { return this.http.get<Tarjeta[]>(`${API}/tarjetas`); }
  create(data: CreateTarjetaDto): Observable<Tarjeta> { return this.http.post<Tarjeta>(`${API}/tarjetas`, data); }
  delete(id: number): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${API}/tarjetas/${id}`); }
  setPrincipal(id: number): Observable<Tarjeta>  { return this.http.put<Tarjeta>(`${API}/tarjetas/${id}/principal`, {}); }
}

// ── MESAS ────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MesasService {
  constructor(private http: HttpClient) {}
  getAll(): Observable<Mesa[]> { return this.http.get<Mesa[]>(`${API}/mesas`); }
  updateEstado(id: number, estado: EstadoMesa): Observable<Mesa> { return this.http.put<Mesa>(`${API}/mesas/${id}/estado`, { estado }); }
}

// ── ADMIN ────────────────────────────────────────────────
export interface Recomendacion { titulo: string; descripcion: string; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}
  getDashboard(): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${API}/admin/dashboard`); }
  getClientes(): Observable<Cliente[]>       { return this.http.get<Cliente[]>(`${API}/admin/clientes`); }
  getRecomendaciones(): Observable<{ recomendaciones: Recomendacion[] }> {
    return this.http.get<{ recomendaciones: Recomendacion[] }>(`${API}/admin/recomendaciones`);
  }
}
