import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../../core/services/api.services';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Nombre *</label>
            <input type="text" class="form-control" [(ngModel)]="form.nombre" placeholder="Nombre del proveedor">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Contacto</label>
            <input type="text" class="form-control" [(ngModel)]="form.contacto" placeholder="Nombre del contacto">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Teléfono</label>
            <input type="tel" class="form-control" [(ngModel)]="form.telefono" placeholder="0999999999">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold" style="font-size:13px">Email</label>
            <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="proveedor@email.com">
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-negro" (click)="guardar()" [disabled]="!form.nombre">Guardar</button>
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
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Ingredientes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="6" class="text-center py-4 text-muted">Cargando...</td></tr>
            }
            @for (p of proveedores(); track p.id) {
              <tr>
                <td class="fw-semibold">{{ p.nombre }}</td>
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

  proveedores  = signal<any[]>([]);
  loading      = signal(true);
  mostrarForm  = signal(false);
  editando     = signal<any>(null);

  form: any = { nombre: '', contacto: '', telefono: '', email: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: d => { this.proveedores.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  abrirFormulario() { this.form = { nombre: '', contacto: '', telefono: '', email: '' }; this.editando.set(null); this.mostrarForm.set(true); }
  cerrarFormulario() { this.mostrarForm.set(false); this.editando.set(null); }

  editar(p: any) {
    this.editando.set(p);
    this.form = { nombre: p.nombre, contacto: p.contacto, telefono: p.telefono, email: p.email };
    this.mostrarForm.set(true);
  }

  guardar() {
    const obs = this.editando()
      ? this.svc.update(this.editando().id, this.form)
      : this.svc.create(this.form);
    obs.subscribe({ next: () => { this.load(); this.cerrarFormulario(); }, error: () => alert('Error al guardar') });
  }

  eliminar(id: number) {
    if (confirm('¿Desactivar este proveedor?'))
      this.svc.delete(id).subscribe({ next: () => this.load() });
  }
}
