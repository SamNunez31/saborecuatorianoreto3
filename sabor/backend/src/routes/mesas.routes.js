const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/mesas.controller');

// GET /api/mesas — cualquier usuario autenticado puede ver mesas
router.get('/', authMiddleware, ctrl.getAll);

// PUT /api/mesas/:id/estado — solo admin
router.put('/:id/estado', authMiddleware, adminMiddleware,
  body('estado').isIn(['disponible', 'ocupada', 'reservada']).withMessage('Estado inválido'),
  validate,
  ctrl.updateEstado
);

module.exports = router;
