import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly KEY = 'se_carrito';
  items = signal<CartItem[]>(this._load());

  count    = computed(() => this.items().reduce((s, i) => s + i.cantidad, 0));
  subtotal = computed(() => this.items().reduce((s, i) => s + i.precio * i.cantidad, 0));
  iva      = computed(() => this.subtotal() * 0.15);
  total    = computed(() => this.subtotal() + this.iva());

  add(plato: { id: number; nombre: string; precio: number }, ingredientesRemovidos: number[] = []): void {
    const items = [...this.items()];
    const found = items.find(i => i.id === plato.id);
    if (found) {
      found.cantidad++;
      if (!found.ingredientesRemovidos?.length && ingredientesRemovidos.length) {
        found.ingredientesRemovidos = ingredientesRemovidos;
      }
    } else {
      items.push({
        id: plato.id, nombre: plato.nombre, precio: Number(plato.precio), cantidad: 1,
        ...(ingredientesRemovidos.length ? { ingredientesRemovidos } : {})
      });
    }
    this._save(items);
  }
  inc(id: number): void { this._mutate(id, i => i.cantidad++); }
  dec(id: number): void { const items = this.items().map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i).filter(i => i.cantidad > 0); this._save(items); }
  remove(id: number): void { this._save(this.items().filter(i => i.id !== id)); }
  clear(): void { this._save([]); }

  private _mutate(id: number, fn: (i: CartItem) => void): void {
    const items = this.items().map(i => { if (i.id === id) { const copy = { ...i }; fn(copy); return copy; } return i; });
    this._save(items);
  }
  private _save(items: CartItem[]): void { localStorage.setItem(this.KEY, JSON.stringify(items)); this.items.set(items); }
  private _load(): CartItem[] { try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; } }
}
