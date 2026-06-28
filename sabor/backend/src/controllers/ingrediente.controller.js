const IngredienteModel = require('../models/ingrediente.model');

const getAll = async (req, res, next) => {
  try { res.json(await IngredienteModel.getAll()); }
  catch (e) { next(e); }
};

const updateStock = async (req, res, next) => {
  try {
    const { stock, stockMinimo } = req.body;
    res.json(await IngredienteModel.updateStock(req.params.id, stock, stockMinimo));
  } catch (e) { next(e); }
};

const getAlertas = async (req, res, next) => {
  try { res.json(await IngredienteModel.getAlertas()); }
  catch (e) { next(e); }
};

module.exports = { getAll, updateStock, getAlertas };
