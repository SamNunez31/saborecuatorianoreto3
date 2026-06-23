const jwt = require('jsonwebtoken');

/**
 * OWASP A07 – Identification and Authentication Failures
 * Verifica el JWT en cada request protegido.
 */
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token de autenticación requerido' });

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/** Solo admin o cajero */
const adminMiddleware = (req, res, next) => {
  if (!req.user || !['admin','cajero'].includes(req.user.rol))
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol administrador' });
  next();
};

module.exports = { authMiddleware, adminMiddleware };
