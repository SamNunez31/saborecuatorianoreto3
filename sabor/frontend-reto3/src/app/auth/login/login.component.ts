import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-vh-100 d-flex">
      <!-- Panel izquierdo decorativo -->
      <div class="d-none d-lg-flex flex-grow-1 align-items-center p-5"
           style="background:linear-gradient(rgba(15,13,11,.8),rgba(15,13,11,.9)),url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80') center/cover"
           aria-hidden="true">
        <div class="text-white">
          <div style="font-family:var(--se-serif);font-style:italic;color:var(--se-dorado);font-size:1.3rem;margin-bottom:20px">Sabor Ecuatoriano</div>
          <h1 style="font-family:var(--se-serif);font-size:2.4rem">Tradición en<br>cada plato</h1>
          <p class="mt-3 text-white-50">Pide en línea, retira o recibe en casa.</p>
        </div>
      </div>

      <!-- Formulario -->
      <div class="d-flex align-items-center justify-content-center p-4 p-lg-5" style="width:100%;max-width:480px;background:#fff">
        <div style="width:100%">
          <h2 class="fw-bold mb-1" style="font-family:var(--se-serif)">Bienvenido</h2>
          <p class="text-muted mb-4" style="font-size:14px">Ingresa con tu cuenta para hacer pedidos.</p>

          <!-- OWASP A03: Reactive Forms con Validators -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <!-- Email -->
            <div class="mb-3">
              <label for="email" class="form-label fw-semibold" style="font-size:13px">Email</label>
              <input id="email" type="email" class="form-control" formControlName="email"
                     placeholder="tu@email.com" autocomplete="email"
                     [class.is-invalid]="f['email'].invalid && f['email'].touched"
                     aria-required="true" [attr.aria-invalid]="f['email'].invalid && f['email'].touched">
              @if (f['email'].invalid && f['email'].touched) {
                <div class="invalid-feedback" role="alert">
                  @if (f['email'].errors?.['required']) { Email requerido. }
                  @if (f['email'].errors?.['email']) { Ingresa un email válido. }
                </div>
              }
            </div>

            <!-- Contraseña -->
            <div class="mb-4">
              <label for="password" class="form-label fw-semibold" style="font-size:13px">Contraseña</label>
              <input id="password" type="password" class="form-control" formControlName="password"
                     placeholder="••••••••" autocomplete="current-password"
                     [class.is-invalid]="f['password'].invalid && f['password'].touched"
                     aria-required="true">
              @if (f['password'].invalid && f['password'].touched) {
                <div class="invalid-feedback" role="alert">Contraseña requerida.</div>
              }
            </div>

            <button type="submit" class="btn btn-dorado w-100 py-2 fw-semibold"
                    [disabled]="loading" aria-label="Ingresar a tu cuenta">
              @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> Ingresando... }
              @else { Ingresar }
            </button>
          </form>

          <p class="text-center mt-3" style="font-size:14px;color:var(--se-gris)">
            ¿No tienes cuenta? <a routerLink="/auth/register" style="color:var(--se-dorado);font-weight:600">Regístrate aquí</a>
          </p>

          <!-- Usuarios de prueba -->
          <div class="mt-4 p-3 rounded-3" style="background:var(--se-beige);font-size:13px">
            <div class="fw-semibold mb-1" style="color:var(--se-gris);font-size:11px;text-transform:uppercase;letter-spacing:.1em">Usuarios de prueba</div>
            <button class="btn btn-link p-0 d-block" style="font-size:13px;color:var(--se-dorado);text-decoration:none" (click)="fillAdmin()">🔑 admin&#64;sabor.ec / admin123</button>
            <button class="btn btn-link p-0 d-block" style="font-size:13px;color:var(--se-gris);text-decoration:none"   (click)="fillCliente()">👤 cliente&#64;prueba.ec / cliente123</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  loading = false;

  // OWASP A03 – Injection: Reactive Forms con validación del lado cliente
  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading = true;
    this.auth.login(this.loginForm.value as { email: string; password: string }).subscribe({
      next: (r) => {
        this.toast.success(`¡Bienvenido, ${r.usuario.nombre}!`);
        const destino = ['admin', 'cajero'].includes(r.usuario.rol) ? '/admin' : '/menu';
        this.router.navigate([destino]);
      },
      error: (e) => { this.toast.error(e.error?.error || 'Credenciales inválidas'); this.loading = false; }
    });
  }

  fillAdmin():   void { this.loginForm.setValue({ email: 'admin@sabor.ec',    password: 'admin123' }); }
  fillCliente(): void { this.loginForm.setValue({ email: 'cliente@prueba.ec', password: 'cliente123' }); }
}
