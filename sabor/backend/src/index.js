require('dotenv').config(); // Loaded environment variables
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');
const fs       = require('fs');

// Rutas
const authRoutes     = require('./routes/auth.routes');
const platosRoutes   = require('./routes/platos.routes');
const pedidosRoutes  = require('./routes/pedidos.routes');
const facturasRoutes = require('./routes/facturas.routes');
const pagosRoutes    = require('./routes/pagos.routes');
const tarjetasRoutes = require('./routes/tarjetas.routes');
const adminRoutes    = require('./routes/admin.routes');
const clientesRoutes = require('./routes/clientes.routes');
const mesasRoutes        = require('./routes/mesas.routes');
const ingredientesRoutes = require('./routes/ingredientes.routes');
const proveedoresRoutes  = require('./routes/proveedores.routes');

// Middleware centralizado de errores
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── LOGGING ──────────────────────────────────────────────
// Logs en archivo para producción
const logStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev')); // consola en dev

// ── SEGURIDAD OWASP ───────────────────────────────────────
// A05: Security Misconfiguration → CORS restringido a origen real
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── RUTAS ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/platos',   platosRoutes);
app.use('/api/pedidos',  pedidosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/pagos',    pagosRoutes);
app.use('/api/tarjetas', tarjetasRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/mesas',        mesasRoutes);
app.use('/api/ingredientes', ingredientesRoutes);
app.use('/api/proveedores',  proveedoresRoutes);

app.get('/', (req, res) => res.json({
  status: 'ok',
  app: 'Sabor Ecuatoriano API',
  version: '1.0.0'
}));

// ── MANEJO DE ERRORES CENTRALIZADO ───────────────────────
app.use(errorHandler);

// ── INICIAR SERVIDOR ─────────────────────────────────────
// Crear carpeta de logs si no existe
if (!fs.existsSync(path.join(__dirname, '../logs'))) {
  fs.mkdirSync(path.join(__dirname, '../logs'));
}

app.listen(PORT, () => {
  console.log(`🍽  Sabor Ecuatoriano API corriendo en http://localhost:${PORT}`);
  console.log(`📋  Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
