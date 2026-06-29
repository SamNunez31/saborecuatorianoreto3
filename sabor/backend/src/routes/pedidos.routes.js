const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/pedidos.controller');

// POST /api/pedidos
router.post('/', authMiddleware,
  [
    body('items').isArray({ min: 1 }).withMessage('El pedido debe tener al menos un plato'),
    body('items.*.platoId').isInt().withMessage('ID de plato inválido'),
    body('items.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser >= 1'),
    body('items.*.ingredientesRemovidos').optional().isArray(),
    body('items.*.nota').optional().isString().trim(),
    body('tipoEntrega').isIn(['retiro', 'domicilio']).withMessage('Tipo de entrega inválido'),
    body('mesaId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Mesa inválida'),
  ],
  validate,
  ctrl.create
);

// GET /api/pedidos/mis-pedidos
router.get('/mis-pedidos', authMiddleware, ctrl.getMisPedidos);

// GET /api/pedidos — admin
router.get('/', authMiddleware, adminMiddleware, ctrl.getAll);

// PUT /api/pedidos/:id/estado
router.put('/:id/estado', authMiddleware,
  body('estado').isIn(['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado']).withMessage('Estado inválido'),
  validate,
  ctrl.updateEstado
);

module.exports = router;
