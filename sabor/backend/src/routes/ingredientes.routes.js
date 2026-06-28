const router = require('express').Router();
const ctrl   = require('../controllers/ingrediente.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/',         ctrl.getAll);
router.get('/alertas',  authMiddleware, adminMiddleware, ctrl.getAlertas);
router.put('/:id/stock', authMiddleware, adminMiddleware, ctrl.updateStock);

module.exports = router;
