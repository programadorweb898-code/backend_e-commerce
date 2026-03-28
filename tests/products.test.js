import request from "supertest";
import app from "../src/app.js";
import * as dbHandler from "./db-handler.js";
import Product from "../src/models/products.js";

const testProducts = [
  {
    fakeStoreId: 1,
    title: "Producto 1",
    price: 100,
    description: "Descripción 1",
    category: "Electrónica",
    image: "http://image.com/1",
    stock: 10,
    isActive: true
  },
  {
    fakeStoreId: 2,
    title: "Producto 2",
    price: 200,
    description: "Descripción 2",
    category: "Ropa",
    image: "http://image.com/2",
    stock: 5,
    isActive: true
  },
  {
    fakeStoreId: 3,
    title: "Producto 3",
    price: 50,
    description: "Descripción 3",
    category: "Electrónica",
    image: "http://image.com/3",
    stock: 0,
    isActive: true
  }
];

beforeAll(async () => {
  await dbHandler.connect();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();
  await Product.insertMany(testProducts);
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Products Controller", () => {
  
  describe("GET /products/getProducts", () => {
    test("Debe obtener todos los productos activos", async () => {
      const response = await request(app).get("/products/getProducts");
      expect(response.status).toBe(200);
      expect(response.body.productos).toHaveLength(3);
    });

    test("Debe filtrar productos por precio máximo", async () => {
      const response = await request(app).get("/products/getProducts?max=150");
      expect(response.status).toBe(200);
      expect(response.body.productos).toHaveLength(2);
    });

    test("Debe filtrar productos por rango de precio", async () => {
      const response = await request(app).get("/products/getProducts?min=150&max=250");
      expect(response.status).toBe(200);
      expect(response.body.productos).toHaveLength(1);
      expect(response.body.productos[0].price).toBe(200);
    });
  });

  describe("GET /products/getProduct/:id", () => {
    test("Debe obtener un producto por su fakeStoreId", async () => {
      const response = await request(app).get("/products/getProduct/1");
      expect(response.status).toBe(200);
      expect(response.body.producto).toHaveProperty("title", "Producto 1");
    });

    test("Debe fallar si el producto no existe", async () => {
      const response = await request(app).get("/products/getProduct/999");
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Producto no encontrado");
    });
  });

  describe("GET /products/categoryProducts/:category", () => {
    test("Debe obtener productos de una categoría específica", async () => {
      const response = await request(app).get("/products/categoryProducts/Electrónica");
      expect(response.status).toBe(200);
      expect(response.body.productos).toHaveLength(2);
    });

    test("Debe fallar si la categoría no tiene productos", async () => {
      const response = await request(app).get("/products/categoryProducts/Inexistente");
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "La categoría no existe o no tiene productos");
    });
  });

});
