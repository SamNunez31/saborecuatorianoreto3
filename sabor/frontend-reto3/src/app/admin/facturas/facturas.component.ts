import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturasService } from '../../core/services/api.services';
import { Factura } from '../../core/models';

@Component({
  selector: 'app-facturas-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div><h1 style="font-family:var(--se-serif);font-size:1.8rem">Facturas</h1><p class="text-muted">Historial completo</p></div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>
      @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }
      <div class="table-sabor table-responsive rounded-4 border shadow-sm">
        <table class="table table-hover mb-0">
          <thead><tr><th>N° Factura</th><th>Cliente</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Forma pago</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody aria-live="polite">
            @for (f of facturas(); track f.id) {
              <tr>
                <td class="fw-semibold">{{ f.numeroFactura }}</td>
                <td>{{ f.pedido?.cliente?.nombre }} {{ f.pedido?.cliente?.apellido }}</td>
                <td>{{ f.subtotal | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>{{ f.iva | currency:'USD':'symbol':'1.2-2' }}</td>
                <td class="fw-bold">{{ f.total | currency:'USD':'symbol':'1.2-2' }}</td>
                <td style="font-size:13px">{{ f.pagos?.[0]?.formaPago?.tipo || '—' }}</td>
                <td><span class="badge" [ngClass]="'badge-' + f.estado">{{ f.estado }}</span></td>
                <td style="font-size:13px">{{ f.fechaEmision | date:'dd/MM/yyyy' }}</td>
              </tr>
            }
            @if (!loading() && facturas().length === 0) {
              <tr><td colspan="8" class="text-center py-5 text-muted">Sin facturas.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class FacturasAdminComponent implements OnInit {
  private svc = inject(FacturasService);
  facturas = signal<Factura[]>([]);
  loading  = signal(true);
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.svc.getAll().subscribe({ next: f => { this.facturas.set(f); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
