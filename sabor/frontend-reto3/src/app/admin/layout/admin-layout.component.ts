import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="d-flex">
      <!-- SIDEBAR -->
      <aside class="sidebar-admin d-flex flex-column" role="navigation" aria-label="Panel de administración">
        <div class="p-4 border-bottom" style="border-color:rgba(201,150,26,.15)!important">
          <div style="font-family:var(--se-serif);font-style:italic;color:var(--se-dorado);font-size:1.1rem">Sabor <em>Ecuatoriano</em></div>
          <div style="font-size:11px;color:rgba(201,150,26,.5);margin-top:2px">Panel administrador</div>
        </div>
        <nav class="flex-grow-1 p-2">
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <span aria-hidden="true">📊</span> Dashboard
          </a>
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin/pedidos"  routerLinkActive="active"><span aria-hidden="true">📦</span> Pedidos</a>
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin/facturas" routerLinkActive="active"><span aria-hidden="true">🧾</span> Facturas</a>
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin/ventas"   routerLinkActive="active"><span aria-hidden="true">💰</span> Ventas del día</a>
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin/platos"   routerLinkActive="active"><span aria-hidden="true">🍽</span> Platos</a>
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin/clientes" routerLinkActive="active"><span aria-hidden="true">👥</span> Clientes</a>
          <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 mb-1" routerLink="/admin/mesas"    routerLinkActive="active"><span aria-hidden="true">🪑</span> Mesas</a>
        </nav>
        <div class="p-3 border-top" style="border-color:rgba(201,150,26,.15)!important">
          <div class="text-white-50 mb-2" style="font-size:13px">{{ auth.currentUser()?.nombre }}</div>
          <button class="nav-link d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent"
                  style="color:rgba(255,100,100,.7)" (click)="auth.logout()">
            <span aria-hidden="true">→</span> Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- CONTENIDO -->
      <main class="admin-content flex-grow-1" role="main">
        <router-outlet />
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
}
