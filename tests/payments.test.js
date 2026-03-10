import request from "supertest";
import app from "../src/app.js";
import * as dbHandler from "./db-handler.js";
import Product from "../src/models/products.js";
import Cart from "../src/models/cart.js";
import User from "../src/models/users.js";
import { jest } from "@jest/globals";

// Mock de Stripe
jest.unstable_mockModule("stripe", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ url: "https://stripe.com/test-checkout" })
        }
      }
    }))
  };
});

let token;
let productId;

beforeAll(async () => {
  await dbHandler.connect();
  
  // Crear usuario para obtener token
  const userData = { email: "pay@test.com", password: "Password123!", confirmPassword: "Password123!" };
  await request(app).post("/api/register").send(userData);
  const loginRes = await request(app).post("/api/login").send({
    email: userData.email,
    password: userData.password
  });
  token = loginRes.body.accessToken;

  // Crear producto de prueba
  const product = await Product.create({
    fakeStoreId: 200,
    title: "Producto Pago",
    price: 100,
    stock: 10,
    isActive: true
  });
  productId = product._id;
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Payment Controller", () => {
  
  test("Debe fallar si el carrito está vacío", async () => {
    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "El carrito está vacío");
  });

  test("Debe crear una sesión de pago exitosamente", async () => {
    // 1. Agregamos producto al carrito primero
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    // 2. Intentamos crear el checkout
    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toMatch(/^https:\/\//);
  });

});
