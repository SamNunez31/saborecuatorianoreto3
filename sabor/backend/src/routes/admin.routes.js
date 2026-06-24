const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, adminMiddleware, ctrl.getDashboard);

// GET /api/admin/clientes
router.get('/clientes', authMiddleware, adminMiddleware, ctrl.getClientes);

// GET /api/admin/recomendaciones
router.get('/recomendaciones', authMiddleware, adminMiddleware, ctrl.getRecomendaciones);

module.exports = router;
