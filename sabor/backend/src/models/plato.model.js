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
    const payload = {
      categoriaId: +data.categoriaId,
      nombre:      data.nombre,
      descripcion: data.descripcion,
      precio:      +data.precio,
      imagenUrl:   data.imagenUrl,
      disponible:  true
    };

    if (data.ingredientes && data.ingredientes.length > 0) {
      payload.platoIngredientes = {
        create: data.ingredientes.map(i => ({
          ingredienteId: +i.ingredienteId,
          esRemovible: i.esRemovible !== undefined ? i.esRemovible : true
        }))
      };
    }

    return prisma.plato.create({ data: payload });
  },

  update(id, data) {
    const payload = {
      nombre:      data.nombre,
      descripcion: data.descripcion,
      precio:      data.precio != null ? +data.precio : undefined,
      disponible:  data.disponible,
      categoriaId: data.categoriaId ? +data.categoriaId : undefined,
      imagenUrl:   data.imagenUrl
    };

    if (data.ingredientes) {
      payload.platoIngredientes = {
        deleteMany: {},
        create: data.ingredientes.map(i => ({
          ingredienteId: +i.ingredienteId,
          esRemovible: i.esRemovible !== undefined ? i.esRemovible : true
        }))
      };
    }

    return prisma.plato.update({
      where: { id: parseInt(id) },
      data: payload
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
