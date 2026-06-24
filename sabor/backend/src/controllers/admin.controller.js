const ClienteModel = require('../models/cliente.model');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboard = async (req, res, next) => {
  try {
    const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    const [ventasHoy, pedidosPendientes, totalClientes, totalPlatos] = await Promise.all([
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: hoy, lt: manana }, estado: { not: 'anulada' } },
        _sum: { total: true }, _count: true
      }),
      prisma.pedido.count({ where: { estado: { in: ['pendiente', 'en_preparacion'] } } }),
      prisma.cliente.count(),
      prisma.plato.count({ where: { disponible: true } })
    ]);

    res.json({
      ventasHoy:        Number(ventasHoy._sum.total || 0),
      pedidosHoy:       ventasHoy._count,
      pedidosPendientes,
      totalClientes,
      totalPlatos
    });
  } catch (e) { next(e); }
};

const getClientes = async (req, res, next) => {
  try {
    res.json(await ClienteModel.getAll());
  } catch (e) { next(e); }
};

const getRecomendaciones = async (req, res, next) => {
  try {
    const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    const [topPlatos, ventasDia] = await Promise.all([
      prisma.detallePedido.groupBy({
        by: ['platoId'], _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: 'desc' } }, take: 5
      }),
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: hoy, lt: manana }, estado: { not: 'anulada' } },
        _sum: { total: true }, _count: true
      })
    ]);

    const platoIds = topPlatos.map(p => p.platoId);
    const platos   = await prisma.plato.findMany({ where: { id: { in: platoIds } }, select: { id: true, nombre: true, precio: true } });
    const platoMap = Object.fromEntries(platos.map(p => [p.id, p]));

    const topStr = topPlatos.map((p, i) =>
      `${i + 1}. ${platoMap[p.platoId]?.nombre || 'Plato #' + p.platoId} — ${p._sum.cantidad} unidades, $${platoMap[p.platoId]?.precio || '?'} c/u`
    ).join('\n');

    const ventasHoy  = Number(ventasDia._sum.total || 0);
    const pedidosHoy = ventasDia._count;

    const prompt = `Eres un consultor experto en restaurantes ecuatorianos. Analiza estos datos del restaurante "Sabor Ecuatoriano":

Top 5 platos más vendidos hoy:
${topStr || 'Sin ventas registradas aún hoy.'}

Ventas del día: $${ventasHoy.toFixed(2)}
Pedidos del día: ${pedidosHoy}

Genera exactamente 3 recomendaciones concretas y accionables para mejorar las ventas o la operación del restaurante.
Responde ÚNICAMENTE con un JSON array válido, sin markdown, sin texto adicional:
[{"titulo":"título corto","descripcion":"descripción concreta en máximo 2 oraciones"}]`;

    let recomendaciones = [];
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 600 })
      });
      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content  = groqData.choices?.[0]?.message?.content || '[]';
        const match    = content.match(/\[[\s\S]*\]/);
        if (match) recomendaciones = JSON.parse(match[0]);
      }
    } catch (_) { /* si Groq falla devolvemos array vacío */ }

    res.json({ recomendaciones });
  } catch (e) { next(e); }
};

module.exports = { getDashboard, getClientes, getRecomendaciones };
