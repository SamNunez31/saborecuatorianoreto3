const prisma = require('../prisma');

const FacturaModel = {
  getAll() {
    return prisma.factura.findMany({
      include: { 
        pedido: { include: { cliente: true, detalles: { include: { plato: true, detalleIngredientes: { include: { ingrediente: true } } } } } }, 
        pagos: { include: { formaPago: true } } 
      },
      orderBy: { fechaEmision: 'desc' }
    });
  },

  getById(id) {
    return prisma.factura.findUnique({
      where: { id: parseInt(id) },
      include: {
        pedido: { include: { cliente: true, detalles: { include: { plato: true } } } },
        pagos:  { include: { formaPago: true, tarjeta: true } }
      }
    });
  },

  async getVentasDia() {
    const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    const facturas = await prisma.factura.findMany({
      where:   { fechaEmision: { gte: hoy, lt: manana }, estado: { not: 'anulada' } },
      include: { pedido: { include: { cliente: true } }, pagos: { include: { formaPago: true } } },
      orderBy: { fechaEmision: 'desc' }
    });

    const totalDia    = facturas.reduce((s, f) => s + Number(f.total), 0);
    const totalIva    = facturas.reduce((s, f) => s + Number(f.iva), 0);
    const cantPedidos = facturas.length;

    return { facturas, resumen: { totalDia, totalIva, cantPedidos } };
  },

  create(pedidoId, { numeroFactura, subtotal, iva, total }) {
    return prisma.factura.create({ data: { pedidoId, numeroFactura, subtotal, iva, total } });
  },

  count() {
    return prisma.factura.count();
  }
};

module.exports = FacturaModel;
