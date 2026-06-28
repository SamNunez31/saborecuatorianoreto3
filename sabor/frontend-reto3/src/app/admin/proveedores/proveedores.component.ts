import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { ProveedoresService } from '../../core/services/api.services';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-0" style="font-family:var(--se-serif)">Proveedores</h2>
        <p class="text-muted mb-0" style="font-size:14px">Gestión de proveedores</p>
      </div>
      <button class="btn btn-negro" (click)="abrirFormulario()">+ Nuevo proveedor</button>
    </div>

    @if (mostrarForm()) {
      <div class="card border-0 shadow-sm mb-4 p-4">
        <h5 class="fw-semibold mb-3">{{ editando() ? 'Editar' : 'Nuevo' }} proveedor</h5>
        <div class="row g-3" [formGroup]="form">
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Nombre *</label>
            <input type="text" class="form-control" formControlName="nombre" placeholder="Distribuidora XYZ"
                   [class.is-invalid]="f['nombre'].invalid && f['nombre'].touched">
            @if (f['nombre'].invalid && f['nombre'].touched) {
              <div class="invalid-feedback">Nombre requerido, mínimo 2 caracteres.</div>
            }
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">RUC <span class="text-muted">(opcional)</span></label>
            <input type="text" class="form-control" formControlName="ruc" placeholder="0999999999001" maxlength="13"
                   [class.is-invalid]="f['ruc'].invalid && f['ruc'].touched">
            @if (f['ruc'].invalid && f['ruc'].touched) {
              <div class="invalid-feedback">RUC debe tener 10 o 13 dígitos numéricos.</div>
            }
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Contacto</label>
            <input type="text" class="form-control" formControlName="contacto" placeholder="Nombre del contacto">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Teléfono</label>
            <input type="tel" class="form-control" formControlName="telefono" placeholder="0999999999" maxlength="10"
                   [class.is-invalid]="f['telefono'].invalid && f['telefono'].touched">
            @if (f['telefono'].invalid && f['telefono'].touched) {
              <div class="invalid-feedback">Teléfono debe tener exactamente 10 dígitos.</div>
            }
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Email</label>
            <input type="email" class="form-control" formControlName="email" placeholder="proveedor@empresa.com"
                   [class.is-invalid]="f['email'].invalid && f['email'].touched">
            @if (f['email'].invalid && f['email'].touched) {
              <div class="invalid-feedback">Email inválido.</div>
            }
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-negro" (click)="guardar()" [disabled]="form.invalid">Guardar</button>
          <button class="btn btn-outline-secondary" (click)="cerrarFormulario()">Cancelar</button>
        </div>
      </div>
    }

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead style="background:#f8f5f0">
            <tr>
              <th>Nombre</th>
              <th>RUC</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Ingredientes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="7" class="text-center py-4 text-muted">Cargando...</td></tr>
            }
            @for (p of proveedores(); track p.id) {
              <tr>
                <td class="fw-semibold">{{ p.nombre }}</td>
                <td>{{ p.ruc || '—' }}</td>
                <td>{{ p.contacto || '—' }}</td>
                <td>{{ p.telefono || '—' }}</td>
                <td>{{ p.email || '—' }}</td>
                <td>
                  <span class="badge bg-secondary">{{ p.ingredientes?.length || 0 }} ingredientes</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(p)">Editar</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="eliminar(p.id)">Desactivar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProveedoresComponent implements OnInit {
  private svc = inject(ProveedoresService);
  private fb  = inject(FormBuilder);

  proveedores  = signal<any[]>([]);
  loading      = signal(true);
  mostrarForm  = signal(false);
  editando     = signal<any>(null);

  form = this.fb.group({
    nombre:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    ruc:      ['', [Validators.pattern(/^[0-9]{10}$|^[0-9]{13}$/)]],
    contacto: ['', [Validators.maxLength(100)]],
    telefono: ['', [Validators.pattern(/^[0-9]{10}$/)]],
    email:    ['', [Validators.email]]
  });

  get f() { return this.form.controls; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: d => { this.proveedores.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  abrirFormulario() {
    this.form.reset();
    this.editando.set(null);
    this.mostrarForm.set(true);
  }

  cerrarFormulario() {
    this.mostrarForm.set(false);
    this.editando.set(null);
    this.form.reset();
  }

  editar(p: any) {
    this.editando.set(p);
    this.form.patchValue({ nombre: p.nombre, ruc: p.ruc, contacto: p.contacto, telefono: p.telefono, email: p.email });
    this.mostrarForm.set(true);
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const obs = this.editando()
      ? this.svc.update(this.editando().id, this.form.value)
      : this.svc.create(this.form.value);
    obs.subscribe({ next: () => { this.load(); this.cerrarFormulario(); }, error: () => alert('Error al guardar') });
  }

  eliminar(id: number) {
    if (confirm('¿Desactivar este proveedor?'))
      this.svc.delete(id).subscribe({ next: () => this.load() });
  }
}
