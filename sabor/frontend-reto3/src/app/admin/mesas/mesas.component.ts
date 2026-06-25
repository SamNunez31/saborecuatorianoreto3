import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MesasService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Mesa, EstadoMesa } from '../../core/models';

@Component({
  selector: 'app-mesas-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 style="font-family:var(--se-serif);font-size:1.8rem">Mesas</h1>
          <p class="text-muted mb-0">Estado en tiempo real del salón</p>
        </div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>

      <!-- Leyenda -->
      <div class="d-flex gap-3 mb-4 flex-wrap">
        @for (s of estadosMeta; track s.valor) {
          <div class="d-flex align-items-center gap-2">
            <span class="rounded-circle d-inline-block" [style.background]="s.color" style="width:14px;height:14px"></span>
            <span style="font-size:13px;text-transform:capitalize">{{ s.label }}</span>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div>
      }

      @if (!loading()) {
        <div class="row g-4">
          @for (m of mesas(); track m.id) {
            <div class="col-sm-6 col-md-4 col-xl-3">
              <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden"
                   [style.border-top]="'4px solid ' + colorEstado(m.estado)">
                <div class="card-body p-4">
                  <!-- Número y capacidad -->
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div style="font-family:var(--se-serif);font-size:2rem;line-height:1;color:var(--se-negro)">
                        {{ m.numero }}
                      </div>
                      <div class="text-muted" style="font-size:12px">Mesa</div>
                    </div>
                    <span class="badge rounded-pill px-3 py-2"
                          [style.background]="colorEstado(m.estado)"
                          [style.color]="m.estado === 'reservada' ? '#7a5c00' : '#fff'"
                          style="font-size:11px;font-weight:500;text-transform:capitalize">
                      {{ m.estado }}
                    </span>
                  </div>

                  <div class="mb-3">
                    <div class="d-flex align-items-center gap-2 text-muted mb-1" style="font-size:13px">
                      <i class="bi bi-people"></i> {{ m.capacidad }} personas
                    </div>
                    @if (m.descripcion) {
                      <div class="text-muted" style="font-size:12px">{{ m.descripcion }}</div>
                    }
                    @if (m.pedidos?.length) {
                      <div class="mt-2 p-2 rounded-3" style="background:#fff3cd;font-size:12px">
                        <i class="bi bi-receipt me-1"></i>
                        Pedido activo: {{ m.pedidos![0].factura?.numeroFactura || '#' + m.pedidos![0].id }}
                      </div>
                    }
                  </div>

                  <!-- Botones de cambio de estado -->
                  <div class="d-flex gap-2 flex-wrap mt-auto">
                    @for (s of estadosMeta; track s.valor) {
                      @if (s.valor !== m.estado) {
                        <button class="btn btn-sm rounded-3 px-2 py-1"
                                [style.background]="s.colorLight"
                                [style.color]="s.colorDark"
                                [style.border]="'1px solid ' + s.color"
                                (click)="cambiarEstado(m, s.valor)"
                                style="font-size:12px">
                          {{ s.label }}
                        </button>
                      }
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          @if (!mesas().length) {
            <div class="col-12 text-center py-5 text-muted">
              <p style="font-size:40px">🪑</p>
              <p>No hay mesas configuradas.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class MesasAdminComponent implements OnInit {
  private svc   = inject(MesasService);
  private toast = inject(ToastService);

  mesas   = signal<Mesa[]>([]);
  loading = signal(true);

  readonly estadosMeta: { valor: EstadoMesa; label: string; color: string; colorLight: string; colorDark: string }[] = [
    { valor: 'disponible', label: 'Disponible', color: '#16a34a', colorLight: '#dcfce7', colorDark: '#14532d' },
    { valor: 'ocupada',    label: 'Ocupada',    color: '#dc2626', colorLight: '#fee2e2', colorDark: '#7f1d1d' },
    { valor: 'reservada',  label: 'Reservada',  color: '#d97706', colorLight: '#fef9c3', colorDark: '#78350f' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: m => { this.mesas.set(m); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  colorEstado(estado: string): string {
    return this.estadosMeta.find(s => s.valor === estado)?.color ?? '#6b7280';
  }

  cambiarEstado(mesa: Mesa, estado: EstadoMesa): void {
    this.svc.updateEstado(mesa.id, estado).subscribe({
      next: updated => {
        this.mesas.update(list => list.map(m => m.id === updated.id ? { ...m, estado: updated.estado } : m));
        this.toast.success(`Mesa ${mesa.numero}: ${estado}`);
      },
      error: () => this.toast.error('Error al actualizar estado')
    });
  }
}
