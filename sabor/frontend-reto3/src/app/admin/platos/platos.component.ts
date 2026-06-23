import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlatosService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Plato, CategoriaPlato, CreatePlatoDto } from '../../core/models';

@Component({
  selector: 'app-platos-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div><h1 style="font-family:var(--se-serif);font-size:1.8rem">Platos</h1><p class="text-muted">Menú del restaurante</p></div>
        <button class="btn btn-dorado" (click)="abrirModal()" aria-label="Agregar nuevo plato">+ Agregar plato</button>
      </div>

      @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th style="width:40%">Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Disponible</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of platos(); track p.id) {
              <tr>
                <td class="fw-semibold">{{ p.nombre }}</td>
                <td><span class="badge text-bg-secondary">{{ p.categoria?.nombre }}</span></td>
                <td class="fw-bold text-success">{{ p.precio | currency:'USD' }}</td>
                <td>@if (p.disponible) { <i class="bi bi-check-circle-fill text-success"></i> }</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(p)">Editar</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="eliminar(p.id)">Eliminar</button>
                </td>
              </tr>
            }
            @if (!loading() && platos().length === 0) {
              <tr><td colspan="5" class="text-center py-5 text-muted">Sin platos disponibles.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    @if (modalOpen()) {
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" [attr.aria-labelledby]="'modalPlatoTitle'"
           style="background:rgba(0,0,0,.5)" (click)="cerrarModal()">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content rounded-4 border-0">
            <div class="modal-header border-0 pb-0">
              <h2 id="modalPlatoTitle" class="modal-title fw-bold" style="font-family:var(--se-serif);font-size:1.2rem">
                {{ editando() ? 'Editar plato' : 'Agregar plato' }}
              </h2>
              <button type="button" class="btn-close" (click)="cerrarModal()" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body px-4">
              <form [formGroup]="platoForm" (ngSubmit)="guardar()" novalidate>
                <!-- Categoría -->
                <div class="mb-3">
                  <label for="pCat" class="form-label fw-semibold" style="font-size:13px">Categoría *</label>
                  <select id="pCat" class="form-select" formControlName="categoriaId"
                          [class.is-invalid]="f['categoriaId'].invalid && f['categoriaId'].touched">
                    <option value="">Seleccionar...</option>
                    @for (c of categorias(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }
                  </select>
                  @if (f['categoriaId'].invalid && f['categoriaId'].touched) {
                    <div class="invalid-feedback" role="alert">Categoría requerida.</div>
                  }
                </div>
                <!-- Nombre -->
                <div class="mb-3">
                  <label for="pNom" class="form-label fw-semibold" style="font-size:13px">Nombre *</label>
                  <input id="pNom" type="text" class="form-control" formControlName="nombre" placeholder="Seco de pollo"
                         [class.is-invalid]="f['nombre'].invalid && f['nombre'].touched">
                  @if (f['nombre'].invalid && f['nombre'].touched) {
                    <div class="invalid-feedback" role="alert">Nombre requerido.</div>
                  }
                </div>
                <!-- Descripción -->
                <div class="mb-3">
                  <label for="pDesc" class="form-label fw-semibold" style="font-size:13px">Descripción</label>
                  <textarea id="pDesc" class="form-control" formControlName="descripcion" rows="2"></textarea>
                </div>
                <!-- Precio + Stock -->
                <div class="row g-3 mb-3">
                  <div class="col-6">
                    <label for="pPrecio" class="form-label fw-semibold" style="font-size:13px">Precio (USD) *</label>
                    <input id="pPrecio" type="number" class="form-control" formControlName="precio" step="0.50" min="0" placeholder="8.50"
                           [class.is-invalid]="f['precio'].invalid && f['precio'].touched">
                    @if (f['precio'].invalid && f['precio'].touched) {
                      <div class="invalid-feedback" role="alert">Precio inválido.</div>
                    }
                  </div>
                  <div class="col-6">
                    <label for="pStock" class="form-label fw-semibold" style="font-size:13px">Stock</label>
                    <input id="pStock" type="number" class="form-control" formControlName="stock" min="0" placeholder="100">
                  </div>
                </div>
                <!-- Imagen -->
                <div class="mb-4">
                  <label for="pImgFile" class="form-label fw-semibold" style="font-size:13px">Imagen</label>
                  @if (previewImg()) {
                    <div class="mb-2 rounded-3 overflow-hidden" style="height:120px">
                      <img [src]="previewImg()" alt="Vista previa" style="width:100%;height:100%;object-fit:cover">
                    </div>
                  }
                  <input id="pImgFile" type="file" class="form-control" accept="image/*"
                         (change)="onFileChange($event)" style="font-size:13px">
                  <div class="form-text" style="font-size:11px">JPG, PNG o WebP. Se guarda embebida en la base de datos.</div>
                </div>
                <button type="submit" class="btn btn-dorado w-100 fw-semibold" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> Guardando... }
                  @else { {{ editando() ? 'Actualizar' : 'Agregar plato' }} }
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class PlatosAdminComponent implements OnInit {
  private fb    = inject(FormBuilder);
  private svc   = inject(PlatosService);
  private toast = inject(ToastService);

  platos     = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  loading    = signal(true);
  modalOpen  = signal(false);
  editando   = signal<Plato | null>(null);
  saving     = signal(false);
  previewImg = signal<string>('');

  platoForm = this.fb.group({
    categoriaId: ['' as string | number, Validators.required],
    nombre:      ['', Validators.required],
    descripcion: [''],
    precio:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock:       [100],
    imagenUrl:   ['']
  });
  get f() { return this.platoForm.controls; }

  ngOnInit(): void {
    this.svc.getCategorias().subscribe(c => this.categorias.set(c));
    this.load();
  }
  load(): void { this.loading.set(true); this.svc.getAll().subscribe({ next: p => { this.platos.set(p); this.loading.set(false); }, error: () => this.loading.set(false) }); }

  abrirModal(): void { this.editando.set(null); this.previewImg.set(''); this.platoForm.reset({ stock: 100 }); this.modalOpen.set(true); }
  editar(p: Plato): void {
    this.editando.set(p);
    this.previewImg.set(p.imagenUrl || '');
    this.platoForm.patchValue({ categoriaId: p.categoriaId, nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, stock: p.stock, imagenUrl: p.imagenUrl || '' });
    this.modalOpen.set(true);
  }
  cerrarModal(): void { this.modalOpen.set(false); this.editando.set(null); this.previewImg.set(''); }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      this.previewImg.set(base64);
      this.platoForm.patchValue({ imagenUrl: base64 });
    };
    reader.readAsDataURL(file);
  }

  guardar(): void {
    if (this.platoForm.invalid) { this.platoForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.platoForm.value;
    const data: CreatePlatoDto = { categoriaId: +v.categoriaId!, nombre: v.nombre!, descripcion: v.descripcion || undefined, precio: +v.precio!, stock: v.stock ?? 100, imagenUrl: v.imagenUrl || undefined };
    const req = this.editando()
      ? this.svc.update(this.editando()!.id, data)
      : this.svc.create(data);
    req.subscribe({
      next: () => { this.toast.success(this.editando() ? 'Plato actualizado' : 'Plato creado'); this.cerrarModal(); this.load(); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.error || 'Error'); this.saving.set(false); }
    });
  }

  eliminar(id: number): void {
    const p = this.platos().find(x => x.id === id);
    if (!confirm(`¿Eliminar "${p?.nombre}"? El plato dejará de aparecer en el menú.`)) return;
    this.svc.update(id, { disponible: false }).subscribe({
      next: () => {
        this.toast.success(`"${p?.nombre}" eliminado del menú`);
        this.platos.update(list => list.filter(x => x.id !== id));
      },
      error: () => this.toast.error('Error al eliminar el plato')
    });
  }
}
