import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlatosService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Plato, CategoriaPlato, CreatePlatoDto } from '../../core/models';

const SUPABASE_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJremNybHN0cG5yYXBxbWRudmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NzUwNDMsImV4cCI6MjA5NjQ1MTA0M30.uI0qF8dhPjcNmu2wQI_oIbH_4rXRnQJ6rylQgmEQdCQ';
const SUPABASE_UPLOAD = 'https://bkzcrlstpnrapqmdnvdn.supabase.co/storage/v1/object/platos/';
const SUPABASE_PUBLIC = 'https://bkzcrlstpnrapqmdnvdn.supabase.co/storage/v1/object/public/platos/';

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

      <!-- BÚSQUEDA -->
      <div class="mb-3">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input type="text" class="form-control border-start-0" placeholder="Buscar plato por nombre..."
                 [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" aria-label="Buscar plato">
        </div>
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
            @for (p of platosFiltrados(); track p.id) {
              <tr>
                <td class="fw-semibold">{{ p.nombre }}</td>
                <td><span class="badge text-bg-secondary">{{ p.categoria?.nombre }}</span></td>
                <td class="fw-bold text-success">{{ p.precio | currency:'USD' }}</td>
                <td>@if (p.disponible) { <i class="bi bi-check-circle-fill text-success"></i> }</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary rounded-pill me-2 px-3" (click)="editar(p)" aria-label="Editar plato">
                    <i class="bi bi-pencil me-1"></i>Editar
                  </button>
                  <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="eliminar(p.id)" aria-label="Eliminar plato">
                    <i class="bi bi-trash me-1"></i>Eliminar
                  </button>
                </td>
              </tr>
            }
            @if (!loading() && platosFiltrados().length === 0) {
              <tr><td colspan="5" class="text-center py-5 text-muted">
                {{ busqueda() ? 'No se encontraron platos con "' + busqueda() + '".' : 'Sin platos disponibles.' }}
              </td></tr>
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
                <!-- Precio -->
                <div class="mb-3">
                  <label for="pPrecio" class="form-label fw-semibold" style="font-size:13px">Precio (USD) *</label>
                  <input id="pPrecio" type="number" class="form-control" formControlName="precio" step="0.50" min="0" placeholder="8.50"
                         [class.is-invalid]="f['precio'].invalid && f['precio'].touched">
                  @if (f['precio'].invalid && f['precio'].touched) {
                    <div class="invalid-feedback" role="alert">Precio inválido.</div>
                  }
                </div>
                <!-- Imagen -->
                <div class="mb-4">
                  <label class="form-label fw-semibold" style="font-size:13px">Imagen</label>
                  @if (f['imagenUrl'].value) {
                    <div class="mb-2 rounded-3 overflow-hidden" style="height:120px">
                      <img [src]="f['imagenUrl'].value" alt="Vista previa" style="width:100%;height:100%;object-fit:cover"
                           (error)="f['imagenUrl'].setValue('')">
                    </div>
                  }
                  <input id="pImgFile" type="file" class="form-control mb-2" accept=".jpg,.jpeg,.png,.webp"
                         (change)="onFileChange($event)" [disabled]="uploading()" style="font-size:13px">
                  @if (uploading()) {
                    <div class="text-muted" style="font-size:12px"><span class="spinner-border spinner-border-sm me-1"></span>Subiendo imagen...</div>
                  }
                  @if (uploadError()) {
                    <div class="text-danger" style="font-size:12px" role="alert">{{ uploadError() }}</div>
                  }
                  <div class="form-text" style="font-size:11px">JPG, PNG o WebP. Máximo 1 MB.</div>
                </div>
                <button type="submit" class="btn btn-dorado w-100 fw-semibold" [disabled]="saving() || uploading()">
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
  uploading  = signal(false);
  uploadError = signal('');
  busqueda   = signal('');

  platosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    return q ? this.platos().filter(p => p.nombre.toLowerCase().includes(q)) : this.platos();
  });

  platoForm = this.fb.group({
    categoriaId: ['' as string | number, Validators.required],
    nombre:      ['', Validators.required],
    descripcion: [''],
    precio:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    imagenUrl:   ['']
  });
  get f() { return this.platoForm.controls; }

  ngOnInit(): void {
    this.svc.getCategorias().subscribe(c => this.categorias.set(c));
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: p => { this.platos.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  abrirModal(): void { this.editando.set(null); this.uploadError.set(''); this.platoForm.reset(); this.modalOpen.set(true); }
  editar(p: Plato): void {
    this.editando.set(p);
    this.uploadError.set('');
    this.platoForm.patchValue({ categoriaId: p.categoriaId, nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, imagenUrl: p.imagenUrl || '' });
    this.modalOpen.set(true);
  }
  cerrarModal(): void { this.modalOpen.set(false); this.editando.set(null); this.uploadError.set(''); }

  async onFileChange(e: Event): Promise<void> {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { this.uploadError.set('La imagen no puede superar 1 MB.'); return; }
    this.uploadError.set('');
    this.uploading.set(true);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    try {
      const res = await fetch(`${SUPABASE_UPLOAD}${fileName}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
        body: file
      });
      if (!res.ok) throw new Error();
      this.platoForm.patchValue({ imagenUrl: `${SUPABASE_PUBLIC}${fileName}` });
    } catch {
      this.uploadError.set('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      this.uploading.set(false);
    }
  }

  guardar(): void {
    if (this.platoForm.invalid) { this.platoForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.platoForm.value;
    const data: CreatePlatoDto = { categoriaId: +v.categoriaId!, nombre: v.nombre!, descripcion: v.descripcion || undefined, precio: +v.precio!, imagenUrl: v.imagenUrl || undefined };
    const req = this.editando()
      ? this.svc.update(this.editando()!.id, data)
      : this.svc.create(data);
    req.subscribe({
      next: () => { this.toast.success(this.editando() ? 'Plato actualizado' : 'Plato creado'); this.cerrarModal(); this.load(); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.error || 'No se pudo guardar el plato. Intenta de nuevo.'); this.saving.set(false); }
    });
  }

  eliminar(id: number): void {
    const p = this.platos().find(x => x.id === id);
    if (!confirm(`¿Eliminar "${p?.nombre}"? El plato dejará de aparecer en el menú.`)) return;
    this.svc.update(id, { disponible: false }).subscribe({
      next: () => { this.toast.success(`"${p?.nombre}" eliminado del menú`); this.platos.update(list => list.filter(x => x.id !== id)); },
      error: () => this.toast.error('Error al eliminar el plato')
    });
  }
}
