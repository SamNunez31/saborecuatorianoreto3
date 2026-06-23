# 🍽 Sabor Ecuatoriano — Plataforma Full Stack

Plataforma web de e-commerce para un restaurante ecuatoriano. Incluye catálogo, carrito, pedidos, autenticación con JWT, roles y panel de administración.

---

## 📁 Estructura del proyecto

```
sabor-ecuatoriano/
├── backend/          ← API REST · Node.js + Express + Prisma + PostgreSQL
├── frontend-reto2/   ← MVC con JS puro (Reto 2)
└── frontend-reto3/   ← Angular 17 standalone (Reto 3)
```

---

## 🗄️ Base de datos — Supabase (PostgreSQL)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Project Settings → Database → Connection string → Transaction**
3. Copiar el URI y pegarlo en `backend/.env`

### Tablas creadas automáticamente con Prisma
`roles` · `usuarios` · `clientes` · `tarjetas` · `categorias_plato` · `platos` · `formas_pago` · `pedidos` · `detalle_pedido` · `facturas` · `pagos`

---

## ⚙️ Instalación y ejecución — Backend

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Crear .env a partir del ejemplo
cp .env.example .env
# Editar .env con tu DATABASE_URL de Supabase

# 3. Generar cliente Prisma y crear tablas
npx prisma generate
npx prisma db push

# 4. Cargar datos de prueba
node prisma/seed.js

# 5. Iniciar servidor
npm run dev
# → http://localhost:3000
```

### Usuarios de prueba
| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sabor.ec | admin123 | admin |
| cliente@prueba.ec | cliente123 | cliente |

---

## 🌐 Ejecución — Frontend Reto 2 (JS puro MVC)

Abrir `frontend-reto2/index.html` con **Live Server** (VS Code) en el puerto 5500.

El archivo `.env.example` ya apunta a `http://localhost:3000` por defecto.

### Páginas disponibles
| Página | Descripción |
|--------|------------|
| `index.html` | Inicio con platos destacados |
| `menu.html` | Catálogo con filtros por categoría |
| `login.html` | Login + Registro (tabs) |
| `checkout.html` | Confirmar pedido y pago |
| `mis-pedidos.html` | Historial con visor de facturas |
| `mi-cuenta.html` | Tarjeta virtual + gestión de tarjetas |
| `admin.html` | Panel completo de administración |

---

## ⚡ Ejecución — Frontend Reto 3 (Angular 17)

**Prerrequisito:** Node.js LTS instalado. En PowerShell ejecutar:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

```bash
cd frontend-reto3

npm install
ng serve
# → http://localhost:4200
```

### Compilar para producción
```bash
ng build --configuration production
# Salida en dist/sabor-reto3/
```

### Ejecutar pruebas unitarias
```bash
ng test
```

### Lint
```bash
ng lint
```

---

## 🔗 Endpoints de la API

### Autenticación
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Público | Iniciar sesión → JWT |
| POST | `/api/auth/register` | Público | Registrar cuenta |

### Platos
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/platos` | Público | Listar platos disponibles |
| GET | `/api/platos/categorias` | Público | Listar categorías |
| GET | `/api/platos/:id` | Público | Detalle de un plato |
| POST | `/api/platos` | Admin | Crear plato |
| PUT | `/api/platos/:id` | Admin | Actualizar plato |
| DELETE | `/api/platos/:id` | Admin | Deshabilitar plato |

### Pedidos
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/pedidos` | Auth | Crear pedido (genera factura automática) |
| GET | `/api/pedidos/mis-pedidos` | Auth | Pedidos del cliente logueado |
| GET | `/api/pedidos` | Admin | Todos los pedidos |
| PUT | `/api/pedidos/:id/estado` | Admin | Cambiar estado |

### Facturas, Pagos, Tarjetas
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/facturas` | Admin | Todas las facturas |
| GET | `/api/facturas/ventas-dia` | Admin | Reporte del día |
| GET | `/api/facturas/:id` | Auth | Detalle de factura |
| POST | `/api/pagos` | Auth | Registrar pago |
| GET | `/api/tarjetas` | Auth | Mis tarjetas |
| POST | `/api/tarjetas` | Auth | Agregar tarjeta |
| DELETE | `/api/tarjetas/:id` | Auth | Eliminar tarjeta |
| PUT | `/api/tarjetas/:id/principal` | Auth | Marcar como principal |

### Admin
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/admin/dashboard` | Admin | Estadísticas del día |
| GET | `/api/admin/clientes` | Admin | Lista de clientes |

