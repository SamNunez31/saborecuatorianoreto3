const prisma = require('../prisma');

const UnidadModel = {
  getAll() {
    return prisma.unidadMedida.findMany({ orderBy: { nombre: 'asc' } });
  }
};

module.exports = UnidadModel;
