import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/api.services';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-clientes-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div><h1 style="font-family:var(--se-serif);font-size:1.8rem">Clientes</h1><p class="text-muted">Clientes registrados</p></div>
        <button class="btn btn-dorado btn-sm" (click)="load()">↻ Actualizar</button>
      </div>
      @if (loading()) { <div class="text-center py-5"><div class="spinner-border" style="color:var(--se-dorado)"></div></div> }
      <div class="table-sabor table-responsive rounded-4 border shadow-sm">
        <table class="table table-hover mb-0">
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Cédula</th><th>Pedidos</th><th>Registro</th></tr></thead>
          <tbody aria-live="polite">
            @for (c of clientes(); track c.id) {
              <tr>
                <td class="fw-semibold">{{ c.nombre }} {{ c.apellido }}</td>
                <td>{{ c.usuario?.email || '—' }}</td>
                <td>{{ c.telefono || '—' }}</td>
                <td>{{ c.cedula || '—' }}</td>
                <td><span class="badge badge-pagada">{{ c._count?.pedidos || 0 }}</span></td>
                <td style="font-size:13px">{{ c.createdAt | date:'dd/MM/yyyy' }}</td>
              </tr>
            }
            @if (!loading() && clientes().length === 0) {
              <tr><td colspan="6" class="text-center py-5 text-muted">Sin clientes.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ClientesAdminComponent implements OnInit {
  private svc = inject(AdminService);
  clientes = signal<Cliente[]>([]);
  loading  = signal(true);
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.svc.getClientes().subscribe({ next: c => { this.clientes.set(c); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
