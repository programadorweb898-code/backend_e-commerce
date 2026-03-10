import request from "supertest";
import app from "../src/app.js";

describe("Pruebas de la Aplicación (Setup Check)", () => {
  
  test("Debe responder con 404 para una ruta inexistente", async () => {
    const response = await request(app).get("/ruta-que-no-existe");
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "Ruta no encontrada");
  });

  test("La aplicación debe estar definida", () => {
    expect(app).toBeDefined();
  });

});
