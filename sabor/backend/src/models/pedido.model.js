const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PedidoModel = {
  create(clienteId, { items, tipoEntrega, observaciones, mesaId }, mapa) {
    return prisma.pedido.create({
      data: {
        clienteId,
        tipoEntrega,
        observaciones,
        mesaId: mesaId ? parseInt(mesaId) : null,
        detalles: {
          create: items.map(i => ({
            platoId:        i.platoId,
            cantidad:       i.cantidad,
            precioUnitario: mapa[i.platoId].precio,
            nota:           i.nota || null,
            ...(i.ingredientesRemovidos?.length ? {
              detalleIngredientes: {
                create: i.ingredientesRemovidos.map(ingredienteId => ({
                  ingredienteId: parseInt(ingredienteId),
                  accion: 'quitar'
                }))
              }
            } : {})
          }))
        }
      },
      include: { detalles: { include: { plato: true } }, cliente: true }
    });
  },

  getByClienteId(clienteId) {
    return prisma.pedido.findMany({
      where: { clienteId },
      include: {
        cliente:  { select: { nombre: true, apellido: true, direccion: true } },
        detalles: { include: { plato: true } },
        factura:  { include: { pagos: { include: { formaPago: true } } } }
      },
      orderBy: { fechaPedido: 'desc' }
    });
  },

  getAll() {
    return prisma.pedido.findMany({
      include: { cliente: true, detalles: { include: { plato: true } }, factura: true },
      orderBy: { fechaPedido: 'desc' }
    });
  },

  updateEstado(id, estado) {
    return prisma.pedido.update({ where: { id: parseInt(id) }, data: { estado } });
  },

  getById(id) {
    return prisma.pedido.findUnique({ where: { id: parseInt(id) } });
  }
};

module.exports = PedidoModel;
