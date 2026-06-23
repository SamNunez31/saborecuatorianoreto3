import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturasService } from '../../core/services/api.services';
import { VentasDia } from '../../core/models';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div><h1 style="font-family:var(--se-serif);font-size:1.8rem">Ventas del día</h1><p class="text-muted">{{ hoy }}</p></div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>
      @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }
      @if (data()) {
        <div class="row g-3 mb-4" role="list">
          <div class="col-4" role="listitem"><div class="stat-card"><div class="stat-label">Total recaudado</div><div class="stat-value gold">{{ data()!.resumen.totalDia | currency:'USD':'symbol':'1.2-2' }}</div></div></div>
          <div class="col-4" role="listitem"><div class="stat-card"><div class="stat-label">Pedidos facturados</div><div class="stat-value">{{ data()!.resumen.cantPedidos }}</div></div></div>
          <div class="col-4" role="listitem"><div class="stat-card"><div class="stat-label">IVA generado</div><div class="stat-value">{{ data()!.resumen.totalIva | currency:'USD':'symbol':'1.2-2' }}</div></div></div>
        </div>
        <div class="table-sabor table-responsive rounded-4 border shadow-sm">
          <table class="table table-hover mb-0">
            <thead><tr><th>Factura</th><th>Cliente</th><th>Entrega</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead>
            <tbody>
              @for (f of data()!.facturas; track f.id) {
                <tr>
                  <td class="fw-semibold">{{ f.numeroFactura }}</td>
                  <td>{{ f.pedido?.cliente?.nombre }} {{ f.pedido?.cliente?.apellido }}</td>
                  <td>{{ f.pedido?.tipoEntrega }}</td>
                  <td>{{ f.subtotal | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td>{{ f.iva | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="fw-bold">{{ f.total | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td style="font-size:13px">{{ f.pagos?.[0]?.formaPago?.tipo || '—' }}</td>
                  <td><span class="badge" [ngClass]="'badge-' + f.estado">{{ f.estado }}</span></td>
                </tr>
              }
              @if (data()!.facturas.length === 0) {
                <tr><td colspan="8" class="text-center py-5 text-muted">Sin ventas hoy.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class VentasComponent implements OnInit {
  private svc = inject(FacturasService);
  data    = signal<VentasDia | null>(null);
  loading = signal(true);
  hoy = new Date().toLocaleDateString('es-EC', { day:'numeric', month:'long', year:'numeric' });
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.svc.getVentasDia().subscribe({ next: d => { this.data.set(d); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
