# E-commerce Backend API

Backend API para un e-commerce con autenticacion, catalogo, carrito, pagos y ordenes. Implementado con Express y MongoDB, con documentacion Swagger y pagos via Stripe.

## Caracteristicas
- Autenticacion con JWT y refresh token en cookie httpOnly
- Catalogo de productos con filtros por precio y busqueda
- Carrito por usuario con alta/baja/ajuste de cantidades
- Flujo de pagos con Stripe Checkout
- Ordenes creadas desde el carrito con control de stock
- Emails de recuperacion de password y confirmacion de compra
- Documentacion Swagger en /api-docs

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT, bcryptjs
- Stripe, Nodemailer
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
USER_EMAIL=tu_correo@gmail.com
PASS_EMAIL=tu_password_o_app_password
NODE_ENV=development
```

## Scripts
```bash
npm run dev      # desarrollo con nodemon
npm start        # production
npm run seed     # carga inicial de productos (Fake Store API)
npm test         # tests con jest
npm run lint     # lint
npm run lint:fix # lint + fix
```

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
- Para emails con Gmail se recomienda App Password.
