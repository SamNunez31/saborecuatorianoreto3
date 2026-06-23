import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlatosService } from '../../core/services/api.services';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Plato } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- HERO -->
    <section class="hero-sabor" aria-label="Bienvenida" style="padding-top:64px">
      <div class="container">
        <div class="col-lg-7">
          <span class="eyebrow d-block mb-2" aria-hidden="true">Restaurante ecuatoriano desde 1998</span>
          <h1>El sabor de<br><em>nuestra tierra</em></h1>
          <p class="mt-3 mb-4 text-white-50" style="font-size:17px;max-width:460px">Platos tradicionales preparados con ingredientes frescos del campo ecuatoriano.</p>
          <div class="d-flex gap-3 flex-wrap">
            <a routerLink="/menu" class="btn btn-dorado btn-lg fw-semibold">Ver menú completo</a>
            <a routerLink="/auth/register" class="btn btn-outline-light btn-lg">Registrarse</a>
          </div>
        </div>
      </div>
    </section>

    <!-- DESTACADOS -->
    <main id="main-content">
      <section class="py-5" aria-labelledby="destacados-title">
        <div class="container">
          <div class="text-center mb-5">
            <span class="eyebrow d-block mb-1" aria-hidden="true">Lo más pedido</span>
            <h2 id="destacados-title" style="font-family:var(--se-serif)">Especialidades de la casa</h2>
          </div>
          <div class="row g-4" role="list">
            @for (p of destacados(); track p.id) {
              <div class="col-md-4" role="listitem">
                <article class="plato-card card h-100 border-0 shadow-sm">
                  <div class="card-img-top bg-light d-flex align-items-center justify-content-center" aria-hidden="true" style="height:200px;font-size:48px">
                    @if (p.imagenUrl) { <img [src]="p.imagenUrl" [alt]="p.nombre" style="width:100%;height:100%;object-fit:cover"> }
                    @else { 🍽 }
                  </div>
                  <div class="card-body">
                    <small class="eyebrow" style="font-size:11px">{{ p.categoria?.nombre }}</small>
                    <h3 class="card-title mt-1 mb-1" style="font-family:var(--se-serif);font-size:1.05rem">{{ p.nombre }}</h3>
                    <p class="text-muted" style="font-size:13px">{{ p.descripcion }}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                      <span class="plato-precio">{{ p.precio | currency:'USD':'symbol':'1.2-2' }}</span>
                      <button class="btn btn-negro btn-sm rounded-circle" style="width:36px;height:36px"
                              (click)="agregar(p)" [attr.aria-label]="'Agregar ' + p.nombre + ' al carrito'">+</button>
                    </div>
                  </div>
                </article>
              </div>
            }
            @if (loading()) {
              @for (i of [1,2,3]; track i) {
                <div class="col-md-4" aria-hidden="true">
                  <div class="card border-0 shadow-sm placeholder-glow">
                    <div class="card-img-top bg-light placeholder" style="height:200px"></div>
                    <div class="card-body"><div class="placeholder col-8 mb-2"></div><div class="placeholder col-5"></div></div>
                  </div>
                </div>
              }
            }
          </div>
          <div class="text-center mt-5"><a routerLink="/menu" class="btn btn-negro btn-lg">Ver menú completo</a></div>
        </div>
      </section>

      <!-- CÓMO FUNCIONA -->
      <section class="py-5" style="background:var(--se-negro)" aria-labelledby="como-title">
        <div class="container">
          <h2 id="como-title" class="text-center text-white mb-5" style="font-family:var(--se-serif)">¿Cómo hacer tu pedido?</h2>
          <div class="row g-4 text-center text-white">
            @for (paso of pasos; track paso.icon) {
              <div class="col-md-3">
                <div style="font-size:40px;margin-bottom:14px" aria-hidden="true">{{ paso.icon }}</div>
                <h3 class="fw-bold" style="font-size:1rem">{{ paso.titulo }}</h3>
                <p style="color:rgba(255,255,255,.5);font-size:14px">{{ paso.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>
    </main>

    <!-- FOOTER -->
    <footer style="background:var(--se-negro);color:rgba(250,246,239,.5);padding:40px 0 20px;border-top:1px solid rgba(201,150,26,.15)" role="contentinfo">
      <div class="container">
        <div class="row g-4 mb-4">
          <div class="col-md-5"><div style="font-family:var(--se-serif);font-style:italic;color:var(--se-dorado);font-size:1.2rem;margin-bottom:8px">Sabor Ecuatoriano</div><p style="font-size:14px">Tradición, sabor y calidad en cada plato desde 1998.</p></div>
          <div class="col-md-3"><h4 class="text-white" style="font-size:14px;margin-bottom:12px">Navegación</h4><ul class="list-unstyled" style="font-size:14px"><li><a routerLink="/menu" style="color:inherit;text-decoration:none">Menú</a></li><li><a routerLink="/mis-pedidos" style="color:inherit;text-decoration:none">Mis pedidos</a></li></ul></div>
          <div class="col-md-4"><h4 class="text-white" style="font-size:14px;margin-bottom:12px">Contacto</h4><ul class="list-unstyled" style="font-size:14px"><li>📍 Av. Amazonas y Colón, Quito</li><li>📞 (02) 256-1234</li><li>🕐 Lun–Sáb 8:00–20:00</li></ul></div>
        </div>
        <div class="border-top pt-3 text-center" style="border-color:rgba(255,255,255,.08)!important;font-size:13px"><p>© 2024 Sabor Ecuatoriano</p></div>
      </div>
    </footer>
  `
})
export class HomeComponent implements OnInit {
  private platosService = inject(PlatosService);
  private cart  = inject(CartService);
  private toast = inject(ToastService);
  destacados = signal<Plato[]>([]);
  loading    = signal(true);

  pasos = [
    { icon:'🍽', titulo:'1. Elige tus platos',  desc:'Explora el menú y agrégalos al carrito.' },
    { icon:'📍', titulo:'2. Retiro o domicilio', desc:'Recógelo en local o te lo llevamos.' },
    { icon:'💳', titulo:'3. Paga fácil',          desc:'Efectivo, tarjeta o transferencia.' },
    { icon:'✅', titulo:'4. Listo',               desc:'Recibe tu factura al instante.' }
  ];

  ngOnInit(): void {
    this.platosService.getAll().subscribe({
      next: p => { this.destacados.set(p.slice(0, 3)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
  agregar(p: Plato): void { this.cart.add(p); this.toast.success(`${p.nombre} agregado`); }
}
