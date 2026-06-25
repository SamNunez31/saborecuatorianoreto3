import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { TarjetasService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Tarjeta } from '../../core/models';
import { environment } from '../../../environments/environment';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main style="padding-top:80px;min-height:100vh;background:var(--se-crema)">
      <div class="container py-5" style="max-width:760px">
        <a routerLink="/" class="text-decoration-none d-inline-flex align-items-center mb-3" style="color:var(--se-dorado);font-weight:600">
          <i class="bi bi-arrow-left me-2"></i>Volver a la tienda
        </a>
        <div class="mb-4"><span class="eyebrow d-block mb-1">Perfil</span><h1 style="font-family:var(--se-serif);font-size:1.8rem">Mi cuenta</h1></div>

        <!-- TABS -->
        <ul class="nav nav-tabs mb-4" role="tablist">
          <li class="nav-item"><button class="nav-link" [class.active]="tab() === 'tarjetas'" (click)="tab.set('tarjetas')" role="tab" [attr.aria-selected]="tab() === 'tarjetas'">💳 Mis tarjetas</button></li>
          <li class="nav-item"><button class="nav-link" [class.active]="tab() === 'perfil'"   (click)="tab.set('perfil')"   role="tab" [attr.aria-selected]="tab() === 'perfil'">👤 Mis datos</button></li>
        </ul>

        <!-- TAB TARJETAS -->
        @if (tab() === 'tarjetas') {
          <div role="tabpanel">

            <!-- Tarjeta virtual animada -->
            <div class="tarjeta-virtual mb-4"
                 [class.Visa]="marcaActual() === 'VISA'"
                 [class.Mastercard]="marcaActual() === 'MASTERCARD'"
                 [style.background]="marcaActual() === 'VISA'
                   ? 'linear-gradient(135deg,#1a56db 0%,#0a2d9c 100%)'
                   : 'linear-gradient(135deg,#1a1a2e 0%,#c41230 100%)'"
                 aria-label="Vista previa de tarjeta">
              <div class="card-shine" aria-hidden="true"></div>
              <div class="card-chip" aria-hidden="true"></div>
              <div class="card-num">{{ previewNum() }}</div>
              <div class="d-flex justify-content-between align-items-end">
                <div><div class="card-lbl">Titular</div><div class="card-val">{{ previewTitular() || 'TU NOMBRE' }}</div></div>
                <div><div class="card-lbl">Vence</div><div class="card-val">{{ previewExp() }}</div></div>
                <div style="font-family:serif;font-style:italic;font-size:18px;font-weight:700;letter-spacing:.5px">
                  {{ marcaActual() }}
                </div>
              </div>
            </div>

            <!-- Tarjetas guardadas -->
            <div class="mb-4" aria-live="polite">
              @for (t of tarjetas(); track t.id) {
                <div class="d-flex align-items-center gap-3 p-3 mb-2 rounded-3 border"
                     [class.border-warning]="t.esPrincipal">
                  <span style="font-size:28px" aria-hidden="true">💳</span>
                  <div class="flex-grow-1">
                    <div class="fw-semibold">{{ t.marca }} {{ t.numeroMasked }}</div>
                    <div class="text-muted" style="font-size:13px">{{ t.titular }} · Vence {{ t.mesExp }}/{{ t.anioExp }}</div>
                    @if (t.esPrincipal) { <span class="badge badge-pagada mt-1">Principal</span> }
                  </div>
                  <div class="d-flex gap-2">
                    @if (!t.esPrincipal) {
                      <button class="btn btn-outline-warning btn-sm" (click)="setPrincipal(t.id)" [attr.aria-label]="'Marcar ' + t.marca + ' como principal'">Principal</button>
                    }
                    <button class="btn btn-outline-danger btn-sm" (click)="deleteTarjeta(t.id)" [attr.aria-label]="'Eliminar tarjeta ' + t.marca">✕</button>
                  </div>
                </div>
              }
              @if (!tarjetas().length) { <p class="text-muted" style="font-size:14px">Sin tarjetas guardadas.</p> }
            </div>

            <!-- Formulario nueva tarjeta -->
            <section class="card border-0 shadow-sm rounded-4 p-4" aria-labelledby="nueva-tarjeta-title">
              <h2 id="nueva-tarjeta-title" class="fw-semibold mb-4" style="font-size:1rem">Agregar nueva tarjeta</h2>
              <form [formGroup]="cardForm" (ngSubmit)="saveTarjeta()" novalidate>

                <!-- Marca (detección automática) -->
                <div class="mb-3">
                  <label class="form-label fw-semibold" style="font-size:13px">
                    Marca <span class="text-muted fw-normal">(se detecta al ingresar el número)</span>
                  </label>
                  <div class="d-flex gap-2" role="group" aria-label="Marca de tarjeta">
                    @for (m of marcas; track m) {
                      <button type="button" class="marca-btn" [class.active]="marcaActual() === m"
                              (click)="setMarca(m)">{{ m }}</button>
                    }
                  </div>
                </div>

                <!-- Número con validación Luhn -->
                <div class="mb-3">
                  <label for="cardNum" class="form-label fw-semibold" style="font-size:13px">Número de tarjeta *</label>
                  <input id="cardNum" type="text" class="form-control" formControlName="numero"
                         inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456"
                         autocomplete="cc-number" (input)="formatCardNum($event)"
                         [class.is-invalid]="f['numero'].invalid && f['numero'].touched">
                  <div class="form-text text-muted" style="font-size:12px">Solo guardamos los últimos 4 dígitos.</div>
                  @if (f['numero'].invalid && f['numero'].touched) {
                    @if (f['numero'].errors?.['luhn']) {
                      <div class="invalid-feedback d-block" role="alert">Número de tarjeta inválido (verificación Luhn fallida).</div>
                    } @else {
                      <div class="invalid-feedback" role="alert">Ingresa entre 13 y 16 dígitos.</div>
                    }
                  }
                </div>

                <!-- Titular -->
                <div class="mb-3">
                  <label for="cardTit" class="form-label fw-semibold" style="font-size:13px">Titular *</label>
                  <input id="cardTit" type="text" class="form-control" formControlName="titular"
                         placeholder="JUAN PÉREZ" autocomplete="cc-name"
                         (input)="toUpper($event)"
                         [class.is-invalid]="f['titular'].invalid && f['titular'].touched">
                  @if (f['titular'].invalid && f['titular'].touched) {
                    <div class="invalid-feedback" role="alert">Titular requerido.</div>
                  }
                </div>

                <!-- Exp + CVV -->
                <div class="row g-3 mb-3">
                  <div class="col-4">
                    <label for="cardMes" class="form-label fw-semibold" style="font-size:13px">Mes *</label>
                    <select id="cardMes" class="form-select" formControlName="mesExp" autocomplete="cc-exp-month"
                            [class.is-invalid]="f['mesExp'].invalid && f['mesExp'].touched">
                      <option value="">MM</option>
                      @for (m of meses; track m) { <option [value]="m">{{ m }}</option> }
                    </select>
                  </div>
                  <div class="col-4">
                    <label for="cardAnio" class="form-label fw-semibold" style="font-size:13px">Año *</label>
                    <select id="cardAnio" class="form-select" formControlName="anioExp" autocomplete="cc-exp-year"
                            [class.is-invalid]="f['anioExp'].invalid && f['anioExp'].touched">
                      <option value="">AAAA</option>
                      @for (y of anios; track y) { <option [value]="y">{{ y }}</option> }
                    </select>
                  </div>
                  <div class="col-4">
                    <label for="cardCvv" class="form-label fw-semibold" style="font-size:13px">CVV *</label>
                    <input id="cardCvv" type="password" class="form-control" formControlName="cvv"
                           maxlength="4" placeholder="•••" autocomplete="cc-csc"
                           [class.is-invalid]="f['cvv'].invalid && f['cvv'].touched">
                    <div class="form-text text-muted" style="font-size:11px">Nunca lo almacenamos.</div>
                  </div>
                </div>

                <button type="submit" class="btn btn-dorado w-100 fw-semibold" [disabled]="savingCard()">
                  @if (savingCard()) { <span class="spinner-border spinner-border-sm me-2"></span> Guardando... }
                  @else { Guardar tarjeta }
                </button>
              </form>
            </section>
          </div>
        }

        <!-- TAB PERFIL -->
        @if (tab() === 'perfil') {
          <div role="tabpanel">
            <section class="card border-0 shadow-sm rounded-4 p-4 mb-4" aria-labelledby="mis-datos-title">
              <h2 id="mis-datos-title" class="fw-semibold mb-4" style="font-size:1rem">Mis datos</h2>
              <form [formGroup]="perfilForm" (ngSubmit)="savePerfil()" novalidate>
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label for="pNombre" class="form-label fw-semibold" style="font-size:13px">Nombre *</label>
                    <input id="pNombre" type="text" class="form-control" formControlName="nombre"
                           autocomplete="given-name"
                           [class.is-invalid]="pf['nombre'].invalid && pf['nombre'].touched">
                    @if (pf['nombre'].invalid && pf['nombre'].touched) {
                      <div class="invalid-feedback" role="alert">
                        @if (pf['nombre'].errors?.['required']) { Nombre requerido. }
                        @else if (pf['nombre'].errors?.['pattern']) { Solo se permiten letras y espacios. }
                      </div>
                    }
                  </div>
                  <div class="col-sm-6">
                    <label for="pApellido" class="form-label fw-semibold" style="font-size:13px">Apellido</label>
                    <input id="pApellido" type="text" class="form-control" formControlName="apellido"
                           autocomplete="family-name"
                           [class.is-invalid]="pf['apellido'].invalid && pf['apellido'].touched">
                    @if (pf['apellido'].invalid && pf['apellido'].touched) {
                      <div class="invalid-feedback" role="alert">Solo se permiten letras y espacios.</div>
                    }
                  </div>
                  <div class="col-sm-6">
                    <label for="pTelefono" class="form-label fw-semibold" style="font-size:13px">Teléfono</label>
                    <input id="pTelefono" type="tel" class="form-control" formControlName="telefono"
                           maxlength="10" placeholder="0999999999" autocomplete="tel"
                           [class.is-invalid]="pf['telefono'].invalid && pf['telefono'].touched">
                    @if (pf['telefono'].invalid && pf['telefono'].touched) {
                      <div class="invalid-feedback" role="alert">Ingresa exactamente 10 dígitos numéricos.</div>
                    }
                  </div>
                  <div class="col-sm-6">
                    <label for="pDireccion" class="form-label fw-semibold" style="font-size:13px">Dirección</label>
                    <input id="pDireccion" type="text" class="form-control" formControlName="direccion"
                           placeholder="Av. Colón N12-34" autocomplete="street-address">
                  </div>
                </div>
                <button type="submit" class="btn btn-dorado fw-semibold mt-4" [disabled]="savingPerfil()">
                  @if (savingPerfil()) { <span class="spinner-border spinner-border-sm me-2"></span> Guardando... }
                  @else { Guardar cambios }
                </button>
              </form>
            </section>

            <div class="card border-0 shadow-sm rounded-4 p-4">
              <div class="row g-3 mb-4">
                <div class="col-12"><div class="text-muted fw-semibold" style="font-size:11px;text-transform:uppercase;letter-spacing:.1em">Email</div><div class="fw-semibold mt-1">{{ auth.currentUser()?.email }}</div></div>
                <div class="col-12"><div class="text-muted fw-semibold" style="font-size:11px;text-transform:uppercase;letter-spacing:.1em">Rol</div><div class="mt-1"><span class="badge bg-light text-dark">{{ auth.currentUser()?.rol }}</span></div></div>
              </div>
              <button class="btn btn-outline-danger" (click)="auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button>
            </div>
          </div>
        }
      </div>
    </main>
  `
})
export class MiCuentaComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private http     = inject(HttpClient);
  private tarjSvc  = inject(TarjetasService);
  private toast    = inject(ToastService);
  auth         = inject(AuthService);
  tarjetas     = signal<Tarjeta[]>([]);
  tab          = signal<'tarjetas'|'perfil'>('tarjetas');
  marcaActual  = signal<'VISA'|'MASTERCARD'>('VISA');
  savingCard   = signal(false);
  savingPerfil = signal(false);

  readonly marcas = ['VISA', 'MASTERCARD'];
  readonly meses  = Array.from({length:12}, (_,i) => String(i+1).padStart(2,'0'));
  readonly anios  = Array.from({length:8},  (_,i) => String(new Date().getFullYear()+i));

  // Luhn algorithm — declared before cardForm so it can be used as validator
  private readonly luhnCheck = (ctrl: AbstractControl): ValidationErrors | null => {
    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (!digits || digits.length < 13) return null; // length handled by pattern validator
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = +digits[i];
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0 ? null : { luhn: true };
  };

  cardForm = this.fb.group({
    numero:  ['', [Validators.required, Validators.pattern(/^[\d\s]{13,19}$/), this.luhnCheck]],
    titular: ['', Validators.required],
    mesExp:  ['', Validators.required],
    anioExp: ['', Validators.required],
    cvv:     ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
  });

  perfilForm = this.fb.group({
    nombre:    ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    apellido:  ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    telefono:  ['', [Validators.pattern(/^[0-9]{10}$/)]],
    direccion: ['']
  });

  get f()  { return this.cardForm.controls; }
  get pf() { return this.perfilForm.controls; }

  previewNum(): string {
    const v = this.f['numero'].value?.replace(/\s/g, '') || '';
    const chunks = v.match(/.{1,4}/g) || [];
    return chunks.map((c, i) => i < chunks.length - 1 ? '****' : c.padEnd(4, '*')).join(' ') || '**** **** **** ****';
  }
  previewTitular(): string { return this.f['titular'].value || ''; }
  previewExp(): string     { return `${this.f['mesExp'].value || 'MM'}/${(this.f['anioExp'].value || '').slice(-2) || 'AA'}`; }

  ngOnInit(): void { this.loadTarjetas(); this.loadPerfil(); }

  loadPerfil(): void {
    this.http.get<any>(`${environment.apiUrl}/clientes/mi-perfil`).subscribe({
      next: p => this.perfilForm.patchValue({ nombre: p.nombre || '', apellido: p.apellido || '', telefono: p.telefono || '', direccion: p.direccion || '' }),
      error: () => {}
    });
  }

  savePerfil(): void {
    if (this.perfilForm.invalid) { this.perfilForm.markAllAsTouched(); return; }
    this.savingPerfil.set(true);
    this.http.put(`${environment.apiUrl}/clientes/mi-perfil`, this.perfilForm.value).subscribe({
      next: () => { this.toast.success('Datos actualizados correctamente'); this.savingPerfil.set(false); },
      error: e => { this.toast.error(e.error?.error || 'Error al guardar'); this.savingPerfil.set(false); }
    });
  }

  loadTarjetas(): void { this.tarjSvc.getAll().subscribe(t => this.tarjetas.set(t)); }

  setMarca(m: string): void { this.marcaActual.set(m as 'VISA'|'MASTERCARD'); }

  formatCardNum(e: Event): void {
    const input = e.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = digits.replace(/(.{4})/g, '$1 ').trim();
    this.cardForm.patchValue({ numero: input.value });

    // Auto-detect brand from BIN prefix
    if (digits.startsWith('4')) {
      this.marcaActual.set('VISA');
    } else if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
      this.marcaActual.set('MASTERCARD');
    }
  }

  toUpper(e: Event): void {
    const input = e.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.cardForm.patchValue({ titular: input.value });
  }

  saveTarjeta(): void {
    if (this.cardForm.invalid) { this.cardForm.markAllAsTouched(); return; }
    this.savingCard.set(true);
    const v = this.cardForm.value;
    this.tarjSvc.create({ numero: v.numero!, titular: v.titular!, marca: this.marcaActual(), mesExp: v.mesExp!, anioExp: v.anioExp! }).subscribe({
      next: () => {
        this.toast.success('Tarjeta guardada');
        this.cardForm.reset();
        this.marcaActual.set('VISA');
        this.loadTarjetas();
        this.savingCard.set(false);
      },
      error: e => { this.toast.error(e.error?.error || 'Error al guardar'); this.savingCard.set(false); }
    });
  }

  deleteTarjeta(id: number): void {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    this.tarjSvc.delete(id).subscribe({
      next: () => { this.toast.success('Tarjeta eliminada'); this.loadTarjetas(); },
      error: () => this.toast.error('Error al eliminar')
    });
  }

  setPrincipal(id: number): void {
    this.tarjSvc.setPrincipal(id).subscribe({
      next: () => { this.toast.success('Tarjeta principal actualizada'); this.loadTarjetas(); },
      error: () => this.toast.error('Error')
    });
  }
}
