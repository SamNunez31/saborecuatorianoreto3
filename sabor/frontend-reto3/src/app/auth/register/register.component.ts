import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** Validador personalizado: las contraseñas deben coincidir */
function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  const pass    = c.get('password')?.value;
  const confirm = c.get('passwordConfirm')?.value;
  return pass && confirm && pass !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center py-5" style="background:var(--se-crema);padding-top:80px!important">
      <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5" style="width:100%;max-width:520px">
        <div style="font-family:var(--se-serif);font-style:italic;color:var(--se-dorado);margin-bottom:6px">Sabor Ecuatoriano</div>
        <h2 class="fw-bold mb-1" style="font-family:var(--se-serif)">Crea tu cuenta</h2>
        <p class="text-muted mb-4" style="font-size:14px">Completa el formulario para empezar a pedir.</p>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="row g-3">
            <!-- Nombre -->
            <div class="col-sm-6">
              <label for="nombre" class="form-label fw-semibold" style="font-size:13px">Nombre *</label>
              <input id="nombre" type="text" class="form-control" formControlName="nombre"
                     placeholder="Juan" autocomplete="given-name"
                     [class.is-invalid]="f['nombre'].invalid && f['nombre'].touched" aria-required="true">
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <div class="invalid-feedback" role="alert">
                  @if (f['nombre'].errors?.['required']) { Nombre requerido. }
                  @else if (f['nombre'].errors?.['minlength'] || f['nombre'].errors?.['maxlength']) { Entre 2 y 50 caracteres. }
                  @else if (f['nombre'].errors?.['pattern']) { Solo se permiten letras y espacios. }
                </div>
              }
            </div>
            <!-- Apellido -->
            <div class="col-sm-6">
              <label for="apellido" class="form-label fw-semibold" style="font-size:13px">Apellido</label>
              <input id="apellido" type="text" class="form-control" formControlName="apellido"
                     placeholder="Pérez" autocomplete="family-name"
                     [class.is-invalid]="f['apellido'].invalid && f['apellido'].touched">
              @if (f['apellido'].invalid && f['apellido'].touched) {
                <div class="invalid-feedback" role="alert">Solo se permiten letras y espacios.</div>
              }
            </div>
            <!-- Email -->
            <div class="col-12">
              <label for="email" class="form-label fw-semibold" style="font-size:13px">Email *</label>
              <input id="email" type="email" class="form-control" formControlName="email"
                     placeholder="tu@email.com" autocomplete="email"
                     [class.is-invalid]="f['email'].invalid && f['email'].touched" aria-required="true">
              @if (f['email'].invalid && f['email'].touched) {
                <div class="invalid-feedback" role="alert">
                  @if (f['email'].errors?.['required']) { Email requerido. }
                  @if (f['email'].errors?.['email']) { Email inválido. }
                </div>
              }
            </div>
            <!-- Contraseña -->
            <div class="col-sm-6">
              <label for="password" class="form-label fw-semibold" style="font-size:13px">Contraseña *</label>
              <input id="password" type="password" class="form-control" formControlName="password"
                     placeholder="Mínimo 6 caracteres" autocomplete="new-password"
                     [class.is-invalid]="f['password'].invalid && f['password'].touched" aria-required="true">
              @if (f['password'].invalid && f['password'].touched) {
                <div class="invalid-feedback" role="alert">Mínimo 6 caracteres.</div>
              }
            </div>
            <!-- Confirmar -->
            <div class="col-sm-6">
              <label for="passwordConfirm" class="form-label fw-semibold" style="font-size:13px">Confirmar *</label>
              <input id="passwordConfirm" type="password" class="form-control" formControlName="passwordConfirm"
                     placeholder="Repite la contraseña" autocomplete="new-password"
                     [class.is-invalid]="(f['passwordConfirm'].touched) && registerForm.errors?.['passwordsMismatch']">
              @if (f['passwordConfirm'].touched && registerForm.errors?.['passwordsMismatch']) {
                <div class="invalid-feedback d-block" role="alert">Las contraseñas no coinciden.</div>
              }
            </div>
            <!-- Teléfono -->
            <div class="col-sm-6">
              <label for="telefono" class="form-label fw-semibold" style="font-size:13px">Teléfono</label>
              <input id="telefono" type="tel" class="form-control" formControlName="telefono"
                     placeholder="0999999999" autocomplete="tel" maxlength="10"
                     [class.is-invalid]="f['telefono'].invalid && f['telefono'].touched">
              @if (f['telefono'].invalid && f['telefono'].touched) {
                <div class="invalid-feedback" role="alert">Ingresa exactamente 10 dígitos numéricos.</div>
              }
            </div>
            <!-- Cédula -->
            <div class="col-sm-6">
              <label for="cedula" class="form-label fw-semibold" style="font-size:13px">Cédula</label>
              <input id="cedula" type="text" class="form-control" formControlName="cedula"
                     placeholder="1234567890" maxlength="10"
                     [class.is-invalid]="f['cedula'].invalid && f['cedula'].touched">
              @if (f['cedula'].invalid && f['cedula'].touched) {
                <div class="invalid-feedback" role="alert">Ingresa exactamente 10 dígitos numéricos.</div>
              }
            </div>
            <!-- Dirección -->
            <div class="col-sm-6">
              <label for="direccion" class="form-label fw-semibold" style="font-size:13px">Dirección</label>
              <input id="direccion" type="text" class="form-control" formControlName="direccion"
                     placeholder="Av. Colón N12-34" autocomplete="street-address">
            </div>
          </div>

          <button type="submit" class="btn btn-dorado w-100 py-2 fw-semibold mt-4"
                  [disabled]="loading">
            @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> Creando... }
            @else { Crear cuenta }
          </button>
        </form>

        <p class="text-center mt-3" style="font-size:14px;color:var(--se-gris)">
          ¿Ya tienes cuenta? <a routerLink="/auth/login" style="color:var(--se-dorado);font-weight:600">Ingresar</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  loading = false;

  private readonly LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  private readonly TELEFONO = /^[0-9]{10}$/;

  registerForm = this.fb.group({
    nombre:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    apellido:        ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', Validators.required],
    telefono:        ['', [Validators.pattern(/^[0-9]{10}$/)]],
    cedula:          ['', [Validators.pattern(/^[0-9]{10}$/)]],
    direccion:       ['']
  }, { validators: passwordsMatch });

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.loading = true;
    const { passwordConfirm, ...rest } = this.registerForm.value;
    this.auth.register(rest as { nombre: string; apellido: string; email: string; password: string; telefono?: string; direccion?: string }).subscribe({
      next: (r) => {
        this.loading = false;
        this.toast.success(`¡Cuenta creada! Bienvenido, ${r.usuario.nombre}`);
        this.router.navigate(['/menu']);
      },
      error: (e) => { this.toast.error(e.error?.error || 'Error al crear cuenta'); this.loading = false; }
    });
  }
}

