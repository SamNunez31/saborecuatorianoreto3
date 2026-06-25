const PedidoModel  = require('../models/pedido.model');
const FacturaModel = require('../models/factura.model');
const prisma = require('../prisma');

const create = async (req, res, next) => {
  try {
    const { items, tipoEntrega, observaciones, mesaId } = req.body;
    const ids    = items.map(i => i.platoId);
    const platos = await prisma.plato.findMany({ where: { id: { in: ids } } });
    const mapa   = Object.fromEntries(platos.map(p => [p.id, p]));

    const subtotal = items.reduce((s, i) => s + Number(mapa[i.platoId].precio) * i.cantidad, 0);
    const iva      = subtotal * 0.15;
    const total    = subtotal + iva;

    const pedido        = await PedidoModel.create(req.user.clienteId, { items, tipoEntrega, observaciones, mesaId }, mapa);
    if (mesaId) await prisma.mesa.update({ where: { id: parseInt(mesaId) }, data: { estado: 'ocupada' } });
    const count         = await FacturaModel.count();
    const numeroFactura = `FAC-${String(count + 1).padStart(4, '0')}`;
    const factura       = await FacturaModel.create(pedido.id, { numeroFactura, subtotal, iva, total });

    res.status(201).json({ pedido, factura });
  } catch (e) { next(e); }
};

const getMisPedidos = async (req, res, next) => {
  try {
    const clienteId = req.user?.clienteId;
    if (!clienteId) {
      return res.json([]);
    }
    console.log('clienteId:', clienteId);
    res.json(await PedidoModel.getByClienteId(parseInt(clienteId)));
  } catch (e) { next(e); }
};

const getAll = async (req, res, next) => {
  try {
    res.json(await PedidoModel.getAll());
  } catch (e) { next(e); }
};

const updateEstado = async (req, res, next) => {
  try {
    const id      = parseInt(req.params.id);
    const { estado } = req.body;
    const esAdmin = ['admin', 'cajero'].includes(req.user.rol);

    if (!esAdmin) {
      if (estado !== 'cancelado')
        return res.status(403).json({ error: 'Solo puedes cancelar pedidos' });
      const actual = await PedidoModel.getById(id);
      if (!actual)
        return res.status(404).json({ error: 'Pedido no encontrado' });
      if (actual.clienteId !== req.user.clienteId)
        return res.status(403).json({ error: 'No tienes permiso sobre este pedido' });
      if (actual.estado !== 'pendiente')
        return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' });
    }

    const pedidoActualizado = await PedidoModel.updateEstado(id, estado);
    if (['entregado', 'cancelado'].includes(estado) && pedidoActualizado.mesaId) {
      await prisma.mesa.update({ where: { id: pedidoActualizado.mesaId }, data: { estado: 'disponible' } });
    }
    res.json(pedidoActualizado);
  } catch (e) { next(e); }
};

module.exports = { create, getMisPedidos, getAll, updateEstado };
