const ClienteModel = require('../models/cliente.model');
const prisma = require('../prisma');

const getDashboard = async (req, res, next) => {
  try {
    const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

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

    let platoPrincipal = null;
    if (topPlatoData.length > 0) {
      const p = await prisma.plato.findUnique({ where: { id: topPlatoData[0].platoId }, select: { nombre: true } });
      platoPrincipal = { nombre: p?.nombre || '—', cantidad: Number(topPlatoData[0]._sum.cantidad || 0) };
    }

    let horaPico = null;
    if (pedidosDelDia.length > 0) {
      const conteo = {};
      pedidosDelDia.forEach(p => { const h = new Date(p.fechaPedido).getHours(); conteo[h] = (conteo[h] || 0) + 1; });
      const [hora] = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
      horaPico = `${hora}:00 – ${+hora + 1}:00`;
    }

    res.json({
      ventasHoy:        Number(ventasHoyData._sum.total || 0),
      pedidosHoy:       ventasHoyData._count,
      pedidosPendientes,
      totalClientes,
      totalPlatos,
      platoPrincipal,
      horaPico
    });
  } catch (e) { next(e); }
};

const getClientes = async (req, res, next) => {
  try {
    res.json(await ClienteModel.getAll());
  } catch (e) { next(e); }
};

const generarRecomendacionesLocales = (topPlatos, platoMap, ventasHoy, pedidosHoy) => {
  const recs = [];
  const hora = new Date().getHours();

  if (topPlatos.length > 0) {
    const top = platoMap[topPlatos[0].platoId];
    const unidades = topPlatos[0]._sum.cantidad;
    recs.push({
      titulo: `Impulsa "${top?.nombre || 'tu plato estrella'}"`,
      descripcion: `Es el más pedido hoy con ${unidades} unidades vendidas. Destácalo en la parte superior del menú digital y asegura stock suficiente para el resto del día.`
    });
  } else {
    recs.push({
      titulo: 'Activa el tráfico temprano',
      descripcion: 'Aún no hay ventas registradas hoy. Considera publicar en redes sociales o enviar notificaciones a clientes habituales para generar los primeros pedidos del día.'
    });
  }

  if (ventasHoy === 0) {
    recs.push({
      titulo: 'Lanza una promoción de apertura',
      descripcion: 'Ofrece un descuento del 10% en el primer pedido del día o combina un plato principal con bebida a precio especial para arrancar las ventas.'
    });
  } else if (ventasHoy < 50) {
    recs.push({
      titulo: 'Combo de mediodía para aumentar ticket',
      descripcion: `Con $${ventasHoy.toFixed(2)} en ventas, un combo almuerzo (plato + bebida + postre) puede subir el ticket promedio y atraer más clientes en hora pico.`
    });
  } else {
    recs.push({
      titulo: `Buen ritmo: $${ventasHoy.toFixed(2)} hoy`,
      descripcion: `Con ${pedidosHoy} pedidos completados, el restaurante opera bien. Monitorea los tiempos de entrega para mantener la satisfacción del cliente en hora de mayor demanda.`
    });
  }

  if (hora >= 14 && hora < 17) {
    recs.push({
      titulo: 'Hora baja: aprovecha para preparar',
      descripcion: 'La tarde es el momento ideal para revisar inventario, preparar mise en place y capacitar al equipo para el servicio nocturno. Un restaurante preparado sirve más rápido.'
    });
  } else if (topPlatos.length >= 3) {
    const nombres = topPlatos.slice(0, 3).map(p => platoMap[p.platoId]?.nombre).filter(Boolean);
    recs.push({
      titulo: 'Optimiza tu top 3',
      descripcion: `${nombres.join(', ')} concentran la mayoría de pedidos. Garantiza que estos platos tengan el menor tiempo de preparación posible para mejorar rotación y ventas.`
    });
  } else {
    recs.push({
      titulo: 'Diversifica las ventas',
      descripcion: 'Pocos platos registran pedidos hoy. Sugiere alternativas a los clientes al momento de ordenar o usa el chat/WhatsApp para recomendar platos menos pedidos.'
    });
  }

  return recs.slice(0, 3);
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

    const ventasHoy  = Number(ventasDia._sum.total || 0);
    const pedidosHoy = ventasDia._count;

    let recomendaciones = [];
    let fuente = 'local';

    if (process.env.GROQ_API_KEY) {
      try {
        const topStr = topPlatos.map((p, i) =>
          `${i + 1}. ${platoMap[p.platoId]?.nombre || 'Plato #' + p.platoId} — ${p._sum.cantidad} unidades`
        ).join('\n');

        const prompt = `Eres consultor de restaurantes ecuatorianos. Datos de hoy en "Sabor Ecuatoriano":
Top platos: ${topStr || 'Sin ventas aún.'}
Ventas: $${ventasHoy.toFixed(2)} | Pedidos: ${pedidosHoy}
Da exactamente 3 recomendaciones accionables. Solo JSON, sin texto extra:
[{"titulo":"título corto","descripcion":"máximo 2 oraciones"}]`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 500 })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content  = groqData.choices?.[0]?.message?.content || '';
          const jsonMatch = content.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              recomendaciones = parsed;
              fuente = 'groq';
            }
          }
        }
      } catch (_) { /* si Groq falla, continúa con recomendaciones locales */ }
    }

    if (recomendaciones.length === 0) {
      recomendaciones = generarRecomendacionesLocales(topPlatos, platoMap, ventasHoy, pedidosHoy);
    }

    res.json({ recomendaciones, fuente });
  } catch (e) { next(e); }
};

module.exports = { getDashboard, getClientes, getRecomendaciones };
