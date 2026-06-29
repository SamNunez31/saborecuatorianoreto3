const prisma = require('../prisma');

const IngredienteModel = {
  getAll() {
    return prisma.ingrediente.findMany({
      include: {
        unidad: true,
        proveedores: { include: { proveedor: true } }
      },
      orderBy: { nombre: 'asc' }
    });
  },

  updateStock(id, stock, stockMinimo, unidadId) {
    return prisma.ingrediente.update({
      where: { id: parseInt(id) },
      data: {
        stock:       parseInt(stock),
        stockMinimo: stockMinimo != null ? parseInt(stockMinimo) : undefined,
        unidadId:    unidadId != null ? parseInt(unidadId) : undefined
      }
    });
  },

  getAlertas() {
    return prisma.$queryRaw`
      SELECT * FROM ingredientes WHERE stock <= stock_minimo
    `;
  },

  create(data) {
    return prisma.ingrediente.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo || 'base',
        stock: 0,
        stockMinimo: 5
      }
    });
  }
};

module.exports = IngredienteModel;