---

## 🔒 Seguridad aplicada — OWASP Top 10

### A01 – Broken Access Control
- Guards de rutas en Angular (`authGuard`, `adminGuard`, `noAuthGuard`)
- Middleware `adminMiddleware` en Express que verifica el rol del token
- Rutas de solo-admin protegidas en todos los endpoints sensibles

### A03 – Injection
- **Backend:** `express-validator` valida y sanitiza todos los inputs antes de llegar a la BD
- **Prisma ORM:** usa queries parametrizadas — nunca SQL concatenado
- **Angular Reto 3:** `ReactiveFormsModule` con `Validators` en todos los formularios
- **Reto 2:** validación manual con expresiones regulares y `aria-invalid`

### A07 – Identification and Authentication Failures
- JWT firmado con `JWT_SECRET` de entorno, expiración 7 días
- Contraseñas hasheadas con `bcrypt(rounds=10)` — nunca texto plano
- `jwtInterceptor` en Angular hace logout automático al recibir 401
- Credenciales inválidas retornan mensaje genérico (no revelan si el email existe)

### A05 – Security Misconfiguration
- CORS restringido al origen exacto definido en `CORS_ORIGIN`
- No se usa `*` en producción
- `NODE_ENV` controla si se expone stacktrace

### A09 – Security Logging and Monitoring Failures
- `morgan` registra todas las peticiones en archivo `logs/access.log`
- `errorHandler` centralizado: nunca expone stacktrace en producción

---

## 🧱 Arquitectura MVC

### Backend (Express)
```
routes/      → Define endpoints y aplica middlewares
controllers/ → Lógica HTTP (req/res), llama a Prisma
models/      → Prisma schema (modelos de BD)
middleware/  → auth JWT, validación, errorHandler
```

### Frontend Reto 2 (JS puro)
```
models/app.model.js      → Consume API, gestiona estado (AuthModel, CartModel, PlatosModel…)
views/app.view.js        → Renderiza UI (NavbarView, CartView, PlatoCardView, ToastView)
controllers/app.controller.js → Maneja eventos y flujos (HomeController, MenuController…)
```

### Frontend Reto 3 (Angular 17)
```
core/models/     → Interfaces TypeScript
core/services/   → AuthService, CartService (signals), PlatosService…
core/guards/     → authGuard, adminGuard, noAuthGuard
core/interceptors/ → jwtInterceptor
shared/          → NavbarComponent, CarritoComponent, ToastContainerComponent
auth/            → LoginComponent, RegisterComponent (Reactive Forms)
cliente/         → HomeComponent, MenuComponent, CheckoutComponent, MisPedidos, MiCuenta
admin/           → Layout + Dashboard, Pedidos, Facturas, Ventas, Platos, Clientes
```

---

## 🧪 Pruebas evidenciadas

| Escenario | Resultado esperado |
|-----------|-------------------|
| Login admin | Token JWT + redirección a /admin |
| Login cliente | Token JWT + redirección a / |
| Login con credenciales incorrectas | Error 401 |
| Cliente intenta POST /api/platos | Error 403 Forbidden |
| Catálogo en frontend | Platos cargados desde la API |
| Agregar al carrito | Persiste en localStorage |
| Confirmar pedido (cliente logueado) | Pedido + factura en BD |
| Admin cambia estado de pedido | Estado actualizado en BD |
| ng test | CartService: 14 specs ✓ · AuthService: 8 specs ✓ |

---

## 🚀 Despliegue

### Backend → Render
1. Crear Web Service en Render apuntando al repo
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm start`
4. Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`

### Frontend Reto 3 → Vercel
1. Conectar repo a Vercel
2. Framework: Angular
3. Build: `ng build --configuration production`
4. Output: `dist/sabor-reto3`
5. Actualizar `environment.prod.ts` con la URL del backend en Render

---

## 📦 Lecciones aprendidas

- La separación MVC real (no solo de nombre) hace el código más mantenible y testeable
- Los Reactive Forms de Angular ofrecen validación más robusta que el HTML puro
- Los signals de Angular 17 simplifican el manejo de estado reactivo sin NgRx
- Prisma elimina casi por completo el riesgo de SQL injection
- El interceptor JWT centraliza la autenticación y evita repetir headers manualmente
