const prisma = require('../prisma');

const MesaModel = {
  getAll() {
    return prisma.mesa.findMany({
      include: {
        pedidos: {
          where: { estado: { in: ['pendiente', 'en_preparacion', 'listo'] } },
          orderBy: { fechaPedido: 'desc' },
          take: 1,
          include: { factura: { select: { numeroFactura: true } } }
        }
      },
      orderBy: { numero: 'asc' }
    });
  },

  updateEstado(id, estado) {
    return prisma.mesa.update({ where: { id: parseInt(id) }, data: { estado } });
  }
};

module.exports = MesaModel;
