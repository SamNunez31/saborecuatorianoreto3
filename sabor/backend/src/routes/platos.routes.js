const router = require('express').Router();
const { body, param } = require('express-validator');
const validate  = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/platos.controller');

// GET /api/platos
router.get('/', ctrl.getAll);

// GET /api/platos/categorias
router.get('/categorias', ctrl.getCategorias);

// GET /api/platos/:id
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'), validate,
  ctrl.getById
);

// POST /api/platos — admin
router.post('/', authMiddleware, adminMiddleware,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').escape(),
    body('precio').isFloat({ min: 0.01 }).withMessage('Precio inválido'),
    body('categoriaId').isInt().withMessage('Categoría requerida'),
    body('descripcion').optional().trim().escape(),
    body('imagenUrl').optional(),
  ],
  validate,
  ctrl.create
);

// PUT /api/platos/:id — admin
router.put('/:id', authMiddleware, adminMiddleware,
  [
    param('id').isInt(),
    body('nombre').optional().trim().escape(),
    body('precio').optional().isFloat({ min: 0 }),
    body('imagenUrl').optional()
  ],
  validate,
  ctrl.update
);

// DELETE /api/platos/:id — admin
router.delete('/:id', authMiddleware, adminMiddleware,
  param('id').isInt(), validate,
  ctrl.remove
);

module.exports = router;
