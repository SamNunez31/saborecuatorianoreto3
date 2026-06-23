import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, Recomendacion } from '../../core/services/api.services';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 style="font-family:var(--se-serif);font-size:1.8rem">Dashboard</h1>
          <p class="text-muted">{{ hoy }}</p>
        </div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>

      @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }

      @if (!loading() && stats()) {
        <!-- Stats -->
        <div class="row g-3 mb-4" role="list">
          <div class="col-6 col-xl-3" role="listitem">
            <div class="stat-card"><div class="stat-label">Ventas hoy</div><div class="stat-value gold">{{ stats()!.ventasHoy | currency:'USD':'symbol':'1.2-2' }}</div></div>
          </div>
          <div class="col-6 col-xl-3" role="listitem">
            <div class="stat-card"><div class="stat-label">Pedidos hoy</div><div class="stat-value">{{ stats()!.pedidosHoy }}</div></div>
          </div>
          <div class="col-6 col-xl-3" role="listitem">
            <div class="stat-card"><div class="stat-label">Pendientes</div><div class="stat-value">{{ stats()!.pedidosPendientes }}</div></div>
          </div>
          <div class="col-6 col-xl-3" role="listitem">
            <div class="stat-card"><div class="stat-label">Clientes</div><div class="stat-value">{{ stats()!.totalClientes }}</div></div>
          </div>
        </div>

        <!-- Recomendaciones IA -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="fw-semibold m-0" style="font-size:1rem">💡 Recomendaciones IA</h2>
          @if (!loadingIA() && recomendaciones().length === 0) {
            <button class="btn btn-outline-secondary btn-sm" (click)="loadIA()">Obtener recomendaciones</button>
          } @else if (!loadingIA()) {
            <button class="btn btn-outline-secondary btn-sm" (click)="loadIA()">↻ Regenerar</button>
          }
        </div>

        @if (loadingIA()) {
          <div class="d-flex align-items-center gap-2 mb-4 text-muted" style="font-size:14px">
            <div class="spinner-border spinner-border-sm" style="color:var(--se-dorado)"></div>
            Consultando inteligencia artificial…
          </div>
        }

        @if (!loadingIA() && recomendaciones().length > 0) {
          <div class="row g-3 mb-4">
            @for (r of recomendaciones(); track $index) {
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 p-4" style="border-left:4px solid var(--se-dorado) !important">
                  <div style="font-size:24px;margin-bottom:10px">💡</div>
                  <div class="fw-semibold mb-2" style="font-size:15px">{{ r.titulo }}</div>
                  <div class="text-muted" style="font-size:13px;line-height:1.5">{{ r.descripcion }}</div>
                </div>
              </div>
            }
          </div>
        }

        @if (!loadingIA() && errorIA()) {
          <div class="alert alert-warning rounded-3 mb-4" style="font-size:13px">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ errorIA() }}
          </div>
        }

        <!-- Accesos rápidos -->
        <h2 class="fw-semibold mb-3" style="font-size:1rem">Accesos rápidos</h2>
        <div class="row g-3">
          @for (acc of accesos; track acc.ruta) {
            <div class="col-sm-6 col-lg-4">
              <a [routerLink]="acc.ruta" class="card border-0 shadow-sm rounded-4 p-4 text-decoration-none text-dark d-block h-100"
                 style="transition:.2s" (mouseover)="$any($event.currentTarget).style.transform='translateY(-3px)'" (mouseout)="$any($event.currentTarget).style.transform=''">
                <div style="font-size:32px;margin-bottom:10px" aria-hidden="true">{{ acc.icon }}</div>
                <div class="fw-semibold">{{ acc.titulo }}</div>
                <div class="text-muted" style="font-size:13px">{{ acc.desc }}</div>
              </a>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private svc = inject(AdminService);
  stats          = signal<DashboardStats | null>(null);
  loading        = signal(true);
  recomendaciones = signal<Recomendacion[]>([]);
  loadingIA      = signal(false);
  errorIA        = signal('');
  hoy = new Date().toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  accesos = [
    { ruta:'/admin/pedidos',  icon:'📦', titulo:'Pedidos',      desc:'Gestionar estados de pedidos' },
    { ruta:'/admin/ventas',   icon:'💰', titulo:'Ventas del día',desc:'Facturas facturadas hoy' },
    { ruta:'/admin/platos',   icon:'🍽', titulo:'Menú',          desc:'Agregar, editar o deshabilitar platos' },
    { ruta:'/admin/facturas', icon:'🧾', titulo:'Facturas',      desc:'Historial completo de facturas' },
    { ruta:'/admin/clientes', icon:'👥', titulo:'Clientes',      desc:'Clientes registrados' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getDashboard().subscribe({
      next: d => { this.stats.set(d); this.loading.set(false); this.loadIA(); },
      error: () => this.loading.set(false)
    });
  }

  loadIA(): void {
    this.loadingIA.set(true);
    this.errorIA.set('');
    this.svc.getRecomendaciones().subscribe({
      next: r => { this.recomendaciones.set(r.recomendaciones); this.loadingIA.set(false); },
      error: () => { this.errorIA.set('No se pudieron obtener recomendaciones. Verifica la clave de Groq.'); this.loadingIA.set(false); }
    });
  }
}
