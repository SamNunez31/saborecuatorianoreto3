// ── FACTURAS ─────────────────────────────────────────────
const factRouter = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const prisma = require('../prisma');

factRouter.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    res.json(await prisma.factura.findMany({
      include:{ pedido:{ include:{ cliente:true } }, pagos:{ include:{ formaPago:true } } },
      orderBy:{ fechaEmision:'desc' }
    }));
  } catch(e) { next(e); }
});

factRouter.get('/ventas-dia', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const hoy    = new Date(); hoy.setHours(0,0,0,0);
    const manana = new Date(hoy); manana.setDate(manana.getDate()+1);
    const facturas = await prisma.factura.findMany({
      where:{ fechaEmision:{ gte:hoy, lt:manana }, estado:{ not:'anulada' } },
      include:{ pedido:{ include:{ cliente:true } }, pagos:{ include:{ formaPago:true } } },
      orderBy:{ fechaEmision:'desc' }
    });
    const totalDia    = facturas.reduce((s,f)=>s+Number(f.total),0);
    const totalIva    = facturas.reduce((s,f)=>s+Number(f.iva),0);
    const cantPedidos = facturas.length;
    res.json({ facturas, resumen:{ totalDia, totalIva, cantPedidos } });
  } catch(e) { next(e); }
});

factRouter.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const f = await prisma.factura.findUnique({
      where:{ id:parseInt(req.params.id) },
      include:{ pedido:{ include:{ cliente:true, detalles:{ include:{ plato:true } } } }, pagos:{ include:{ formaPago:true, tarjeta:true } } }
    });
    if (!f) return res.status(404).json({ error:'Factura no encontrada' });
    res.json(f);
  } catch(e) { next(e); }
});

module.exports.facturasRouter = factRouter;

// ── PAGOS ─────────────────────────────────────────────────
const pagoRouter = require('express').Router();

pagoRouter.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { facturaId, formaPagoId, tarjetaId, monto, referencia } = req.body;
    const pago = await prisma.pago.create({
      data: {
        facturaId:   parseInt(facturaId),
        formaPagoId: parseInt(formaPagoId),
        tarjetaId:   tarjetaId != null && tarjetaId !== '' ? parseInt(tarjetaId) : null,
        monto:       parseFloat(monto),
        referencia:  referencia || null
      }
    });
    await prisma.factura.update({ where: { id: parseInt(facturaId) }, data: { estado: 'pagada' } });
    res.status(201).json(pago);
  } catch(e) { next(e); }
});

module.exports.pagosRouter = pagoRouter;

// ── TARJETAS ──────────────────────────────────────────────
const tarjRouter = require('express').Router();

tarjRouter.get('/', authMiddleware, async (req, res, next) => {
  try { res.json(await prisma.tarjeta.findMany({ where:{ clienteId:req.user.clienteId }, orderBy:{ esPrincipal:'desc' } })); }
  catch(e) { next(e); }
});

tarjRouter.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { titular, numero, marca, mesExp, anioExp } = req.body;
    const limpio = numero.replace(/\s/g,'');
    const ultimos4 = limpio.slice(-4);
    const count = await prisma.tarjeta.count({ where:{ clienteId:req.user.clienteId } });
    const t = await prisma.tarjeta.create({
      data:{ clienteId:req.user.clienteId, titular, numeroMasked:`**** **** **** ${ultimos4}`, marca, mesExp, anioExp, esPrincipal:count===0 }
    });
    res.status(201).json(t);
  } catch(e) { next(e); }
});

tarjRouter.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const count = await prisma.tarjeta.deleteMany({ where:{ id:+req.params.id, clienteId:req.user.clienteId } });
    if (count.count === 0) return res.status(404).json({ error: 'Tarjeta no encontrada' });
    res.json({ message:'Tarjeta eliminada' });
  } catch(e) { next(e); }
});

tarjRouter.put('/:id/principal', authMiddleware, async (req, res, next) => {
  try {
    await prisma.tarjeta.updateMany({ where:{ clienteId:req.user.clienteId }, data:{ esPrincipal:false } });
    res.json(await prisma.tarjeta.update({ where:{ id:+req.params.id }, data:{ esPrincipal:true } }));
  } catch(e) { next(e); }
});

module.exports.tarjetasRouter = tarjRouter;

// ── ADMIN ─────────────────────────────────────────────────
const adminRouter = require('express').Router();

adminRouter.get('/dashboard', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const hoy    = new Date(); hoy.setHours(0,0,0,0);
    const manana = new Date(hoy); manana.setDate(manana.getDate()+1);
    const [ventasHoy, pedidosPendientes, totalClientes, totalPlatos] = await Promise.all([
      prisma.factura.aggregate({ where:{ fechaEmision:{ gte:hoy, lt:manana }, estado:{ not:'anulada' } }, _sum:{ total:true }, _count:true }),
      prisma.pedido.count({ where:{ estado:{ in:['pendiente','en_preparacion'] } } }),
      prisma.cliente.count(),
      prisma.plato.count({ where:{ disponible:true } })
    ]);
    res.json({ ventasHoy:Number(ventasHoy._sum.total||0), pedidosHoy:ventasHoy._count, pedidosPendientes, totalClientes, totalPlatos });
  } catch(e) { next(e); }
});

adminRouter.get('/clientes', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    res.json(await prisma.cliente.findMany({
      include:{ usuario:{ include:{ rol:true } }, _count:{ select:{ pedidos:true } } },
      orderBy:{ createdAt:'desc' }
    }));
  } catch(e) { next(e); }
});

adminRouter.get('/recomendaciones', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const hoy    = new Date(); hoy.setHours(0,0,0,0);
    const manana = new Date(hoy); manana.setDate(manana.getDate()+1);

    const [topPlatos, ventasDia] = await Promise.all([
      prisma.detallePedido.groupBy({
        by:['platoId'], _sum:{ cantidad:true },
        orderBy:{ _sum:{ cantidad:'desc' } }, take:5
      }),
      prisma.factura.aggregate({
        where:{ fechaEmision:{ gte:hoy, lt:manana }, estado:{ not:'anulada' } },
        _sum:{ total:true }, _count:true
      })
    ]);

    const platoIds = topPlatos.map(p => p.platoId);
    const platos   = await prisma.plato.findMany({ where:{ id:{ in:platoIds } }, select:{ id:true, nombre:true, precio:true } });
    const platoMap = Object.fromEntries(platos.map(p => [p.id, p]));

    const topStr = topPlatos.map((p,i) =>
      `${i+1}. ${platoMap[p.platoId]?.nombre || 'Plato #'+p.platoId} — ${p._sum.cantidad} unidades, $${platoMap[p.platoId]?.precio || '?'} c/u`
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

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role:'user', content:prompt }],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!groqRes.ok) throw new Error(`Groq API error: ${groqRes.status}`);

    const groqData = await groqRes.json();
    const content  = groqData.choices?.[0]?.message?.content || '[]';
    const match    = content.match(/\[[\s\S]*\]/);
    const recomendaciones = match ? JSON.parse(match[0]) : [];

    res.json({ recomendaciones });
  } catch(e) { next(e); }
});

module.exports.adminRouter = adminRouter;
