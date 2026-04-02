import { jest } from "@jest/globals";

jest.setTimeout(30000);

const mockStripeCreate = jest.fn();
const mockStripeRetrieve = jest.fn();

jest.unstable_mockModule("stripe", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockStripeCreate,
          retrieve: mockStripeRetrieve,
        },
      },
    })),
    __mockCreate: mockStripeCreate,
    __mockRetrieve: mockStripeRetrieve,
  };
});

const mockSendPurchaseDetailsEmail = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("../services/emailService.js", () => {
  return {
    sendPurchaseDetailsEmail: mockSendPurchaseDetailsEmail,
    sendResetEmail: jest.fn().mockResolvedValue(undefined),
    __mockSendPurchaseDetailsEmail: mockSendPurchaseDetailsEmail,
  };
});

import request from "supertest";

import * as dbHandler from "./db-handler.js";
import Product from "../src/models/products.js";
import Cart from "../src/models/cart.js";
import User from "../src/models/users.js";


let token;
let productId;
let app;
let userId;

beforeAll(async () => {
  app = (await import("../src/app.js")).default;
  await dbHandler.connect();
  
  const userData = { email: "pay@test.com", password: "Password123!", confirmPassword: "Password123!" };
  await request(app).post("/api/register").send(userData);
  const loginRes = await request(app).post("/api/login").send({
    email: userData.email,
    password: userData.password
  });
  token = loginRes.body.accessToken;

  const user = await User.findOne({ email: userData.email });
  userId = user?._id;

  const product = await Product.create({
    fakeStoreId: 200,
    title: "Producto Pago",
    price: 100,
    stock: 10,
    image: "https://via.placeholder.com/150",
    isActive: true
  });
  productId = product._id;
});

beforeEach(() => {
  mockStripeCreate.mockReset().mockResolvedValue({ url: "https://stripe.com/test-checkout" });
  mockStripeRetrieve.mockReset().mockResolvedValue({ payment_status: "paid" });
  mockSendPurchaseDetailsEmail.mockClear();
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
    expect(mockStripeCreate).not.toHaveBeenCalled();
  });

  test("Debe crear una sesión de pago exitosamente", async () => {
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toMatch(/^https:\/\//);
    expect(mockStripeCreate).toHaveBeenCalledTimes(1);
  });

  test("Debe crear sesión respetando el idioma (lang)", async () => {
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ lang: "en" });

    expect(response.status).toBe(200);
    expect(response.body.url).toMatch(/^https:\/\//);

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        success_url: expect.stringContaining("lang=en"),
      })
    );
  });

  test("Debe devolver 500 si Stripe falla al crear la sesión", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockStripeCreate.mockRejectedValueOnce(new Error("stripe down"));

    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    const response = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Error al crear la sesión de pago");
    expect(response.body).toHaveProperty("error", "stripe down");

    errorSpy.mockRestore();
  });

  test("Confirm payment: debe fallar si falta session_id", async () => {
    const response = await request(app)
      .post("/payments/confirm-payment")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Falta session_id");
  });

  test("Confirm payment: debe fallar si el pago no esta completado", async () => {
    mockStripeRetrieve.mockResolvedValueOnce({ payment_status: "unpaid" });

    const response = await request(app)
      .post("/payments/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ session_id: "sess_unpaid" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "El pago no ha sido completado en Stripe");
  });

  test("Confirm payment: debe vaciar el carrito cuando el pago es paid", async () => {
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    const response = await request(app)
      .post("/payments/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ session_id: "sess_paid", lang: "es" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);

    const cart = await Cart.findOne({ userId });
    expect(cart.items).toHaveLength(0);
    expect(mockSendPurchaseDetailsEmail).toHaveBeenCalledTimes(1);
  });

  test("Confirm payment: debe devolver 404 si el usuario no existe", async () => {
    const userData = { email: "pay-user-missing@test.com", password: "Password123!", confirmPassword: "Password123!" };
    await request(app).post("/api/register").send(userData);
    const loginRes = await request(app).post("/api/login").send({
      email: userData.email,
      password: userData.password
    });
    const missingUserToken = loginRes.body.accessToken;

    const missingUser = await User.findOne({ email: userData.email });
    await User.deleteOne({ _id: missingUser._id });

    const response = await request(app)
      .post("/payments/confirm-payment")
      .set("Authorization", `Bearer ${missingUserToken}`)
      .send({ session_id: "sess_paid" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Usuario no encontrado");
  });

});
