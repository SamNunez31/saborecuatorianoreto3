const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/facturas.controller');

// GET /api/facturas — admin
router.get('/', authMiddleware, adminMiddleware, ctrl.getAll);

// GET /api/facturas/ventas-dia — admin
router.get('/ventas-dia', authMiddleware, adminMiddleware, ctrl.getVentasDia);

// GET /api/facturas/:id
router.get('/:id', authMiddleware, ctrl.getById);

module.exports = router;
