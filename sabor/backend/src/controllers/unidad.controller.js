const UnidadModel = require('../models/unidad.model');

const getAll = async (req, res, next) => {
  try { res.json(await UnidadModel.getAll()); }
  catch (e) { next(e); }
};

module.exports = { getAll };
