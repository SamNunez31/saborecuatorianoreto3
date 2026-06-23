const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/clientes/mi-perfil
router.get('/mi-perfil', authMiddleware, async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: req.user.clienteId } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (e) { next(e); }
});

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
  async (req, res, next) => {
    try {
      const { nombre, apellido, telefono, direccion } = req.body;
      const cliente = await prisma.cliente.update({
        where: { id: req.user.clienteId },
        data: { nombre, apellido, telefono, direccion }
      });
      res.json(cliente);
    } catch (e) { next(e); }
  }
);

module.exports = router;
