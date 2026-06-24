const PlatoModel = require('../models/plato.model');

const getAll = async (req, res, next) => {
  try {
    const platos = await PlatoModel.getAll(req.query.categoriaId || null);
    res.json(platos);
  } catch (e) { next(e); }
};

const getCategorias = async (req, res, next) => {
  try {
    res.json(await PlatoModel.getCategorias());
  } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const plato = await PlatoModel.getById(req.params.id);
    if (!plato) return res.status(404).json({ error: 'Plato no encontrado' });
    res.json(plato);
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const plato = await PlatoModel.create(req.body);
    res.status(201).json(plato);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const plato = await PlatoModel.update(req.params.id, req.body);
    res.json(plato);
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await PlatoModel.softDelete(req.params.id);
    res.json({ message: 'Plato deshabilitado correctamente' });
  } catch (e) { next(e); }
};

module.exports = { getAll, getCategorias, getById, create, update, remove };
