import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatosService } from '../../core/services/api.services';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Plato, CategoriaPlato } from '../../core/models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main style="padding-top:80px;min-height:100vh" id="main-content">
      <div class="container py-5">
        <header class="mb-4">
          <span class="eyebrow d-block mb-1">Lo que tenemos hoy</span>
          <h1 style="font-family:var(--se-serif);font-size:2rem">Nuestro menú</h1>
        </header>

        <!-- FILTROS -->
        <nav aria-label="Filtrar por categoría" class="mb-4">
          <div class="d-flex gap-2 flex-wrap" role="group" aria-label="Categorías">
            <button class="filtro-btn" [class.active]="catActual() === null"
                    (click)="filtrar(null)" [attr.aria-pressed]="catActual() === null">
              Todos
            </button>
            @for (c of categorias(); track c.id) {
              <button class="filtro-btn" [class.active]="catActual() === c.id"
                      (click)="filtrar(c.id)" [attr.aria-pressed]="catActual() === c.id">
                {{ c.nombre }}
              </button>
            }
          </div>
        </nav>

        <!-- GRID PLATOS -->
        <div class="row g-4" role="list" aria-live="polite" [attr.aria-label]="'Mostrando ' + platosFiltrados().length + ' platos'">
          @if (loading()) {
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="col-sm-6 col-lg-4" aria-hidden="true">
                <div class="card border-0 shadow-sm placeholder-glow">
                  <div class="card-img-top bg-light placeholder" style="height:200px"></div>
                  <div class="card-body"><div class="placeholder col-8 mb-2"></div><div class="placeholder col-5"></div></div>
                </div>
              </div>
            }
          }
          @for (p of platosFiltrados(); track p.id) {
            <div class="col-sm-6 col-lg-4" role="listitem">
              <article class="plato-card card h-100 border-0 shadow-sm" [attr.aria-label]="p.nombre">
                <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height:200px" aria-hidden="true">
                  @if (p.imagenUrl) { <img [src]="p.imagenUrl" [alt]="p.nombre" style="width:100%;height:100%;object-fit:cover" loading="lazy"> }
                  @else { <span style="font-size:48px">{{ emojiCategoria(p.categoria?.nombre) }}</span> }
                </div>
                <div class="card-body d-flex flex-column">
                  <span class="eyebrow mb-1" style="font-size:11px">{{ p.categoria?.nombre }}</span>
                  <h3 class="card-title mb-1" style="font-family:var(--se-serif);font-size:1.05rem">{{ p.nombre }}</h3>
                  <p class="text-muted flex-grow-1" style="font-size:13px">{{ p.descripcion }}</p>
                  <div class="d-flex justify-content-between align-items-center mt-3">
                    <span class="plato-precio" [attr.aria-label]="'Precio: ' + p.precio">
                      {{ p.precio | currency:'USD':'symbol':'1.2-2' }}
                    </span>
                    <button class="btn btn-negro btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style="width:36px;height:36px;font-size:20px"
                            (click)="agregar(p)" [attr.aria-label]="'Agregar ' + p.nombre + ' al carrito'">+</button>
                  </div>
                </div>
              </article>
            </div>
          }
          @if (!loading() && platosFiltrados().length === 0) {
            <div class="col-12 text-center py-5 text-muted" role="status">
              <p style="font-size:40px">🍽</p>
              <p>No hay platos en esta categoría.</p>
            </div>
          }
        </div>
      </div>
    </main>
  `
})
export class MenuComponent implements OnInit {
  private svc   = inject(PlatosService);
  private cart  = inject(CartService);
  private toast = inject(ToastService);

  allPlatos  = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  catActual  = signal<number | null>(null);
  loading    = signal(true);

  platosFiltrados = () => {
    const cat = this.catActual();
    return cat === null ? this.allPlatos() : this.allPlatos().filter(p => p.categoriaId === cat);
  };

  ngOnInit(): void {
    this.svc.getCategorias().subscribe(c => this.categorias.set(c));
    this.svc.getAll().subscribe({
      next: p => { this.allPlatos.set(p.filter(x => x.disponible)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filtrar(id: number | null): void { this.catActual.set(id); }
  agregar(p: Plato): void { this.cart.add(p); this.toast.success(`${p.nombre} agregado al carrito`); }

  emojiCategoria(nombre?: string): string {
    const n = (nombre || '').toLowerCase();
    if (n.includes('sopa') || n.includes('caldo') || n.includes('consomé')) return '🍲';
    if (n.includes('bebida') || n.includes('jugo') || n.includes('refresco')) return '🥤';
    if (n.includes('postre') || n.includes('dulce') || n.includes('helado')) return '🍮';
    if (n.includes('entrada') || n.includes('aperitivo') || n.includes('ensalada')) return '🥗';
    if (n.includes('mariscos') || n.includes('camarón') || n.includes('pescado') || n.includes('ceviche')) return '🦐';
    if (n.includes('pollo') || n.includes('carne') || n.includes('res') || n.includes('cerdo')) return '🥩';
    if (n.includes('arroz') || n.includes('menestra')) return '🍚';
    if (n.includes('desayuno') || n.includes('colada')) return '🍳';
    return '🍽';
  }
}
