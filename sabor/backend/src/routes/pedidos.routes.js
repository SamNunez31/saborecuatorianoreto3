const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/pedidos
router.post('/', authMiddleware,
  [
    body('items').isArray({ min:1 }).withMessage('El pedido debe tener al menos un plato'),
    body('items.*.platoId').isInt().withMessage('ID de plato inválido'),
    body('items.*.cantidad').isInt({ min:1 }).withMessage('Cantidad debe ser >= 1'),
    body('tipoEntrega').isIn(['retiro','domicilio']).withMessage('Tipo de entrega inválido'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { items, tipoEntrega, observaciones } = req.body;
      const ids    = items.map(i => i.platoId);
      const platos = await prisma.plato.findMany({ where:{ id:{ in:ids } } });
      const mapa   = Object.fromEntries(platos.map(p=>[p.id, p]));

      const subtotal = items.reduce((s,i) => s + Number(mapa[i.platoId].precio)*i.cantidad, 0);
      const iva      = subtotal * 0.15;
      const total    = subtotal + iva;

      const pedido = await prisma.pedido.create({
        data:{
          clienteId:req.user.clienteId, tipoEntrega, observaciones,
          detalles:{ create: items.map(i=>({ platoId:i.platoId, cantidad:i.cantidad, precioUnitario:mapa[i.platoId].precio, nota:i.nota||null })) }
        },
        include:{ detalles:{ include:{ plato:true } }, cliente:true }
      });

      const count         = await prisma.factura.count();
      const numeroFactura = `FAC-${String(count+1).padStart(4,'0')}`;
      const factura       = await prisma.factura.create({ data:{ pedidoId:pedido.id, numeroFactura, subtotal, iva, total } });

      res.status(201).json({ pedido, factura });
    } catch(e) { next(e); }
  }
);

// GET /api/pedidos/mis-pedidos
router.get('/mis-pedidos', authMiddleware, async (req, res, next) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where:{ clienteId:req.user.clienteId },
      include:{
        cliente:{ select:{ nombre:true, apellido:true, direccion:true } },
        detalles:{ include:{ plato:true } },
        factura:{ include:{ pagos:{ include:{ formaPago:true } } } }
      },
      orderBy:{ fechaPedido:'desc' }
    });
    res.json(pedidos);
  } catch(e) { next(e); }
});

// GET /api/pedidos — admin
router.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include:{ cliente:true, detalles:{ include:{ plato:true } }, factura:true },
      orderBy:{ fechaPedido:'desc' }
    });
    res.json(pedidos);
  } catch(e) { next(e); }
});

// PUT /api/pedidos/:id/estado — admin (cualquier estado) o cliente (solo cancelar el propio si está pendiente)
router.put('/:id/estado', authMiddleware,
  body('estado').isIn(['pendiente','en_preparacion','listo','entregado','cancelado']).withMessage('Estado inválido'),
  validate,
  async (req, res, next) => {
    try {
      const id      = parseInt(req.params.id);
      const { estado } = req.body;
      const esAdmin = ['admin','cajero'].includes(req.user.rol);

      if (!esAdmin) {
        if (estado !== 'cancelado')
          return res.status(403).json({ error: 'Solo puedes cancelar pedidos' });
        const actual = await prisma.pedido.findUnique({ where:{ id } });
        if (!actual)
          return res.status(404).json({ error: 'Pedido no encontrado' });
        if (actual.clienteId !== req.user.clienteId)
          return res.status(403).json({ error: 'No tienes permiso sobre este pedido' });
        if (actual.estado !== 'pendiente')
          return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' });
      }

      const pedido = await prisma.pedido.update({ where:{ id }, data:{ estado } });
      res.json(pedido);
    } catch(e) { next(e); }
  }
);

module.exports = router;
