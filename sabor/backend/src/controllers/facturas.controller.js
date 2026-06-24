const FacturaModel = require('../models/factura.model');

const getAll = async (req, res, next) => {
  try {
    res.json(await FacturaModel.getAll());
  } catch (e) { next(e); }
};

const getVentasDia = async (req, res, next) => {
  try {
    res.json(await FacturaModel.getVentasDia());
  } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const f = await FacturaModel.getById(req.params.id);
    if (!f) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(f);
  } catch (e) { next(e); }
};

module.exports = { getAll, getVentasDia, getById };
