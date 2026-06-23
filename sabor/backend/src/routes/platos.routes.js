const router = require('express').Router();
const { body, param } = require('express-validator');
const validate  = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/platos
router.get('/', async (req, res, next) => {
  try {
    const { categoriaId } = req.query;
    const platos = await prisma.plato.findMany({
      where:{ disponible:true, ...(categoriaId?{ categoriaId:parseInt(categoriaId) }:{}) },
      include:{ categoria:true },
      orderBy:{ nombre:'asc' }
    });
    res.json(platos);
  } catch(e) { next(e); }
});

// GET /api/platos/categorias
router.get('/categorias', async (req, res, next) => {
  try {
    res.json(await prisma.categoriaPlato.findMany({ orderBy:{ nombre:'asc' } }));
  } catch(e) { next(e); }
});

// GET /api/platos/:id
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'), validate,
  async (req, res, next) => {
    try {
      const plato = await prisma.plato.findUnique({ where:{ id:parseInt(req.params.id) }, include:{ categoria:true } });
      if (!plato) return res.status(404).json({ error:'Plato no encontrado' });
      res.json(plato);
    } catch(e) { next(e); }
  }
);

// POST /api/platos — admin
router.post('/', authMiddleware, adminMiddleware,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').escape(),
    body('precio').isFloat({ min:0.01 }).withMessage('Precio inválido'),
    body('categoriaId').isInt().withMessage('Categoría requerida'),
    body('descripcion').optional().trim().escape(),
    body('imagenUrl').optional(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { categoriaId, nombre, descripcion, precio, imagenUrl } = req.body;
      const plato = await prisma.plato.create({
        data: {
          categoriaId: +categoriaId,
          nombre,
          descripcion,
          precio: +precio,
          imagenUrl,
          disponible: true
        }
      });
      res.status(201).json(plato);
    } catch(e) { next(e); }
  }
);

// PUT /api/platos/:id — admin
router.put('/:id', authMiddleware, adminMiddleware,
  [ param('id').isInt(), body('nombre').optional().trim().escape(), body('precio').optional().isFloat({ min:0 }), body('imagenUrl').optional() ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, descripcion, precio, disponible, categoriaId, imagenUrl } = req.body;
      const plato = await prisma.plato.update({
        where:{ id:parseInt(req.params.id) },
        data:{
          nombre,
          descripcion,
          precio: precio ? +precio : undefined,
          disponible,
          categoriaId: categoriaId ? +categoriaId : undefined,
          imagenUrl
        }
      });
      res.json(plato);
    } catch(e) { next(e); }
  }
);

// DELETE /api/platos/:id — admin
router.delete('/:id', authMiddleware, adminMiddleware,
  param('id').isInt(), validate,
  async (req, res, next) => {
    try {
      await prisma.plato.update({ where:{ id:parseInt(req.params.id) }, data:{ disponible:false } });
      res.json({ message:'Plato deshabilitado correctamente' });
    } catch(e) { next(e); }
  }
);

module.exports = router;
