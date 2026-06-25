import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/api.services';
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
        <!-- Stats principales -->
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

        <!-- Análisis del negocio -->
        <h2 class="fw-semibold mb-3" style="font-size:1rem">📊 Análisis del negocio</h2>
        <div class="row g-3 mb-4">

          <!-- Plato más vendido del día -->
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 p-4" style="border-left:4px solid var(--se-dorado)">
              <div style="font-size:26px;margin-bottom:8px">🍽️</div>
              <div class="text-muted mb-1" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Plato del día</div>
              <div class="fw-bold" style="font-size:14px;line-height:1.3">
                {{ stats()!.platoPrincipal?.nombre ?? 'Sin pedidos aún' }}
              </div>
              @if (stats()!.platoPrincipal) {
                <div class="mt-1" style="font-size:12px;color:var(--se-gris)">
                  {{ stats()!.platoPrincipal!.cantidad }} unidades
                </div>
              }
            </div>
          </div>

          <!-- Hora pico -->
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 p-4" style="border-left:4px solid #6366f1">
              <div style="font-size:26px;margin-bottom:8px">⏰</div>
              <div class="text-muted mb-1" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Hora pico</div>
              <div class="fw-bold" style="font-size:14px">
                {{ stats()!.horaPico ?? 'Sin datos' }}
              </div>
              @if (stats()!.horaPico) {
                <div class="mt-1" style="font-size:12px;color:var(--se-gris)">Mayor demanda</div>
              }
            </div>
          </div>

          <!-- Ticket promedio -->
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 p-4" style="border-left:4px solid #16a34a">
              <div style="font-size:26px;margin-bottom:8px">💰</div>
              <div class="text-muted mb-1" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Ticket promedio</div>
              <div class="fw-bold" style="font-size:14px">
                {{ ticketPromedio() | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <div class="mt-1" style="font-size:12px;color:var(--se-gris)">Por pedido</div>
            </div>
          </div>

          <!-- Recomendación automática -->
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 p-4"
                 [style.border-left]="'4px solid ' + recomendacionColor()">
              <div style="font-size:26px;margin-bottom:8px">{{ recomendacionIcono() }}</div>
              <div class="text-muted mb-1" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Estado</div>
              <div class="fw-semibold" style="font-size:13px;line-height:1.4">{{ recomendacion() }}</div>
            </div>
          </div>

        </div>

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

  stats   = signal<DashboardStats | null>(null);
  loading = signal(true);
  hoy = new Date().toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  accesos = [
    { ruta:'/admin/pedidos',  icon:'📦', titulo:'Pedidos',       desc:'Gestionar estados de pedidos' },
    { ruta:'/admin/ventas',   icon:'💰', titulo:'Ventas del día', desc:'Facturas emitidas hoy' },
    { ruta:'/admin/platos',   icon:'🍽', titulo:'Menú',           desc:'Agregar, editar o deshabilitar platos' },
    { ruta:'/admin/facturas', icon:'🧾', titulo:'Facturas',       desc:'Historial completo de facturas' },
    { ruta:'/admin/clientes', icon:'👥', titulo:'Clientes',       desc:'Clientes registrados' },
  ];

  ticketPromedio = computed(() => {
    const s = this.stats();
    if (!s || s.pedidosHoy === 0) return 0;
    return s.ventasHoy / s.pedidosHoy;
  });

  recomendacion = computed(() => {
    const s = this.stats();
    if (!s) return '';
    if (s.pedidosPendientes > 3) return `Hay ${s.pedidosPendientes} pedidos por atender. ¡A cocinar!`;
    if (s.ventasHoy > 50)        return '¡Buen día de ventas! Sigue así.';
    if (s.totalClientes > 10)    return `Base de clientes creciendo: ${s.totalClientes} registrados.`;
    return 'Comienza a tomar pedidos para ver tu progreso.';
  });

  recomendacionIcono = computed(() => {
    const s = this.stats();
    if (!s) return '💡';
    if (s.pedidosPendientes > 3) return '⚠️';
    if (s.ventasHoy > 50)        return '🎉';
    if (s.totalClientes > 10)    return '📈';
    return '💡';
  });

  recomendacionColor = computed(() => {
    const s = this.stats();
    if (!s) return '#c9961a';
    if (s.pedidosPendientes > 3) return '#ef4444';
    if (s.ventasHoy > 50)        return '#16a34a';
    if (s.totalClientes > 10)    return '#6366f1';
    return '#c9961a';
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getDashboard().subscribe({
      next: d => { this.stats.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
