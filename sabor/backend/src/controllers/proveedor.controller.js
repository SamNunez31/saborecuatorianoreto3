const ProveedorModel = require('../models/proveedor.model');

const getAll = async (req, res, next) => {
  try { res.json(await ProveedorModel.getAll()); }
  catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const p = await ProveedorModel.getById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(p);
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await ProveedorModel.create(req.body)); }
  catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { res.json(await ProveedorModel.update(req.params.id, req.body)); }
  catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await ProveedorModel.softDelete(req.params.id);
    res.json({ message: 'Proveedor desactivado' });
  } catch (e) { next(e); }
};

const asignarIngrediente = async (req, res, next) => {
  try {
    const { ingredienteId, esPrincipal } = req.body;
    res.json(await ProveedorModel.asignarIngrediente(req.params.id, ingredienteId, esPrincipal));
  } catch (e) { next(e); }
};

const quitarIngrediente = async (req, res, next) => {
  try {
    await ProveedorModel.quitarIngrediente(req.params.id, req.params.ingredienteId);
    res.json({ message: 'Ingrediente removido del proveedor' });
  } catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove, asignarIngrediente, quitarIngrediente };
