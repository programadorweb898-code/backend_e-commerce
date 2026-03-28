import request from "supertest";
import app from "../src/app.js";
import * as dbHandler from "./db-handler.js";
import Product from "../src/models/products.js";
import Cart from "../src/models/cart.js";

let token;
let productId;

beforeAll(async () => {
  await dbHandler.connect();
  
  const userData = { email: "order@test.com", password: "Password123!", confirmPassword: "Password123!" };
  await request(app).post("/api/register").send(userData);
  const loginRes = await request(app).post("/api/login").send({
    email: userData.email,
    password: userData.password
  });
  token = loginRes.body.accessToken;

  const product = await Product.create({
    fakeStoreId: 300,
    title: "Producto Pedido",
    price: 150,
    stock: 10,
    isActive: true
  });
  productId = product._id;
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Order Controller", () => {
  
  test("Debe crear un pedido a partir del carrito y vaciarlo", async () => {
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 2 });

    const response = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "pi_test_123" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Pedido creado correctamente");
    expect(response.body.order.items).toHaveLength(1);
    expect(response.body.order.totalAmount).toBe(300);

    const cart = await Cart.findOne({ userId: response.body.order.userId });
    expect(cart.items).toHaveLength(0);

    const product = await Product.findById(productId);
    expect(product.stock).toBe(8);
  });

  test("Debe obtener el historial de pedidos del usuario", async () => {
    const response = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0].totalAmount).toBe(300);
  });

  test("Debe fallar si el carrito está vacío al intentar checkout", async () => {
    const response = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "pi_test_456" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "El carrito está vacío");
  });

});
