/**
 * Middleware centralizado de manejo de errores.
 * OWASP A09 – Security Logging and Monitoring Failures
 * Nunca expone stacktraces en producción.
 */
const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Log del error (siempre)
  console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.path}`, err.message);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    // Solo incluir detalles en desarrollo
    ...(isProd ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
