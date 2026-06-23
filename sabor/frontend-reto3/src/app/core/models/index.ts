// ── AUTENTICACIÓN ────────────────────────────────────────
export interface LoginRequest   { email: string; password: string; }
export interface RegisterRequest { nombre: string; apellido: string; email: string; password: string; telefono?: string; direccion?: string; }
export interface AuthResponse   { token: string; usuario: Usuario; }
export interface Usuario        { id: number; nombre: string; email: string; rol: string; }

// ── CATÁLOGO ─────────────────────────────────────────────
export interface CategoriaPlato { id: number; nombre: string; }
export interface Plato          { id: number; nombre: string; descripcion?: string; precio: number; disponible: boolean; imagenUrl?: string; categoriaId: number; categoria?: CategoriaPlato; createdAt?: string; }
export interface CreatePlatoDto { nombre: string; descripcion?: string; precio: number; categoriaId: number; imagenUrl?: string; }

// ── PEDIDOS ──────────────────────────────────────────────
export type EstadoPedido = 'pendiente'|'en_preparacion'|'listo'|'entregado'|'cancelado';
export type TipoEntrega  = 'retiro'|'domicilio';
export interface ItemPedido      { platoId: number; cantidad: number; nota?: string; }
export interface CreatePedidoDto { items: ItemPedido[]; tipoEntrega: TipoEntrega; observaciones?: string; }
export interface DetallePedido   { id: number; cantidad: number; precioUnitario: number; nota?: string; plato?: Plato; }
export interface Pedido          { id: number; clienteId: number; tipoEntrega: TipoEntrega; estado: EstadoPedido; observaciones?: string; fechaPedido: string; total: number; cliente?: Cliente; detalles: DetallePedido[]; factura?: Factura; }

// ── FACTURAS / PAGOS ─────────────────────────────────────
export type EstadoFactura = 'emitida'|'pagada'|'anulada';
export interface FormaPago  { id: number; tipo: string; }
export interface Factura    { id: number; pedidoId: number; numeroFactura: string; fechaEmision: string; subtotal: number; iva: number; total: number; estado: EstadoFactura; pedido?: Pedido; pagos?: Pago[]; }
export interface Pago       { id: number; facturaId: number; formaPagoId: number; tarjetaId?: number; monto: number; fechaPago: string; estado: string; formaPago?: FormaPago; tarjeta?: Tarjeta; }
export interface CreatePagoDto { facturaId: number; formaPagoId: number; tarjetaId?: number; monto: number; }

// ── TARJETAS ─────────────────────────────────────────────
export interface Tarjeta       { id: number; clienteId: number; titular: string; numeroMasked: string; marca: string; mesExp: string; anioExp: string; esPrincipal: boolean; createdAt: string; }
export interface CreateTarjetaDto { titular: string; numero: string; marca: string; mesExp: string; anioExp: string; }

// ── CLIENTES ─────────────────────────────────────────────
export interface Cliente { id: number; nombre: string; apellido: string; telefono?: string; cedula?: string; direccion?: string; createdAt: string; usuario?: Usuario; _count?: { pedidos: number }; }

// ── DASHBOARD ────────────────────────────────────────────
export interface DashboardStats { ventasHoy: number; pedidosHoy: number; pedidosPendientes: number; totalClientes: number; totalPlatos: number; }
export interface VentasDia      { facturas: Factura[]; resumen: { totalDia: number; totalIva: number; cantPedidos: number }; }

// ── CARRITO ──────────────────────────────────────────────
export interface CartItem { id: number; nombre: string; precio: number; cantidad: number; }
