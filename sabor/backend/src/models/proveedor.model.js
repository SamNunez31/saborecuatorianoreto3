const prisma = require('../prisma');

const ProveedorModel = {
  getAll() {
    return prisma.proveedor.findMany({
      where: { activo: true },
      include: {
        ingredientes: {
          include: { ingrediente: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  },

  getById(id) {
    return prisma.proveedor.findUnique({
      where: { id: parseInt(id) },
      include: {
        ingredientes: {
          include: { ingrediente: true }
        }
      }
    });
  },

  create(data) {
    return prisma.proveedor.create({
      data: {
        nombre:   data.nombre,
        contacto: data.contacto,
        telefono: data.telefono,
        email:    data.email,
        activo:   true
      }
    });
  },

  update(id, data) {
    return prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: {
        nombre:   data.nombre,
        contacto: data.contacto,
        telefono: data.telefono,
        email:    data.email
      }
    });
  },

  softDelete(id) {
    return prisma.proveedor.update({
      where: { id: parseInt(id) },
      data:  { activo: false }
    });
  },

  asignarIngrediente(proveedorId, ingredienteId, esPrincipal = false) {
    return prisma.proveedorIngrediente.upsert({
      where: {
        proveedorId_ingredienteId: {
          proveedorId:   parseInt(proveedorId),
          ingredienteId: parseInt(ingredienteId)
        }
      },
      update: { esPrincipal },
      create: {
        proveedorId:   parseInt(proveedorId),
        ingredienteId: parseInt(ingredienteId),
        esPrincipal
      }
    });
  },

  quitarIngrediente(proveedorId, ingredienteId) {
    return prisma.proveedorIngrediente.delete({
      where: {
        proveedorId_ingredienteId: {
          proveedorId:   parseInt(proveedorId),
          ingredienteId: parseInt(ingredienteId)
        }
      }
    });
  }
};

module.exports = ProveedorModel;
