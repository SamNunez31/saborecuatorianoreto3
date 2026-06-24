const ClienteModel = require('../models/cliente.model');

const getMiPerfil = async (req, res, next) => {
  try {
    const cliente = await ClienteModel.getById(req.user.clienteId);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (e) { next(e); }
};

const updateMiPerfil = async (req, res, next) => {
  try {
    res.json(await ClienteModel.updatePerfil(req.user.clienteId, req.body));
  } catch (e) { next(e); }
};

module.exports = { getMiPerfil, updateMiPerfil };
