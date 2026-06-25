const prisma = require('../prisma');

const PlatoModel = {
  getAll(categoriaId = null) {
    return prisma.plato.findMany({
      where: { disponible: true, ...(categoriaId ? { categoriaId: parseInt(categoriaId) } : {}) },
      include: {
        categoria: true,
        platoIngredientes: { include: { ingrediente: true }, orderBy: { id: 'asc' } }
      },
      orderBy: { nombre: 'asc' }
    });
  },

  getCategorias() {
    return prisma.categoriaPlato.findMany({ orderBy: { nombre: 'asc' } });
  },

  getById(id) {
    return prisma.plato.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        platoIngredientes: { include: { ingrediente: true }, orderBy: { id: 'asc' } }
      }
    });
  },

  create(data) {
    return prisma.plato.create({
      data: {
        categoriaId: +data.categoriaId,
        nombre:      data.nombre,
        descripcion: data.descripcion,
        precio:      +data.precio,
        imagenUrl:   data.imagenUrl,
        disponible:  true
      }
    });
  },

  update(id, data) {
    return prisma.plato.update({
      where: { id: parseInt(id) },
      data: {
        nombre:      data.nombre,
        descripcion: data.descripcion,
        precio:      data.precio != null ? +data.precio : undefined,
        disponible:  data.disponible,
        categoriaId: data.categoriaId ? +data.categoriaId : undefined,
        imagenUrl:   data.imagenUrl
      }
    });
  },

  softDelete(id) {
    return prisma.plato.update({
      where: { id: parseInt(id) },
      data:  { disponible: false }
    });
  }
};

module.exports = PlatoModel;
