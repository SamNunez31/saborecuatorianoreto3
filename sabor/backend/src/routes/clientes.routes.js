const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/clientes.controller');

// GET /api/clientes/mi-perfil
router.get('/mi-perfil', authMiddleware, ctrl.getMiPerfil);

// PUT /api/clientes/mi-perfil
router.put('/mi-perfil', authMiddleware,
  [
    body('nombre').notEmpty().withMessage('Nombre requerido')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Solo letras y espacios'),
    body('apellido').optional({ checkFalsy: true })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Solo letras y espacios'),
    body('telefono').optional({ checkFalsy: true })
      .matches(/^[0-9]{10}$/).withMessage('Teléfono debe tener exactamente 10 dígitos'),
    body('direccion').optional(),
  ],
  validate,
  ctrl.updateMiPerfil
);

module.exports = router;
