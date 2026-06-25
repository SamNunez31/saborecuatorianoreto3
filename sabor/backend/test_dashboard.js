require('dotenv').config();
const prisma = require('./src/prisma');

async function test() {
  try {
    const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    console.log('Fechas:', { hoy, manana });

    const [ventasHoyData, pedidosPendientes, totalClientes, totalPlatos, topPlatoData, pedidosDelDia] = await Promise.all([
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: hoy, lt: manana }, estado: { not: 'anulada' } },
        _sum: { total: true }, _count: true
      }),
      prisma.pedido.count({ where: { estado: { in: ['pendiente', 'en_preparacion'] } } }),
      prisma.cliente.count(),
      prisma.plato.count({ where: { disponible: true } }),
      prisma.detallePedido.groupBy({
        by: ['platoId'],
        where: { pedido: { fechaPedido: { gte: hoy, lt: manana } } },
        _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 1
      }),
      prisma.pedido.findMany({
        where: { fechaPedido: { gte: hoy, lt: manana } },
        select: { fechaPedido: true }
      })
    ]);

    console.log('Resultados:', {
      ventasHoyData,
      pedidosPendientes,
      totalClientes,
      totalPlatos,
      topPlatoData,
      pedidosDelDia
    });
  } catch (e) {
    console.error('Error durante la consulta:', e);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
