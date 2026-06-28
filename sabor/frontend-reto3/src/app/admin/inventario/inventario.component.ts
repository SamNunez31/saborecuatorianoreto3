import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngredientesService } from '../../core/services/api.services';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-0" style="font-family:var(--se-serif)">Inventario</h2>
        <p class="text-muted mb-0" style="font-size:14px">Stock de ingredientes</p>
      </div>
    </div>

    @if (alertas().length) {
      <div class="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
        <span style="font-size:20px">⚠️</span>
        <span><strong>{{ alertas().length }} ingrediente(s) con stock bajo.</strong> Revisa la tabla.</span>
      </div>
    }

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead style="background:#f8f5f0">
            <tr>
              <th>Ingrediente</th>
              <th>Tipo</th>
              <th>Unidad</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="6" class="text-center py-4 text-muted">Cargando...</td></tr>
            }
            @for (ing of ingredientes(); track ing.id) {
              <tr [class.table-danger]="ing.stock <= ing.stockMinimo">
                <td class="fw-semibold">{{ ing.nombre }}</td>
                <td><span class="badge bg-secondary">{{ ing.tipo || 'base' }}</span></td>
                <td>{{ ing.unidad }}</td>
                <td>
                  @if (editando()?.id === ing.id) {
                    <input type="number" class="form-control form-control-sm" style="width:80px"
                           [(ngModel)]="editando()!.stock" min="0">
                  } @else {
                    <span [class.text-danger]="ing.stock <= ing.stockMinimo" class="fw-bold">
                      {{ ing.stock }}
                    </span>
                  }
                </td>
                <td>
                  @if (editando()?.id === ing.id) {
                    <input type="number" class="form-control form-control-sm" style="width:80px"
                           [(ngModel)]="editando()!.stockMinimo" min="0">
                  } @else {
                    {{ ing.stockMinimo }}
                  }
                </td>
                <td>
                  @if (editando()?.id === ing.id) {
                    <select class="form-select form-select-sm" style="width:100px" [(ngModel)]="editando()!.unidad">
                      <option value="unidad">unidad</option>
                      <option value="kg">kg</option>
                      <option value="litros">litros</option>
                      <option value="gramos">gramos</option>
                      <option value="ml">ml</option>
                    </select>
                  } @else {
                    {{ ing.unidad }}
                  }
                </td>
                <td>
                  @if (ing.stock <= ing.stockMinimo) {
                    <span class="badge bg-danger">Stock bajo</span>
                  } @else {
                    <span class="badge bg-success">OK</span>
                  }
                </td>
                <td>
                  @if (editando()?.id === ing.id) {
                    <button class="btn btn-sm btn-success me-1" (click)="guardar()">Guardar</button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="editando.set(null)">Cancelar</button>
                  } @else {
                    <button class="btn btn-sm btn-outline-primary" (click)="editar(ing)">Editar stock</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class InventarioComponent implements OnInit {
  private svc = inject(IngredientesService);

  ingredientes = signal<any[]>([]);
  loading      = signal(true);
  editando     = signal<any>(null);

  alertas = computed(() => this.ingredientes().filter(i => i.stock <= i.stockMinimo));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: d => { this.ingredientes.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  editar(ing: any) {
    this.editando.set({ ...ing });
  }

  guardar() {
    const e = this.editando();
    if (!e) return;
    this.svc.updateStock(e.id, e.stock, e.stockMinimo, e.unidad).subscribe({
      next: () => { this.load(); this.editando.set(null); },
      error: () => alert('Error al guardar')
    });
  }
}
