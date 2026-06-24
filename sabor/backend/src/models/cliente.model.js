const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ClienteModel = {
  getAll() {
    return prisma.cliente.findMany({
      include: { usuario: { include: { rol: true } }, _count: { select: { pedidos: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  getById(id) {
    return prisma.cliente.findUnique({ where: { id: parseInt(id) } });
  },

  updatePerfil(clienteId, { nombre, apellido, telefono, direccion }) {
    return prisma.cliente.update({
      where: { id: clienteId },
      data:  { nombre, apellido, telefono, direccion }
    });
  }
};

module.exports = ClienteModel;
