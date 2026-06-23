const router  = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').escape(),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min:6 }).withMessage('Mínimo 6 caracteres'),
    body('apellido').trim().optional().escape(),
    body('telefono').trim().optional().escape(),
    body('direccion').trim().optional().escape(),
  ],
  validate,
  ctrl.register
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  ctrl.login
);

module.exports = router;
