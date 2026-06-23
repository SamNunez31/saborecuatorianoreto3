const { validationResult } = require('express-validator');

/**
 * OWASP A03 – Injection
 * Valida y sanitiza entradas usando express-validator.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Datos de entrada inválidos',
      detalles: errors.array().map(e => ({ campo: e.path, mensaje: e.msg }))
    });
  }
  next();
};

module.exports = validate;
