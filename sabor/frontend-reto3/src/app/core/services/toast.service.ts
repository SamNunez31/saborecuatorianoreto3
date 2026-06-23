import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private _next = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 3500): void {
    const id = ++this._next;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.remove(id), duration);
  }
  success(m: string): void { this.show(m, 'success'); }
  error(m: string):   void { this.show(m, 'error'); }
  info(m: string):    void { this.show(m, 'info'); }
  remove(id: number): void { this.toasts.update(t => t.filter(x => x.id !== id)); }
}
