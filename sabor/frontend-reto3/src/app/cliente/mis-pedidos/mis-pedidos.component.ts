import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidosService, FacturasService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Pedido, Factura } from '../../core/models';
import { MapComponent } from '../../shared/map/map.component';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, MapComponent],
  template: `
    <main style="padding-top:80px;min-height:100vh;background:var(--bg-color)">
      <div class="container py-5" style="max-width:800px">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div><span class="eyebrow d-block mb-1">Tu historial</span><h1 style="font-family:var(--se-serif);font-size:1.8rem">Mis pedidos</h1></div>
          <a routerLink="/menu" class="btn btn-dorado btn-sm">+ Nuevo pedido</a>
        </div>

        @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }

        @if (!loading() && pedidos().length === 0) {
          <div class="text-center py-5">
            <div style="font-size:60px">📦</div>
            <h3 class="mt-3" style="font-family:var(--se-serif)">Aún no tienes pedidos</h3>
            <p class="text-muted">Explora el menú y haz tu primer pedido.</p>
            <a routerLink="/menu" class="btn btn-dorado mt-3">Ver menú</a>
          </div>
        }

        <div role="feed" aria-label="Lista de pedidos">
          @for (p of pedidos(); track p.id) {
            <article class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden"
                     [attr.aria-label]="'Pedido ' + (p.factura?.numeroFactura || '#' + p.id)">

              <!-- HEADER -->
              <div class="card-header border-0 d-flex justify-content-between align-items-center py-3 px-4" style="background:var(--card-bg)">
                <div>
                  <span class="fw-bold">{{ p.factura?.numeroFactura || '#' + p.id }}</span>
                  <span class="text-muted ms-2" style="font-size:13px">{{ p.fechaPedido | date:'dd MMM yyyy HH:mm' }}</span>
                  <span class="ms-2">{{ p.tipoEntrega === 'domicilio' ? '🛵' : '🏪' }}</span>
                </div>
                <div class="d-flex gap-2 align-items-center flex-wrap">
                  <span class="badge" [ngClass]="'badge-' + p.estado">{{ estadoLabel(p.estado) }}</span>
                  @if (p.factura) {
                    <button class="btn btn-outline-secondary btn-sm" (click)="verFactura(p.factura!.id)"
                            [attr.aria-label]="'Ver factura ' + p.factura.numeroFactura">Ver factura</button>
                  }
                  @if (p.estado === 'pendiente') {
                    <button class="btn btn-outline-danger btn-sm" (click)="abrirCancelarModal(p)"
                            [attr.aria-label]="'Cancelar pedido #' + p.id">Cancelar pedido</button>
                  }
                </div>
              </div>

              <!-- STEPPER DE PROGRESO -->
              @if (p.estado === 'cancelado') {
                <div class="px-4 py-3 d-flex align-items-center gap-2"
                     style="background:#fef2f2;border-bottom:1px solid #fecaca">
                  <i class="bi bi-x-circle-fill" style="color:#dc2626;font-size:18px"></i>
                  <span style="color:#dc2626;font-weight:600;font-size:14px">Pedido cancelado</span>
                </div>
              } @else {
                <div class="px-4 py-3" style="border-bottom:1px solid #f0e8d8">
                  <div class="d-flex align-items-start">
                    @for (paso of getPasos(p.tipoEntrega); track paso.key; let i = $index, last = $last) {
                      <div class="d-flex flex-column align-items-center" style="flex:0 0 auto;min-width:56px">
                        <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;transition:.3s"
                             [style.background]="pasoBg(i, pasoActual(p.estado, p.tipoEntrega))"
                             [style.color]="pasoTextColor(i, pasoActual(p.estado, p.tipoEntrega))">
                          @if (i < pasoActual(p.estado, p.tipoEntrega)) { <i class="bi bi-check-lg"></i> }
                          @else { {{ i + 1 }} }
                        </div>
                        <div class="text-center mt-1" style="font-size:10px;line-height:1.3;max-width:56px"
                             [style.color]="i <= pasoActual(p.estado, p.tipoEntrega) ? 'var(--text-color)' : 'var(--se-gris)'">
                          {{ paso.label }}
                        </div>
                      </div>
                      @if (!last) {
                        <div style="flex:1;height:2px;margin-top:14px;transition:.3s;min-width:8px"
                             [style.background]="lineaBg(i, pasoActual(p.estado, p.tipoEntrega))"></div>
                      }
                    }
                  </div>
                  @if (p.tipoEntrega === 'retiro' && p.estado === 'listo') {
                    <div class="mt-2 d-flex align-items-center gap-2" style="font-size:12px;color:var(--se-gris)">
                      <span>✅</span>
                      <strong style="color:#16a34a">¡Tu pedido está listo para retiro!</strong>
                    </div>
                  }
                </div>
              }

              <!-- HORA ESTIMADA -->
              @if (p.estado !== 'cancelado' && p.estado !== 'entregado') {
                <div class="px-4 py-2" style="font-size:13px;color:var(--se-gris)">
                  <i class="bi bi-clock me-1"></i>
                  Hora estimada de {{ p.tipoEntrega === 'domicilio' ? 'entrega' : 'retiro' }}:
                  <strong>{{ horaEstimada(p) }}</strong>
                </div>
              }

              <!-- ITEMS -->
              <div class="card-body px-4 pb-3">
                @for (d of p.detalles; track d.id) {
                  <div class="d-flex justify-content-between" style="font-size:14px;padding:4px 0;border-bottom:1px solid #f5f0e8">
                    <span>{{ d.cantidad }}× {{ d.plato?.nombre }}</span>
                    <span>{{ d.precioUnitario * d.cantidad | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                }
              </div>

              <!-- TOTALES -->
              @if (p.factura) {
                <div class="card-footer border-0 d-flex justify-content-between px-4 py-3" style="font-size:14px;background:var(--card-bg)">
                  <div class="text-muted">
                    <span>Subtotal: {{ p.factura.subtotal | currency:'USD':'symbol':'1.2-2' }}</span>
                    <span class="ms-3">IVA: {{ p.factura.iva | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                  <span class="fw-bold">Total: {{ p.factura.total | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              }

              <!-- MAPA (solo domicilio) -->
              @if (p.tipoEntrega === 'domicilio') {
                <div>
                  <div class="px-4 pt-2 pb-1" style="font-size:12px;color:var(--se-gris);background:var(--card-bg)">
                    <i class="bi bi-geo-alt-fill me-1" style="color:var(--se-dorado)"></i>
                    {{ p.cliente?.direccion || 'Quito, Ecuador' }}
                  </div>
                  <app-map [address]="p.cliente?.direccion || ''" />
                </div>
              }

            </article>
          }
        </div>
      </div>
    </main>

    <!-- MODAL FACTURA -->
    @if (facturaModal()) {
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modalTitle"
           style="background:rgba(0,0,0,.5)" (click)="facturaModal.set(null)">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content rounded-4 border-0">
            <div class="modal-header border-0 pb-0">
              <h5 id="modalTitle" class="modal-title fw-bold" style="font-family:var(--se-serif)">Factura {{ facturaModal()?.numeroFactura }}</h5>
              <button type="button" class="btn-close" (click)="facturaModal.set(null)" aria-label="Cerrar factura"></button>
            </div>
            <div class="modal-body px-4">
              <div class="d-flex justify-content-between mb-3">
                <div><strong style="font-family:var(--se-serif)">Sabor Ecuatoriano</strong><div class="text-muted" style="font-size:12px">RUC 1234567890001</div></div>
                <div class="text-end"><div class="fw-bold">{{ facturaModal()?.numeroFactura }}</div><div class="text-muted" style="font-size:12px">{{ facturaModal()?.fechaEmision | date:'dd/MM/yyyy' }}</div></div>
              </div>
              <div class="rounded-3 px-3 py-2 mb-3" style="background:var(--bg-color);font-size:13px; border:1px solid var(--border-color)">
                <div class="fw-semibold mb-1" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888">Cliente</div>
                <div class="fw-semibold">{{ facturaModal()?.pedido?.cliente?.nombre }} {{ facturaModal()?.pedido?.cliente?.apellido }}</div>
                <div class="text-muted" style="font-size:13px">{{ facturaModal()?.pedido?.cliente?.cedula || 'Consumidor Final' }}</div>
              </div>
              @for (d of facturaModal()?.pedido?.detalles; track d?.id) {
                <div class="d-flex justify-content-between border-bottom py-1" style="font-size:14px">
                  <span>{{ d?.cantidad }}× {{ d?.plato?.nombre }}</span>
                  <span>{{ (d?.precioUnitario || 0) * (d?.cantidad || 0) | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              }
              <div class="mt-3 pt-2 border-top">
                <div class="d-flex justify-content-between text-muted mb-1" style="font-size:14px"><span>Subtotal</span><span>{{ facturaModal()?.subtotal | currency:'USD':'symbol':'1.2-2' }}</span></div>
                <div class="d-flex justify-content-between text-muted mb-2" style="font-size:14px"><span>IVA 15%</span><span>{{ facturaModal()?.iva | currency:'USD':'symbol':'1.2-2' }}</span></div>
                <div class="d-flex justify-content-between fw-bold" style="font-size:1.1rem"><span>TOTAL</span><span>{{ facturaModal()?.total | currency:'USD':'symbol':'1.2-2' }}</span></div>
              </div>
              <div class="rounded-3 px-3 py-2 mt-3" style="background:var(--bg-color);font-size:13px; border:1px solid var(--border-color)">
                <div class="fw-semibold mb-2" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888">Detalles de entrega y pago</div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Tipo de entrega</span>
                  <span class="fw-semibold">{{ facturaModal()?.pedido?.tipoEntrega === 'domicilio' ? '🛵 Domicilio' : '🏪 Retiro en local' }}</span>
                </div>
                @if (facturaModal()?.pedido?.tipoEntrega === 'domicilio') {
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted">Dirección</span>
                    <span class="fw-semibold text-end" style="max-width:60%">{{ facturaModal()?.pedido?.cliente?.direccion || 'No registrada' }}</span>
                  </div>
                }
                @for (pago of facturaModal()?.pagos; track pago?.id) {
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted">Forma de pago</span>
                    <span class="fw-semibold">
                      {{ pago?.formaPago?.tipo }}
                      @if (pago?.tarjeta) { · {{ pago.tarjeta!.marca }} {{ pago.tarjeta!.numeroMasked }} }
                    </span>
                  </div>
                }
              </div>
              <div class="text-center mt-3"><span class="badge" [ngClass]="'badge-' + facturaModal()?.estado">{{ facturaModal()?.estado }}</span></div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL CONFIRMAR CANCELACIÓN -->
    @if (pedidoACancelar()) {
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modalCancelTitle"
           style="background:rgba(0,0,0,.5)" (click)="cancelarCancelacion()">
        <div class="modal-dialog modal-dialog-centered modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-content rounded-4 border-0 shadow-lg">
            <div class="modal-header border-0 pb-0">
              <h5 id="modalCancelTitle" class="modal-title fw-bold" style="font-family:var(--se-serif)">¿Cancelar pedido?</h5>
              <button type="button" class="btn-close" (click)="cancelarCancelacion()" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body px-4">
              <p class="text-muted mb-0" style="font-size:14px">
                ¿Seguro que deseas cancelar el pedido
                <strong>{{ pedidoACancelar()?.factura?.numeroFactura || '#' + pedidoACancelar()?.id }}</strong>?
                Esta acción no se puede revertir.
              </p>
            </div>
            <div class="modal-footer border-0 pt-2 gap-2">
              <button type="button" class="btn btn-outline-secondary" (click)="cancelarCancelacion()">No, mantener</button>
              <button type="button" class="btn btn-danger" (click)="confirmarCancelacion()">Sí, cancelar</button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class MisPedidosComponent implements OnInit {
  private svc      = inject(PedidosService);
  private factSvc  = inject(FacturasService);
  private toast    = inject(ToastService);
  private socketSvc = inject(SocketService);

  pedidos          = signal<Pedido[]>([]);
  loading          = signal(true);
  facturaModal     = signal<Factura | null>(null);
  pedidoACancelar  = signal<Pedido | null>(null);

  constructor() {
    effect(() => {
      const pUpdate = this.socketSvc.pedidoActualizado();
      if (pUpdate) {
        // Actualizar el estado si el pedido existe en la lista
        this.pedidos.update(list => list.map(p => p.id === pUpdate.id ? { ...p, estado: pUpdate.estado } : p));
      }
    }, { allowSignalWrites: true });
  }

  getPasos(tipoEntrega: string) {
    if (tipoEntrega === 'domicilio') {
      return [
        { key: 'pendiente',      label: 'Pendiente' },
        { key: 'en_preparacion', label: 'En preparación' },
        { key: 'listo',          label: 'En camino' },
        { key: 'entregado',      label: 'Entregado' },
      ];
    } else {
      return [
        { key: 'pendiente',      label: 'Pendiente' },
        { key: 'en_preparacion', label: 'En preparación' },
        { key: 'listo',          label: 'Listo para retiro' },
      ];
    }
  }

  horaEstimada(p: any): string {
    const fecha = new Date(p.fechaPedido);
    const minutos = p.tipoEntrega === 'domicilio' ? 45 : 20;
    fecha.setMinutes(fecha.getMinutes() + minutos);
    return fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getMisPedidos().subscribe({
      next: p => { this.pedidos.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }



  verFactura(id: number): void {
    this.factSvc.getById(id).subscribe({ next: f => this.facturaModal.set(f), error: () => this.toast.error('No se pudo cargar la factura') });
  }

  abrirCancelarModal(p: Pedido): void { this.pedidoACancelar.set(p); }
  cancelarCancelacion(): void { this.pedidoACancelar.set(null); }

  confirmarCancelacion(): void {
    const p = this.pedidoACancelar();
    if (!p) return;
    this.svc.updateEstado(p.id, 'cancelado').subscribe({
      next: () => {
        this.toast.success('Pedido cancelado');
        this.cancelarCancelacion();
        this.load();
      },
      error: (e) => { this.toast.error(e.error?.error || 'No se pudo cancelar el pedido'); this.cancelarCancelacion(); }
    });
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = { pendiente: 'Pendiente', en_preparacion: 'En preparación', listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado' };
    return m[e] || e;
  }

  pasoActual(estado: string, tipoEntrega: string): number {
    return this.getPasos(tipoEntrega).findIndex(p => p.key === estado);
  }

  pasoBg(i: number, actual: number): string {
    if (i < actual) return '#16a34a';
    if (i === actual) return '#c9961a';
    return '#e5e7eb';
  }

  pasoTextColor(i: number, actual: number): string {
    if (i < actual) return '#fff';
    if (i === actual) return '#1a1a1a';
    return '#9ca3af';
  }

  lineaBg(i: number, actual: number): string {
    return i < actual ? '#16a34a' : '#e5e7eb';
  }
}
