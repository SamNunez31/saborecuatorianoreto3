import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  const platoA = { id: 1, nombre: 'Seco de pollo',  precio: 9.50 };
  const platoB = { id: 2, nombre: 'Caldo de gallina', precio: 7.00 };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
    localStorage.clear();
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('items() debe estar vacío al iniciar', () => {
    expect(service.items()).toEqual([]);
  });

  it('count() debe ser 0 al iniciar', () => {
    expect(service.count()).toBe(0);
  });

  it('add() debe agregar un plato al carrito', () => {
    service.add(platoA);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].nombre).toBe('Seco de pollo');
    expect(service.items()[0].cantidad).toBe(1);
  });

  it('add() del mismo plato debe incrementar cantidad', () => {
    service.add(platoA);
    service.add(platoA);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].cantidad).toBe(2);
  });

  it('count() debe reflejar la suma de cantidades', () => {
    service.add(platoA);
    service.add(platoA);
    service.add(platoB);
    expect(service.count()).toBe(3);
  });

  it('subtotal() debe calcular correctamente', () => {
    service.add(platoA);
    service.add(platoA);
    service.add(platoB);
    // 9.50*2 + 7.00*1 = 26.00
    expect(service.subtotal()).toBeCloseTo(26.00, 2);
  });

  it('iva() debe ser el 15% del subtotal', () => {
    service.add(platoA);
    expect(service.iva()).toBeCloseTo(9.50 * 0.15, 2);
  });

  it('total() debe ser subtotal + iva', () => {
    service.add(platoA);
    expect(service.total()).toBeCloseTo(service.subtotal() + service.iva(), 2);
  });

  it('inc() debe aumentar la cantidad de un plato', () => {
    service.add(platoA);
    service.inc(platoA.id);
    expect(service.items()[0].cantidad).toBe(2);
  });

  it('dec() debe disminuir la cantidad de un plato', () => {
    service.add(platoA);
    service.add(platoA);
    service.dec(platoA.id);
    expect(service.items()[0].cantidad).toBe(1);
  });

  it('dec() con cantidad 1 debe eliminar el plato del carrito', () => {
    service.add(platoA);
    service.dec(platoA.id);
    expect(service.items().length).toBe(0);
  });

  it('remove() debe eliminar un plato específico', () => {
    service.add(platoA);
    service.add(platoB);
    service.remove(platoA.id);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].id).toBe(platoB.id);
  });

  it('clear() debe vaciar el carrito', () => {
    service.add(platoA);
    service.add(platoB);
    service.clear();
    expect(service.items()).toEqual([]);
    expect(service.count()).toBe(0);
  });

  it('debe persistir el carrito en localStorage', () => {
    service.add(platoA);
    const stored = JSON.parse(localStorage.getItem('se_carrito') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].nombre).toBe('Seco de pollo');
  });

  it('debe cargar el carrito desde localStorage al iniciar', () => {
    localStorage.setItem('se_carrito', JSON.stringify([{ id:1, nombre:'Seco de pollo', precio:9.50, cantidad:3 }]));
    const newService = TestBed.inject(CartService);
    expect(newService.items().length).toBe(1);
    expect(newService.count()).toBe(3);
  });
});
