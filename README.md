# E-commerce Backend API

Backend API para un e-commerce con autenticacion, catalogo, carrito, pagos y ordenes. Implementado con Express y MongoDB, con documentacion Swagger, pagos via Stripe y monitoreo de errores con Sentry.

## Caracteristicas
- Autenticacion con JWT y refresh token en cookie httpOnly
- Catalogo de productos con filtros por precio y busqueda
- Carrito por usuario con alta/baja/ajuste de cantidades
- Flujo de pagos con Stripe Checkout
- Ordenes creadas desde el carrito con control de stock
- Emails de recuperacion de password y confirmacion de compra (via Resend)
- Monitoreo de errores con Sentry
- Documentacion Swagger en /api-docs

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT, bcryptjs
- Stripe, Resend (emails)
- Sentry (monitoreo de errores)
- Swagger (swagger-jsdoc, swagger-ui-express)

## Requisitos
- Node.js 18+ (recomendado)
- MongoDB en local o remoto

## Instalacion
```bash
npm install
```

## Variables de entorno
Copiar `.env.example` a `.env` y completar los valores.

```bash
cp .env.example .env
```

Luego completar:

```bash
PORT=4000
MONGO_URI=mongodb://localhost:27017/ecommerce
CLIENT_URL=http://localhost:3000
JWT_SECRET=tu_secreto_jwt
JWT_REFRESHTOKEN=tu_secreto_refresh
STRIPE_SECRET_KEY=sk_test_xxx
RESEND_API_KEY=re_xxx
RESEND_FROM=Soporte E-Commerce <tudominio@tudominio.com>
SENTRY_DSN=https://tu_dsn@sentry.io/xxx
NODE_ENV=development
```

## Scripts
```bash
npm run dev      # desarrollo con nodemon
npm start        # production
npm run seed     # carga inicial de productos (Fake Store API)
npm test         # tests unitarios con jest
npm run test:integration # tests de integración con Stripe (requiere stripe-mock)
npm run lint     # lint
npm run lint:fix # lint + fix
```

## Tests de integración con Stripe (stripe-mock)
Los tests en `integration/` validan el contrato real con la API de Stripe usando el servidor oficial `stripe-mock` (sin costos, sin red real, determinista).

Requisito: tener `stripe-mock` corriendo en `http://localhost:12111`.

```bash
# Opción A: con Docker
docker run --rm -p 12111:12111 stripe/stripe-mock:latest

# Opción B: con Stripe CLI
stripe mock

# Opción C: binario descargado de https://github.com/stripe/stripe-mock/releases
./stripe-mock -port 12111
```

Luego:
```bash
npm run test:integration
```

Si `stripe-mock` no está disponible, los tests se omiten (skip) sin romper la suite. La app apunta al mock mediante la variable `STRIPE_API_BASE` (ver `src/controllers/paymentControllers.js`); sin esa variable, Stripe usa la API real como siempre.

Nota: `stripe-mock` devuelve `payment_status: "unpaid"`, por lo que el flujo "pagado" (vaciado de carrito + email) se cubre con tests unitarios y validación manual con una key `sk_test_...` real.

## Seed de productos
El script de seed se dejo para referencia y uso puntual. Consume `https://fakestoreapi.com/products` y guarda los productos en MongoDB con `stock=10`.

Ruta del script: `scripts/seed.js`.

## Endpoints principales
- Healthcheck: `GET /healthz`
- Auth: `POST /api/register`, `POST /api/login`, `POST /api/logout`, `POST /api/refreshToken`, `GET /api/me`
- Productos: `GET /products/getProducts`, `GET /products/getProduct/:id`, `GET /products/categoryProducts/:category`
- Carrito: `GET /products/getCart`, `POST /products/addProduct`, `PATCH /products/restProduct/:productId`, `DELETE /products/deleteProduct/:productId`, `DELETE /products/deleteCart`
- Pagos: `POST /payments/checkout`, `POST /payments/confirm-payment`
- Ordenes: `GET /api/orders`, `POST /api/orders/checkout`

## Documentacion API
Disponible en `GET /api-docs` cuando el servidor esta corriendo.

## Ejecucion
```bash
npm run dev
```
Servidor por defecto en `http://localhost:4000`.

## Deploy en Render
- Render define el puerto automaticamente mediante la variable `PORT`.
- URL publica: `https://backend-e-commerce-wekg.onrender.com`.

## Notas
- El refresh token se guarda en cookie httpOnly.
- Los emails se envian via Resend. Para desarrollo se puede usar el remitente por defecto `onboarding@resend.dev`.
- Sentry se inicializa en `instrument.js` (primer import en `src/index.js`) y captura errores via `Sentry.setupExpressErrorHandler`. Si `SENTRY_DSN` esta vacio en desarrollo, Sentry solo registra un warning y no envia eventos.
