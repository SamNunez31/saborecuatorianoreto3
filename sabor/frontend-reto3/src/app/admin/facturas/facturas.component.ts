import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturasService } from '../../core/services/api.services';
import { Factura } from '../../core/models';

@Component({
  selector: 'app-facturas-admin',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @media print {
      body * { visibility: hidden; }
      #printable-invoice, #printable-invoice * { visibility: visible; }
      #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none !important; }
    }
  `],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4 no-print">
        <div><h1 style="font-family:var(--se-serif);font-size:1.8rem">Facturas</h1><p class="text-muted">Historial completo</p></div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>
      @if (loading()) { <div class="text-center py-5 no-print"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }
      <div class="table-sabor table-responsive rounded-4 border shadow-sm no-print">
        <table class="table table-hover mb-0">
          <thead><tr><th>N° Factura</th><th>Cliente</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Forma pago</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
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
                <td><button class="btn btn-sm btn-outline-dark" (click)="abrirModal(f)"><i class="bi bi-printer"></i> Imprimir</button></td>
              </tr>
            }
            @if (!loading() && facturas().length === 0) {
              <tr><td colspan="9" class="text-center py-5 text-muted">Sin facturas.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal de Factura -->
      @if (facturaModal()) {
        <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content" id="printable-invoice">
              <div class="modal-header border-0 no-print">
                <h5 class="modal-title fw-bold">Vista Previa de Factura</h5>
                <button type="button" class="btn-close" (click)="cerrarModal()"></button>
              </div>
              <div class="modal-body p-5">
                <div class="text-center mb-4">
                  <h2 style="font-family:var(--se-serif); font-weight:700;">Sabor Ecuatoriano</h2>
                  <p class="text-muted mb-0">RUC: 0991234567001</p>
                  <p class="text-muted mb-0">Guayaquil, Ecuador</p>
                </div>
                <div class="d-flex justify-content-between mb-4 pb-3 border-bottom">
                  <div>
                    <h5 class="fw-bold mb-1">FACTURA</h5>
                    <p class="mb-0 text-muted">N°: {{ facturaModal()?.numeroFactura }}</p>
                    <p class="mb-0 text-muted">Fecha: {{ facturaModal()?.fechaEmision | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                  <div class="text-end">
                    <h6 class="fw-bold mb-1">Cliente</h6>
                    <p class="mb-0">{{ facturaModal()?.pedido?.cliente?.nombre }} {{ facturaModal()?.pedido?.cliente?.apellido }}</p>
                    <p class="mb-0 text-muted">{{ facturaModal()?.pedido?.cliente?.cedula || 'Consumidor Final' }}</p>
                  </div>
                </div>
                
                <table class="table mb-4">
                  <thead class="table-light">
                    <tr>
                      <th>Cant.</th>
                      <th>Descripción</th>
                      <th class="text-end">V. Unit</th>
                      <th class="text-end">V. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (d of facturaModal()?.pedido?.detalles; track d.id) {
                      <tr>
                        <td>{{ d.cantidad }}</td>
                        <td>
                          {{ d.plato?.nombre }}
                          @if (d.detalleIngredientes && d.detalleIngredientes.length > 0) {
                            <div style="font-size: 11px; color: #666;">Sin: {{ obtenerNombresIngredientes(d) }}</div>
                          }
                        </td>
                        <td class="text-end">{{ d.precioUnitario | currency:'USD':'symbol':'1.2-2' }}</td>
                        <td class="text-end">{{ d.precioUnitario * d.cantidad | currency:'USD':'symbol':'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                
                <div class="row">
                  <div class="col-7">
                    <p class="text-muted" style="font-size:12px">
                      Forma de pago: <strong>{{ facturaModal()?.pagos?.[0]?.formaPago?.tipo || '—' }}</strong><br>
                      ¡Gracias por su compra!<br>
                      Este documento es una representación impresa de una factura.
                    </p>
                  </div>
                  <div class="col-5">
                    <div class="d-flex justify-content-between mb-1"><span>Subtotal:</span> <span>{{ facturaModal()?.subtotal | currency:'USD':'symbol':'1.2-2' }}</span></div>
                    <div class="d-flex justify-content-between mb-1"><span>IVA (15%):</span> <span>{{ facturaModal()?.iva | currency:'USD':'symbol':'1.2-2' }}</span></div>
                    <div class="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top"><span>Total:</span> <span>{{ facturaModal()?.total | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  </div>
                </div>
              </div>
              <div class="modal-footer no-print">
                <button type="button" class="btn btn-secondary" (click)="cerrarModal()">Cerrar</button>
                <button type="button" class="btn btn-dorado" (click)="imprimir()"><i class="bi bi-printer me-1"></i> Imprimir Factura</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class FacturasAdminComponent implements OnInit {
  private svc = inject(FacturasService);
  facturas = signal<Factura[]>([]);
  loading  = signal(true);
  facturaModal = signal<Factura | null>(null);

  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.svc.getAll().subscribe({ next: f => { this.facturas.set(f); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  
  abrirModal(f: Factura): void { this.facturaModal.set(f); }
  cerrarModal(): void { this.facturaModal.set(null); }
  
  imprimir(): void {
    window.print();
  }

  obtenerNombresIngredientes(d: any): string {
    return d.detalleIngredientes?.map((i: any) => i.ingrediente?.nombre).join(', ') || '';
  }
}
