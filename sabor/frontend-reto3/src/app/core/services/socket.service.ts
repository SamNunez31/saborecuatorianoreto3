import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  
  // Señales reactivas para que los componentes se suscriban
  public nuevoPedido = signal<any>(null);
  public pedidoActualizado = signal<any>(null);

  constructor() {
    // Inicializar conexión (usando la baseUrl de environment)
    const baseUrl = environment.apiUrl.replace('/api', '');
    this.socket = io(baseUrl, {
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado al WebSocket del servidor');
    });

    this.socket.on('nuevo-pedido', (pedido) => {
      console.log('🔔 Nuevo pedido recibido:', pedido);
      this.nuevoPedido.set(pedido);
    });

    this.socket.on('pedido-actualizado', (pedido) => {
      console.log('🔔 Pedido actualizado:', pedido);
      this.pedidoActualizado.set(pedido);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del WebSocket');
    });
  }
}
