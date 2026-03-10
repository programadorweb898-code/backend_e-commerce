import request from "supertest";
import app from "../src/app.js";
import * as dbHandler from "./db-handler.js";
import Product from "../src/models/products.js";
import User from "../src/models/users.js";

let token;
let productId;

beforeAll(async () => {
  await dbHandler.connect();
  
  // Crear usuario para obtener token
  const userData = { email: "cart@test.com", password: "Password123!", confirmPassword: "Password123!" };
  await request(app).post("/api/register").send(userData);
  const loginRes = await request(app).post("/api/login").send({
    email: userData.email,
    password: userData.password
  });
  token = loginRes.body.accessToken;

  // Crear producto de prueba
  const product = await Product.create({
    fakeStoreId: 100,
    title: "Producto Carrito",
    price: 50,
    stock: 10,
    isActive: true
  });
  productId = product._id.toString();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Cart Controller", () => {
  
  test("Debe agregar un producto al carrito", async () => {
    const response = await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 2 });

    expect([200, 201]).toContain(response.status);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(2);
  });

  test("Debe fallar si el stock es insuficiente", async () => {
    const response = await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 20 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Stock insuficiente");
  });

  test("Debe restar la cantidad de un producto", async () => {
    const response = await request(app)
      .patch(`/products/restProduct/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items[0].quantity).toBe(1);
  });

  test("Debe eliminar un producto del carrito", async () => {
    const response = await request(app)
      .delete(`/products/deleteProduct/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(0);
  });

  test("Debe vaciar el carrito", async () => {
    // Agregamos algo primero
    await request(app)
      .post("/products/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const response = await request(app)
      .delete("/products/deleteCart")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Carrito vaciado correctamente");
  });

});
