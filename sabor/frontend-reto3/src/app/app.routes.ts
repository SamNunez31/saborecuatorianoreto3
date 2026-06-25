import { Routes } from '@angular/router';
import { authGuard, adminGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./cliente/home/home.component').then(m => m.HomeComponent) },
  { path: 'menu', loadComponent: () => import('./cliente/menu/menu.component').then(m => m.MenuComponent) },
  {
    path: 'auth',
    children: [
      { path: 'login',    canActivate: [noAuthGuard], loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', canActivate: [noAuthGuard], loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
    ]
  },
  { path: 'checkout',     canActivate: [authGuard], loadComponent: () => import('./cliente/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'mis-pedidos',  canActivate: [authGuard], loadComponent: () => import('./cliente/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent) },
  { path: 'mi-cuenta',    canActivate: [authGuard], loadComponent: () => import('./cliente/mi-cuenta/mi-cuenta.component').then(m => m.MiCuentaComponent) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '',          loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'pedidos',   loadComponent: () => import('./admin/pedidos/pedidos.component').then(m => m.PedidosAdminComponent) },
      { path: 'facturas',  loadComponent: () => import('./admin/facturas/facturas.component').then(m => m.FacturasAdminComponent) },
      { path: 'ventas',    loadComponent: () => import('./admin/ventas/ventas.component').then(m => m.VentasComponent) },
      { path: 'platos',    loadComponent: () => import('./admin/platos/platos.component').then(m => m.PlatosAdminComponent) },
      { path: 'clientes',  loadComponent: () => import('./admin/clientes/clientes.component').then(m => m.ClientesAdminComponent) },
      { path: 'mesas',     loadComponent: () => import('./admin/mesas/mesas.component').then(m => m.MesasAdminComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
