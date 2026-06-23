import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-fixed d-flex flex-column gap-2" aria-live="polite" aria-atomic="true">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast show align-items-center border-0 shadow"
             [class.text-bg-success]="t.type === 'success'"
             [class.text-bg-danger] ="t.type === 'error'"
             [class.text-bg-dark]   ="t.type === 'info'"
             role="status" style="min-width:260px;animation:slideIn .3s ease">
          <div class="d-flex">
            <div class="toast-body fw-medium">{{ t.message }}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    (click)="toast.remove(t.id)" aria-label="Cerrar notificación"></button>
          </div>
        </div>
      }
    </div>
    <style>
      @keyframes slideIn { from { transform:translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }
    </style>
  `
})
export class ToastContainerComponent {
  toast = inject(ToastService);
}
