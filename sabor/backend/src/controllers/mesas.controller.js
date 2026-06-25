const MesaModel = require('../models/mesa.model');

const getAll = async (req, res, next) => {
  try {
    res.json(await MesaModel.getAll());
  } catch (e) { next(e); }
};

const updateEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    res.json(await MesaModel.updateEstado(req.params.id, estado));
  } catch (e) { next(e); }
};

module.exports = { getAll, updateEstado };
