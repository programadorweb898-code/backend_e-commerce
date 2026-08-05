import { jest } from "@jest/globals";
import { execSync } from "node:child_process";

jest.setTimeout(60000);

// Nodemailer se mockea para que este test nunca intente mandar emails reales.
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" })
  })
}));

const MOCK_URL = process.env.STRIPE_MOCK_URL || "http://localhost:12111";

// Apuntamos el SDK de Stripe al stripe-mock local ANTES de importar la app.
process.env.STRIPE_API_BASE = MOCK_URL;
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
process.env.JWT_SECRET = process.env.JWT_SECRET || "jwt_integration_secret";
process.env.JWT_REFRESHTOKEN = process.env.JWT_REFRESHTOKEN || "jwt_integration_refresh";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

import request from "supertest";
import * as dbHandler from "../tests/db-handler.js";
import Product from "../src/models/products.js";
import User from "../src/models/users.js";

let app;
let token;
let productId;

// Probe síncrono (ejecutado en tiempo de carga del módulo) para decidir
// si stripe-mock está disponible antes de que jest defina los describes.
let mockUp = false;
try {
  execSync(
    `node -e "fetch('${MOCK_URL}/v1/charges',{headers:{Authorization:'Bearer sk_test_mock'}}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"`,
    { timeout: 5000, stdio: "ignore" }
  );
  mockUp = true;
} catch {
  mockUp = false;
}

beforeAll(async () => {
  if (!mockUp) {
    console.warn(`stripe-mock NO responde en ${MOCK_URL}. Los tests de integración se omiten.`);
    return;
  }

  app = (await import("../src/app.js")).default;
  await dbHandler.connect();

  const userData = { email: "integ@test.com", password: "Password123!", confirmPassword: "Password123!" };
  await request(app).post("/api/register").send(userData);
  const loginRes = await request(app).post("/api/login").send({
    email: userData.email,
    password: userData.password
  });
  token = loginRes.body.accessToken;

  const user = await User.findOne({ email: userData.email });
  if (!user) throw new Error("No se pudo crear el usuario de integración");

  const product = await Product.create({
    fakeStoreId: 900,
    title: "Producto Integración",
    price: 100,
    stock: 10,
    image: "https://via.placeholder.com/150",
    isActive: true
  });
  productId = product._id;
});

afterAll(async () => {
  if (mockUp) {
    await dbHandler.closeDatabase();
  }
});

const describeIf = mockUp ? describe : describe.skip;

describeIf("Integración real con Stripe (stripe-mock)", () => {

  test("POST /payments/checkout crea una sesión real y devuelve url de pago", async () => {
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ lang: "es" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("url");
    expect(response.body.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  test("POST /payments/checkout acepta idioma (lang) y crea la sesión", async () => {
    // stripe-mock devuelve una url de pago fija y no refleja el lang en ella;
    // la correcta propagación de locale/success_url se valida en el unit test.
    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ lang: "en" });

    expect(response.status).toBe(200);
    expect(response.body.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  test("POST /payments/checkout falla con 400 si el carrito está vacío", async () => {
    await request(app)
      .delete("/products/deleteCart")
      .set("Authorization", `Bearer ${token}`);

    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "El carrito está vacío");
  });

  test("POST /payments/confirm-payment valida la sesión contra Stripe (unpaid => 400)", async () => {
    const session = await createMockSession();
    const response = await request(app)
      .post("/payments/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ session_id: session.id, lang: "es" });

    // stripe-mock devuelve payment_status "unpaid", por lo que el backend responde 400.
    // Esto valida que retrieve() se ejecuta de verdad contra la API.
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "El pago no ha sido completado en Stripe");
  });

  test("POST /payments/confirm-payment falla si falta session_id", async () => {
    const response = await request(app)
      .post("/payments/confirm-payment")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Falta session_id");
  });
});

const createMockSession = async () => {
  const data = new URLSearchParams({
    mode: "payment",
    success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/cancel",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "10000",
    "line_items[0][quantity]": "1",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  const res = await fetch(`${MOCK_URL}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: "Bearer sk_test_mock",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data,
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`stripe-mock no pudo crear la sesión: ${res.status}`);
  }
  return res.json();
};