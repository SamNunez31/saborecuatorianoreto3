import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { PedidosService, PagosService, TarjetasService, MesasService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Tarjeta, Mesa } from '../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main style="padding-top:80px;min-height:100vh;background:var(--se-crema)" id="main-content">
      <div class="container py-5">
        <div class="mb-3">
          <button class="btn btn-outline-secondary btn-sm" (click)="router.navigate(['/menu'])">
            ← Volver al menú
          </button>
        </div>
        <h1 style="font-family:var(--se-serif);font-size:1.8rem;margin-bottom:28px">Confirma tu pedido</h1>
        <div class="row g-4">
          <!-- Izquierda -->
          <div class="col-lg-8">
            <!-- Resumen -->
            <section class="card border-0 shadow-sm rounded-4 mb-3" aria-labelledby="resumen-title">
              <div class="card-header bg-white border-bottom rounded-top-4 py-3 px-4">
                <h2 id="resumen-title" class="m-0 fw-semibold" style="font-size:1rem">Resumen del pedido</h2>
              </div>
              <div class="card-body px-4">
                @for (i of cart.items(); track i.id) {
                  <div class="py-2 border-bottom" style="font-size:14px">
                    <div class="d-flex justify-content-between">
                      <span>{{ i.cantidad }}× {{ i.nombre }}</span>
                      <span class="fw-semibold">{{ i.precio * i.cantidad | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                    @if (i.ingredientesRemovidos?.length) {
                      <div class="text-muted mt-1" style="font-size:12px">
                        <i class="bi bi-dash-circle me-1"></i>Sin: ver personalización
                      </div>
                    }
                  </div>
                }
                <div class="d-flex justify-content-between mt-2" style="font-size:14px;color:var(--se-gris)"><span>Subtotal</span><span>{{ cart.subtotal() | currency:'USD':'symbol':'1.2-2' }}</span></div>
                <div class="d-flex justify-content-between" style="font-size:14px;color:var(--se-gris)"><span>IVA 15%</span><span>{{ cart.iva() | currency:'USD':'symbol':'1.2-2' }}</span></div>
                <div class="d-flex justify-content-between fw-bold mt-1" style="font-size:1.1rem"><span>Total</span><span>{{ cart.total() | currency:'USD':'symbol':'1.2-2' }}</span></div>
              </div>
            </section>

            <!-- Form -->
            <section class="card border-0 shadow-sm rounded-4" aria-labelledby="opciones-title">
              <div class="card-header bg-white border-bottom rounded-top-4 py-3 px-4">
                <h2 id="opciones-title" class="m-0 fw-semibold" style="font-size:1rem">Opciones de pedido</h2>
              </div>
              <div class="card-body px-4">
                <form [formGroup]="checkoutForm" novalidate>
                  <!-- Tipo de entrega -->
                  <fieldset class="mb-4">
                    <legend class="fw-semibold mb-3" style="font-size:14px">Tipo de entrega</legend>
                    <div class="row g-2">
                      @for (opt of entregaOpts; track opt.value) {
                        <div class="col-6">
                          <label class="d-flex align-items-center gap-2 p-3 border rounded-3 cursor-pointer"
                                 [class.border-warning]="checkoutForm.get('tipoEntrega')?.value === opt.value"
                                 style="cursor:pointer">
                            <input type="radio" formControlName="tipoEntrega" [value]="opt.value">
                            <span>{{ opt.icon }} <strong>{{ opt.label }}</strong></span>
                          </label>
                        </div>
                      }
                    </div>
                  </fieldset>

                  <!-- Selector de mesa (solo retiro) -->
                  @if (checkoutForm.get('tipoEntrega')?.value === 'retiro') {
                    <fieldset class="mb-4">
                      <legend class="fw-semibold mb-2" style="font-size:14px">Mesa (opcional)</legend>
                      @if (mesasLoading()) {
                        <p class="text-muted" style="font-size:13px">
                          <span class="spinner-border spinner-border-sm me-2"></span>Cargando mesas...
                        </p>
                      } @else if (mesasError()) {
                        <p class="text-muted" style="font-size:13px">No se pudieron cargar las mesas.</p>
                      } @else if (mesas().length) {
                        <select class="form-select" formControlName="mesaId">
                          <option [ngValue]="null">Sin mesa asignada</option>
                          @for (m of mesas(); track m.id) {
                            <option [ngValue]="m.id" [disabled]="m.estado !== 'disponible'">
                              Mesa {{ m.numero }} — {{ m.capacidad }} personas
                              {{ m.estado !== 'disponible' ? '(' + m.estado + ')' : '' }}
                            </option>
                          }
                        </select>
                      } @else {
                        <p class="text-muted" style="font-size:13px">No hay mesas configuradas aún.</p>
                      }
                    </fieldset>
                  }

                  <!-- Forma de pago -->
                  <fieldset class="mb-4">
                    <legend class="fw-semibold mb-3" style="font-size:14px">Forma de pago *</legend>
                    <div class="d-flex flex-column gap-2" role="radiogroup">
                      @for (fp of formasPago; track fp.id) {
                        <label class="d-flex align-items-center gap-3 p-3 border rounded-3"
                               [class.border-warning]="checkoutForm.get('formaPagoId')?.value === fp.id"
                               [style.background]="checkoutForm.get('formaPagoId')?.value === fp.id ? 'rgba(201,150,26,.05)' : ''"
                               style="cursor:pointer">
                          <input type="radio" formControlName="formaPagoId" [value]="fp.id">
                          <span>{{ fp.icon }} {{ fp.tipo }}</span>
                        </label>
                      }
                    </div>
                    @if (f['formaPagoId'].invalid && f['formaPagoId'].touched) {
                      <div class="text-danger mt-2" role="alert" style="font-size:13px">Selecciona una forma de pago.</div>
                    }
                  </fieldset>

                  <!-- Tarjetas si aplica -->
                  @if ([2,3].includes(checkoutForm.get('formaPagoId')?.value ?? 0)) {
                    <fieldset class="mb-4">
                      <legend class="fw-semibold mb-2" style="font-size:14px">Mis tarjetas</legend>
                      @if (tarjetas().length) {
                        @for (t of tarjetas(); track t.id) {
                          <label class="d-flex align-items-center gap-3 p-3 border rounded-3 mb-2"
                                 [class.border-warning]="checkoutForm.get('tarjetaId')?.value === t.id" style="cursor:pointer">
                            <input type="radio" formControlName="tarjetaId" [value]="t.id">
                            <div><div class="fw-semibold" style="font-size:14px">{{ t.marca }} {{ t.numeroMasked }}</div><div class="text-muted" style="font-size:12px">{{ t.titular }}</div></div>
                          </label>
                        }
                      } @else {
                        <p class="text-muted" style="font-size:13px">No tienes tarjetas guardadas. <a (click)="router.navigate(['/mi-cuenta'])" style="color:var(--se-dorado);cursor:pointer">Agregar</a></p>
                      }
                    </fieldset>
                  }

                  <!-- Observaciones -->
                  <div class="mb-3">
                    <label for="obs" class="form-label fw-semibold" style="font-size:13px">Observaciones</label>
                    <textarea id="obs" class="form-control" formControlName="observaciones" rows="2"
                              placeholder="Sin cebolla, extra picante..."></textarea>
                  </div>
                </form>
              </div>
            </section>
          </div>

          <!-- Lateral -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm rounded-4 sticky-top" style="top:90px">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between fw-bold mb-4" style="font-size:1.15rem">
                  <span>Total a pagar</span>
                  <span style="color:var(--se-dorado)">{{ cart.total() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <button class="btn btn-dorado w-100 py-3 fw-semibold" (click)="confirmar()" [disabled]="loading()">
                  @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> Procesando... }
                  @else { 🔒 Confirmar y pagar }
                </button>
                <p class="text-muted text-center mt-3" style="font-size:12px">Recibirás tu factura al instante.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `
})
export class CheckoutComponent implements OnInit {
  private fb          = inject(FormBuilder);
  cart                = inject(CartService);
  private pedidos     = inject(PedidosService);
  private pagos       = inject(PagosService);
  private tarjetasSvc = inject(TarjetasService);
  private mesasSvc    = inject(MesasService);
  private toast       = inject(ToastService);
  router              = inject(Router);

  loading      = signal(false);
  tarjetas_    = signal<Tarjeta[]>([]);
  mesas        = signal<Mesa[]>([]);
  mesasLoading = signal(true);
  mesasError   = signal(false);

  checkoutForm = this.fb.group({
    tipoEntrega:  ['retiro', Validators.required],
    formaPagoId:  [null as number | null, Validators.required],
    tarjetaId:    [null as number | null],
    mesaId:       [null as number | null],
    observaciones:['']
  });

  get f() { return this.checkoutForm.controls; }
  tarjetas = this.tarjetas_;

  formasPago = [
    { id:1, tipo:'Efectivo',            icon:'💵' },
    { id:2, tipo:'Tarjeta de crédito',  icon:'💳' },
    { id:3, tipo:'Tarjeta de débito',   icon:'💳' },
    { id:4, tipo:'Transferencia',       icon:'🏦' }
  ];
  entregaOpts = [
    { value:'retiro',    icon:'🏪', label:'Retiro en local' },
    { value:'domicilio', icon:'🛵', label:'A domicilio'     }
  ];

  ngOnInit(): void {
    if (!this.cart.count()) { this.router.navigate(['/menu']); return; }
    this.tarjetasSvc.getAll().subscribe({ next: t => this.tarjetas.set(t) });
    this.mesasSvc.getAll().subscribe({
      next:  m => { this.mesas.set(m); this.mesasLoading.set(false); },
      error: () => { this.mesasLoading.set(false); this.mesasError.set(true); }
    });
  }

  confirmar(): void {
    if (this.checkoutForm.invalid) { this.checkoutForm.markAllAsTouched(); return; }
    const fv = this.checkoutForm.value;
    if ([2,3].includes(fv.formaPagoId!) && !fv.tarjetaId) { this.toast.error('Selecciona una tarjeta'); return; }
    this.loading.set(true);
    const items = this.cart.items().map(i => ({
      platoId: i.id,
      cantidad: i.cantidad,
      ingredientesRemovidos: i.ingredientesRemovidos || []
    }));
    const mesaId = fv.tipoEntrega === 'retiro' && fv.mesaId ? fv.mesaId : null;
    this.pedidos.create({ items, tipoEntrega: fv.tipoEntrega as 'retiro'|'domicilio', observaciones: fv.observaciones || '', mesaId }).subscribe({
      next: ({ factura }) => {
        this.pagos.create({ facturaId: factura.id, formaPagoId: fv.formaPagoId!, tarjetaId: fv.tarjetaId ?? undefined, monto: factura.total }).subscribe({
          next: () => { this.cart.clear(); this.toast.success('¡Pedido confirmado!'); this.router.navigate(['/mis-pedidos']); },
          error: () => { this.cart.clear(); this.toast.info('Pedido creado, registra el pago.'); this.router.navigate(['/mis-pedidos']); }
        });
      },
      error: (e) => { this.toast.error(e.error?.error || 'Error al crear el pedido'); this.loading.set(false); }
    });
  }
}
