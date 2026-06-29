import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidosService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Pedido, EstadoPedido } from '../../core/models';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-pedidos-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div><h1 style="font-family:var(--se-serif);font-size:1.8rem">Pedidos</h1><p class="text-muted">Gestiona todos los pedidos</p></div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>

      @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }

      <div class="table-sabor table-responsive rounded-4 border shadow-sm">
        <table class="table table-hover align-middle mb-0" style="min-width:700px">
          <thead>
            <tr>
              <th scope="col" style="width:60px">ID</th>
              <th scope="col">Cliente</th>
              <th scope="col" style="width:70px" class="text-center">Tipo</th>
              <th scope="col">Platos</th>
              <th scope="col" style="width:90px">Total</th>
              <th scope="col" style="width:120px">Estado</th>
              <th scope="col" style="width:95px">Fecha</th>
              <th scope="col" style="width:160px">Cambiar estado</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            @for (p of pedidos(); track p.id) {
              <tr>
                <td class="fw-semibold text-muted" style="font-size:13px">#{{ p.id }}</td>
                <td style="font-size:13px">{{ p.cliente?.nombre }} {{ p.cliente?.apellido }}</td>
                <td class="text-center" style="font-size:20px" [attr.title]="p.tipoEntrega">{{ p.tipoEntrega === 'domicilio' ? '🛵' : '🏪' }}</td>
                <td>
                  <div style="font-size:12px; line-height:1.4; max-width:280px;">
                    @for (d of p.detalles; track d.id) {
                      <div class="mb-1 text-muted">
                        <span class="fw-medium text-dark">{{ d.cantidad }}x {{ d.plato?.nombre }}</span>
                        @if (d.detalleIngredientes && d.detalleIngredientes.length > 0) {
                          <div class="text-danger" style="font-size:11px">
                            <i class="bi bi-x-circle me-1" style="font-size:10px"></i>Sin: {{ obtenerNombresIngredientes(d) }}
                          </div>
                        }
                      </div>
                    }
                  </div>
                </td>
                <td class="fw-semibold" style="font-size:13px;white-space:nowrap">{{ p.factura?.total | currency:'USD':'symbol':'1.2-2' }}</td>
                <td><span class="badge" [ngClass]="'badge-' + p.estado">{{ estadoLabel(p.estado) }}</span></td>
                <td style="font-size:12px;white-space:nowrap;color:var(--se-gris)">{{ p.fechaPedido | date:'dd/MM HH:mm' }}</td>
                <td>
                  <select class="form-select form-select-sm" style="font-size:12px"
                          [value]="p.estado" (change)="cambiarEstado(p.id, $event)"
                          [disabled]="p.estado === 'listo' || p.estado === 'entregado' || p.estado === 'cancelado'"
                          [attr.aria-label]="'Estado del pedido #' + p.id">
                    @for (e of estados; track e.value) {
                      <option [value]="e.value" [selected]="p.estado === e.value">{{ e.label }}</option>
                    }
                  </select>
                </td>
              </tr>
            }
            @if (!loading() && pedidos().length === 0) {
              <tr><td colspan="8" class="text-center py-5 text-muted">No hay pedidos.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PedidosAdminComponent implements OnInit {
  private svc   = inject(PedidosService);
  private toast = inject(ToastService);
  private socketSvc = inject(SocketService);
  
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);

  constructor() {
    effect(() => {
      const nuevo = this.socketSvc.nuevoPedido();
      if (nuevo) {
        this.pedidos.update(list => {
          if (!list.find(p => p.id === nuevo.id)) {
            this.toast.success(`Nuevo pedido #${nuevo.id} recibido`);
            return [nuevo, ...list];
          }
          return list;
        });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const pUpdate = this.socketSvc.pedidoActualizado();
      if (pUpdate) {
        this.pedidos.update(list => list.map(p => p.id === pUpdate.id ? { ...p, estado: pUpdate.estado } : p));
      }
    }, { allowSignalWrites: true });
  }

  estados = [
    { value:'pendiente',       label:'Pendiente' },
    { value:'en_preparacion',  label:'En preparación' },
    { value:'listo',           label:'Listo' },
    { value:'entregado',       label:'Entregado' },
    { value:'cancelado',       label:'Cancelado' },
  ];

  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.svc.getAll().subscribe({ next: p => { this.pedidos.set(p); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  estadoLabel(e: string): string { return this.estados.find(x => x.value === e)?.label || e; }
  obtenerNombresIngredientes(d: any): string {
    return d.detalleIngredientes?.map((i: any) => i.ingrediente?.nombre).join(', ') || '';
  }
  cambiarEstado(id: number, e: Event): void {
    const estado = (e.target as HTMLSelectElement).value as EstadoPedido;
    this.svc.updateEstado(id, estado).subscribe({ next: () => this.toast.success('Estado actualizado'), error: () => this.toast.error('Error al actualizar') });
  }
}
