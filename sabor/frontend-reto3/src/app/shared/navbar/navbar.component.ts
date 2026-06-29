import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ThemeService } from '../../core/services/theme.service';
import { CarritoComponent } from '../carrito/carrito.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, CarritoComponent],
  template: `
    <nav class="navbar navbar-expand-lg navbar-sabor fixed-top" aria-label="Navegación principal">
      <div class="container">
        <a class="navbar-brand navbar-brand-sabor" routerLink="/" aria-label="Sabor Ecuatoriano - Inicio">
          Sabor <em>Ecuatoriano</em>
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse"
                data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Abrir menú">
          <span class="navbar-toggler-icon" style="filter:invert(1)"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto" role="list">
            <li class="nav-item"><a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a></li>
            @if (auth.isAdmin()) {
              <li class="nav-item"><a class="nav-link" routerLink="/admin" routerLinkActive="active">Panel Admin</a></li>
            } @else {
              <li class="nav-item"><a class="nav-link" routerLink="/menu" routerLinkActive="active">Menú</a></li>
              @if (auth.isLoggedIn()) {
                <li class="nav-item"><a class="nav-link" routerLink="/mis-pedidos" routerLinkActive="active">Mis pedidos</a></li>
              }
            }
          </ul>
          <div class="d-flex align-items-center gap-3">
            <!-- Theme Toggle -->
            <button class="btn btn-link p-0 text-white" (click)="theme.toggle()" aria-label="Cambiar tema">
              @if (theme.isDarkMode()) {
                <i class="bi bi-sun-fill" style="font-size:20px; color:var(--se-dorado)"></i>
              } @else {
                <i class="bi bi-moon-stars-fill" style="font-size:20px"></i>
              }
            </button>
            
            <!-- Botón carrito -->
            <button class="btn btn-link p-0 position-relative text-white" (click)="offcanvasOpen=true"
                    [attr.aria-label]="'Abrir carrito, ' + cart.count() + ' artículos'"
                    [class.anim-cart-bounce]="cart.isAnimating()">
              <i class="bi bi-cart3" style="font-size:22px"></i>
              @if (cart.count() > 0) {
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                      style="background:var(--se-dorado);color:var(--se-negro);font-size:10px">
                  {{ cart.count() }}
                </span>
              }
            </button>

            @if (auth.isLoggedIn()) {
              <div class="dropdown">
                <button class="btn rounded-circle d-flex align-items-center justify-content-center fw-bold"
                        style="width:36px;height:36px;background:var(--se-dorado);color:var(--se-negro);border:none"
                        type="button" data-bs-toggle="dropdown" aria-expanded="false"
                        [attr.aria-label]="'Menú de usuario: ' + auth.currentUser()?.nombre">
                  {{ auth.currentUser()?.nombre?.[0]?.toUpperCase() }}
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3" style="min-width:180px">
                  <li class="px-3 py-2 text-muted" style="font-size:13px">{{ auth.currentUser()?.nombre }}</li>
                  <li><hr class="dropdown-divider m-0"></li>
                  @if (auth.isAdmin()) {
                    <li><a class="dropdown-item" routerLink="/admin"><i class="bi bi-gear me-2"></i>Panel admin</a></li>
                  }
                  @if (!auth.isAdmin()) {
                    <li><a class="dropdown-item" routerLink="/mis-pedidos"><i class="bi bi-box me-2"></i>Mis pedidos</a></li>
                  }
                  @if (!auth.isAdmin()) {
                    <li><a class="dropdown-item" routerLink="/mi-cuenta"><i class="bi bi-credit-card me-2"></i>Mi cuenta</a></li>
                  }
                  <li><hr class="dropdown-divider m-0"></li>
                  <li><button class="dropdown-item text-danger" (click)="auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
                </ul>
              </div>
            } @else {
              <a routerLink="/auth/login" class="btn btn-dorado btn-sm">Ingresar</a>
            }
          </div>
        </div>
      </div>
    </nav>

    <!-- Offcanvas carrito -->
    <app-carrito [open]="offcanvasOpen" (closed)="offcanvasOpen=false" />
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  theme = inject(ThemeService);
  offcanvasOpen = false;
}
