import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Overlay -->
    <div class="offcanvas-backdrop fade" [class.show]="open" style="z-index:1045"
         (click)="closed.emit()" [style.display]="open?'block':'none'"></div>

    <!-- Drawer -->
    <aside class="offcanvas offcanvas-end offcanvas-sabor" [class.show]="open" tabindex="-1"
           role="dialog" aria-modal="true" aria-label="Carrito de compras"
           style="width:420px;max-width:95vw;z-index:1046;visibility:visible">
      <div class="offcanvas-header">
        <h3 class="offcanvas-title fs-6 fw-bold">Tu pedido</h3>
        <button type="button" class="btn-close" (click)="closed.emit()" aria-label="Cerrar carrito"></button>
      </div>

      <div class="offcanvas-body p-0 d-flex flex-column">
        <!-- Items -->
        <div class="flex-grow-1 overflow-auto p-3" role="list">
          @if (cart.items().length === 0) {
            <div class="text-center py-5 text-muted" role="status">
              <div style="font-size:48px">🛒</div>
              <p class="mt-3">Tu carrito está vacío</p>
            </div>
          }
          @for (item of cart.items(); track (item.customKey || item.id)) {
            <div class="cart-item-row" role="listitem" [attr.aria-label]="item.nombre">
              <div class="flex-grow-1 me-2">
                <div class="fw-semibold" style="font-size:14px">{{ item.nombre }}</div>
                <div class="text-muted" style="font-size:13px">{{ item.precio | currency:'USD':'symbol':'1.2-2' }} c/u</div>
                @if (item.ingredientesRemovidos?.length) {
                  <div class="text-muted mt-1" style="font-size:11px">
                    Sin: {{ item.nombresRemovidos?.join(', ') || 'personalización' }}
                  </div>
                }
              </div>
              <div class="d-flex align-items-center gap-2" [attr.aria-label]="'Cantidad de ' + item.nombre">
                <button class="btn btn-outline-secondary btn-sm rounded-circle px-2 py-0"
                        (click)="cart.dec(item.customKey || item.id.toString())" [attr.aria-label]="'Disminuir cantidad de ' + item.nombre" style="width:28px;height:28px;line-height:1">−</button>
                <span aria-live="polite" style="min-width:20px;text-align:center">{{ item.cantidad }}</span>
                <button class="btn btn-outline-secondary btn-sm rounded-circle px-2 py-0"
                        (click)="cart.inc(item.customKey || item.id.toString())" [attr.aria-label]="'Aumentar cantidad de ' + item.nombre" style="width:28px;height:28px;line-height:1">+</button>
              </div>
              <span class="fw-semibold ms-2" style="min-width:60px;text-align:right;font-size:14px">
                {{ item.precio * item.cantidad | currency:'USD':'symbol':'1.2-2' }}
              </span>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="border-top p-3" style="background:var(--card-bg)">
          <div class="d-flex justify-content-between mb-1" style="font-size:14px">
            <span>Subtotal</span><span>{{ cart.subtotal() | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2" style="font-size:14px">
            <span>IVA 15%</span><span>{{ cart.iva() | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <div class="d-flex justify-content-between fw-bold mb-3">
            <span>Total</span><span>{{ cart.total() | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <button class="btn btn-dorado w-100 fw-semibold" (click)="goCheckout()" [disabled]="cart.count() === 0">
            Confirmar pedido
          </button>
        </div>
      </div>
    </aside>
  `
})
export class CarritoComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  cart  = inject(CartService);
  auth  = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  goCheckout(): void {
    if (!this.auth.isLoggedIn()) { this.toast.info('Inicia sesión para continuar'); this.router.navigate(['/auth/login']); this.closed.emit(); return; }
    this.closed.emit();
    this.router.navigate(['/checkout']);
  }
}
