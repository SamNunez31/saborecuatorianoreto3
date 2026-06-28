const prisma = require('../prisma');

const IngredienteModel = {
  getAll() {
    return prisma.ingrediente.findMany({
      include: {
        proveedores: {
          include: { proveedor: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  },

  updateStock(id, stock, stockMinimo) {
    return prisma.ingrediente.update({
      where: { id: parseInt(id) },
      data: {
        stock:       parseInt(stock),
        stockMinimo: stockMinimo != null ? parseInt(stockMinimo) : undefined
      }
    });
  },

  getAlertas() {
    return prisma.$queryRaw`
      SELECT * FROM ingredientes WHERE stock <= stock_minimo
    `;
  }
};

module.exports = IngredienteModel;
