const router = require('express').Router();
const ctrl   = require('../controllers/proveedor.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/',   ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/ingredientes', ctrl.asignarIngrediente);
router.delete('/:id/ingredientes/:ingredienteId', ctrl.quitarIngrediente);

module.exports = router;
