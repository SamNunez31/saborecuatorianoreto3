import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

        <!-- BÚSQUEDA -->
        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0" placeholder="Buscar en el menú..."
                   [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" aria-label="Buscar plato">
          </div>
        </div>

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
        <div class="row g-4" role="list" aria-live="polite" [attr.aria-label]="'Mostrando ' + platosVisibles().length + ' platos'">
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
          @for (p of platosVisibles(); track p.id) {
            <div class="col-sm-6 col-lg-4" role="listitem">
              <article class="plato-card card h-100 border-0 shadow-sm" [attr.aria-label]="p.nombre"
                       style="cursor:pointer" (click)="abrirModal(p)">
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
                            (click)="$event.stopPropagation(); abrirModal(p)"
                            [attr.aria-label]="'Personalizar y agregar ' + p.nombre">+</button>
                  </div>
                </div>
              </article>
            </div>
          }
          @if (!loading() && platosVisibles().length === 0) {
            <div class="col-12 text-center py-5 text-muted" role="status">
              <p style="font-size:40px">🍽</p>
              <p>No hay platos en esta categoría.</p>
            </div>
          }
        </div>
      </div>
    </main>

    <!-- MODAL DE PERSONALIZACIÓN -->
    @if (platoModal()) {
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true"
           style="background:rgba(0,0,0,.5)" (click)="cerrarModal()">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 rounded-4 overflow-hidden">

            <!-- Imagen/cabecera -->
            <div class="position-relative" style="height:200px;background:#f5f0e8">
              @if (platoModal()!.imagenUrl) {
                <img [src]="platoModal()!.imagenUrl" [alt]="platoModal()!.nombre"
                     style="width:100%;height:100%;object-fit:cover">
              } @else {
                <div class="d-flex align-items-center justify-content-center h-100">
                  <span style="font-size:72px">{{ emojiCategoria(platoModal()!.categoria?.nombre) }}</span>
                </div>
              }
              <button class="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-2"
                      (click)="cerrarModal()" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="modal-body p-4">
              <span class="eyebrow" style="font-size:11px">{{ platoModal()!.categoria?.nombre }}</span>
              <h2 style="font-family:var(--se-serif);font-size:1.4rem;margin:.4rem 0">{{ platoModal()!.nombre }}</h2>
              @if (platoModal()!.descripcion) {
                <p class="text-muted mb-3" style="font-size:14px">{{ platoModal()!.descripcion }}</p>
              }
              <p class="fw-bold mb-4" style="color:var(--se-dorado);font-size:1.2rem">
                {{ platoModal()!.precio | currency:'USD':'symbol':'1.2-2' }}
              </p>

              <!-- Ingredientes -->
              @if (platoModal()!.platoIngredientes?.length) {
                <div class="mb-4">
                  <h3 class="fw-semibold mb-3" style="font-size:14px">Personaliza tu pedido</h3>
                  <div class="d-flex flex-column gap-2">
                    @for (pi of platoModal()!.platoIngredientes!; track pi.id) {
                      <label class="d-flex align-items-center gap-3 p-2 rounded-3"
                             [style.background]="pi.esRemovible ? '#fafafa' : 'transparent'"
                             [style.cursor]="pi.esRemovible ? 'pointer' : 'default'">
                        <input type="checkbox"
                               [checked]="!ingredientesRemovidosSet().has(pi.ingrediente.id)"
                               [disabled]="!pi.esRemovible"
                               (change)="toggleIngrediente(pi.ingrediente.id)"
                               class="form-check-input mt-0" style="width:18px;height:18px">
                        <span style="font-size:14px">{{ pi.ingrediente.nombre }}</span>
                        @if (!pi.esRemovible) {
                          <span class="badge ms-auto" style="background:#f0e8d4;color:#8a7340;font-weight:400;font-size:11px">fijo</span>
                        }
                      </label>
                    }
                  </div>
                </div>
              }

              <!-- Cantidad -->
              <div class="d-flex align-items-center gap-3 mb-4">
                <span class="fw-semibold" style="font-size:14px">Cantidad</span>
                <div class="d-flex align-items-center border rounded-3 overflow-hidden">
                  <button class="btn btn-light px-3 py-2" (click)="qtyModal() > 1 && qtyModal.set(qtyModal() - 1)">−</button>
                  <span class="px-3 fw-bold" style="min-width:36px;text-align:center">{{ qtyModal() }}</span>
                  <button class="btn btn-light px-3 py-2" (click)="qtyModal.set(qtyModal() + 1)">+</button>
                </div>
              </div>
            </div>

            <div class="modal-footer border-0 px-4 pb-4 pt-0">
              <button class="btn btn-outline-secondary me-auto" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-negro px-4 py-2 fw-semibold" (click)="agregarConPersonalizacion()">
                <i class="bi bi-cart-plus me-2"></i>Agregar al carrito
              </button>
            </div>

          </div>
        </div>
      </div>
    }
  `
})
export class MenuComponent implements OnInit {
  private svc   = inject(PlatosService);
  private cart  = inject(CartService);
  private toast = inject(ToastService);

  allPlatos  = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  catActual  = signal<number | null>(null);
  busqueda   = signal('');
  loading    = signal(true);

  platoModal               = signal<Plato | null>(null);
  qtyModal                 = signal(1);
  ingredientesRemovidosSet = signal<Set<number>>(new Set());

  platosVisibles = computed(() => {
    const cat = this.catActual();
    const q   = this.busqueda().toLowerCase().trim();
    return this.allPlatos()
      .filter(p => cat === null || p.categoriaId === cat)
      .filter(p => !q || p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.svc.getCategorias().subscribe(c => this.categorias.set(c));
    this.svc.getAll().subscribe({
      next: p => { this.allPlatos.set(p.filter(x => x.disponible)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filtrar(id: number | null): void { this.catActual.set(id); }

  abrirModal(p: Plato): void {
    this.platoModal.set(p);
    this.qtyModal.set(1);
    this.ingredientesRemovidosSet.set(new Set());
  }

  cerrarModal(): void {
    this.platoModal.set(null);
    this.ingredientesRemovidosSet.set(new Set());
    this.qtyModal.set(1);
  }

  toggleIngrediente(id: number): void {
    const set = new Set(this.ingredientesRemovidosSet());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.ingredientesRemovidosSet.set(set);
  }

  agregarConPersonalizacion(): void {
    const p = this.platoModal();
    if (!p) return;
    const removidosIds = Array.from(this.ingredientesRemovidosSet());
    const nombresRemovidos = p.platoIngredientes
       ?.filter(pi => removidosIds.includes(pi.ingredienteId))
       .map(pi => pi.ingrediente.nombre) || [];
    for (let i = 0; i < this.qtyModal(); i++) this.cart.add(p, removidosIds, nombresRemovidos);
    this.toast.success(`${p.nombre} agregado al carrito`);
    this.cerrarModal();
  }

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
