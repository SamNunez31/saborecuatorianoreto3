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

  private getCustomKey(id: number, ingredientesRemovidos: number[] = []): string {
    const sorted = [...ingredientesRemovidos].sort((a, b) => a - b);
    return `${id}_${sorted.join('-')}`;
  }

  add(plato: { id: number; nombre: string; precio: number }, ingredientesRemovidos: number[] = [], nombresRemovidos: string[] = []): void {
    const items = [...this.items()];
    const key = this.getCustomKey(plato.id, ingredientesRemovidos);
    const found = items.find(i => (i.customKey || this.getCustomKey(i.id, i.ingredientesRemovidos || [])) === key);
    if (found) {
      found.cantidad++;
    } else {
      items.push({
        id: plato.id,
        nombre: plato.nombre,
        precio: Number(plato.precio),
        cantidad: 1,
        ingredientesRemovidos: [...ingredientesRemovidos].sort((a, b) => a - b),
        nombresRemovidos: [...nombresRemovidos],
        customKey: key
      });
    }
    this._save(items);
  }

  inc(idOrKey: number | string): void {
    const key = typeof idOrKey === 'number' ? this.getCustomKey(idOrKey) : idOrKey;
    this._mutate(key, i => i.cantidad++);
  }

  dec(idOrKey: number | string): void {
    const key = typeof idOrKey === 'number' ? this.getCustomKey(idOrKey) : idOrKey;
    const items = this.items()
      .map(i => {
        const itemKey = i.customKey || this.getCustomKey(i.id, i.ingredientesRemovidos);
        return itemKey === key ? { ...i, cantidad: i.cantidad - 1 } : i;
      })
      .filter(i => i.cantidad > 0);
    this._save(items);
  }

  remove(idOrKey: number | string): void {
    const key = typeof idOrKey === 'number' ? this.getCustomKey(idOrKey) : idOrKey;
    this._save(this.items().filter(i => (i.customKey || this.getCustomKey(i.id, i.ingredientesRemovidos)) !== key));
  }

  clear(): void { this._save([]); }

  private _mutate(key: string, fn: (i: CartItem) => void): void {
    const items = this.items().map(i => {
      const itemKey = i.customKey || this.getCustomKey(i.id, i.ingredientesRemovidos);
      if (itemKey === key) {
        const copy = { ...i };
        fn(copy);
        return copy;
      }
      return i;
    });
    this._save(items);
  }

  private _save(items: CartItem[]): void { localStorage.setItem(this.KEY, JSON.stringify(items)); this.items.set(items); }

  private _load(): CartItem[] {
    try {
      const items = JSON.parse(localStorage.getItem(this.KEY) || '[]');
      return items.map((i: any) => ({
        ...i,
        customKey: i.customKey || this.getCustomKey(i.id, i.ingredientesRemovidos)
      }));
    } catch (e) {
      console.error('Error loading cart:', e);
      return [];
    }
  }
}
