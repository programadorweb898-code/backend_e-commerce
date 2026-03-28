import request from "supertest";
import app from "../src/app.js";
import * as dbHandler from "./db-handler.js";
import { jest } from "@jest/globals";
import User from "../src/models/users.js";
import RefreshToken from "../src/models/refreshToken.js";
import crypto from "crypto";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" })
  })
}));

const testUser = {
  email: "test@example.com",
  password: "Password123!",
  confirmPassword: "Password123!"
};

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Auth Controller", () => {
  
  describe("POST /api/register", () => {
    test("Debe registrar un nuevo usuario con éxito", async () => {
      const response = await request(app).post("/api/register").send(testUser);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Usuario registrado correctamente");
    });

    test("Debe fallar si las contraseñas no coinciden", async () => {
      const invalidUser = { ...testUser, confirmPassword: "WrongPassword" };
      const response = await request(app).post("/api/register").send(invalidUser);
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/login", () => {
    test("Debe iniciar sesión correctamente", async () => {
      await request(app).post("/api/register").send(testUser);
      const response = await request(app).post("/api/login").send({
        email: testUser.email,
        password: testUser.password
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
    });
  });

  describe("POST /api/forgot-password", () => {
    test("Debe generar token de recuperación", async () => {
      await request(app).post("/api/register").send(testUser);
      const response = await request(app).post("/api/forgot-password").send({ email: testUser.email });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Email de recuperación enviado");
    });
  });

  describe("POST /api/reset-password/:token", () => {
    test("Debe cambiar la contraseña y permitir login", async () => {
      await request(app).post("/api/register").send(testUser);
      
      const rawToken = "testtoken123";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      
      await User.findOneAndUpdate(
        { email: testUser.email },
        { 
          resetPasswordToken: tokenHash, 
          resetPasswordExpire: Date.now() + 3600000 
        }
      );

      const newPassword = "NewPassword123!";
      const response = await request(app)
        .post(`/api/reset-password/${rawToken}`)
        .send({ 
          password: newPassword, 
          confirmPassword: newPassword 
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Contraseña restablecida correctamente");

      const loginRes = await request(app)
        .post("/api/login")
        .send({
          email: testUser.email,
          password: newPassword
        });
      expect(loginRes.status).toBe(200);
      });

      test("Debe fallar si el token es inválido", async () => {
      const response = await request(app)
        .post("/api/reset-password/invalidtoken")
        .send({ password: "Password123!", confirmPassword: "Password123!" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Token invalido o expirado");
      });
      });

      describe("POST /api/refreshToken", () => {
      test("Debe renovar el accessToken con una cookie válida", async () => {
      await request(app).post("/api/register").send(testUser);
      const loginRes = await request(app).post("/api/login").send({
        email: testUser.email,
        password: testUser.password
      });

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app)
        .post("/api/refreshToken")
        .set("Cookie", cookies)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.headers['set-cookie']).toBeDefined();
      });

      test("Debe fallar si no hay cookie de refresco", async () => {
      const response = await request(app)
        .post("/api/refreshToken")
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Token requerido");
      });
      });

  describe("POST /api/logout", () => {
    test("Debe cerrar sesión y limpiar la cookie", async () => {
      await request(app).post("/api/register").send(testUser);
      const loginRes = await request(app).post("/api/login").send({
        email: testUser.email,
        password: testUser.password
      });

      const cookies = loginRes.headers['set-cookie'];
      
      const response = await request(app)
        .post("/api/logout")
        .set("Cookie", cookies)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "cierre de sesión exitoso");
      
      const logoutCookies = response.headers['set-cookie'][0];
      expect(logoutCookies).toMatch(/refreshToken=;/);

      const tokensCount = await RefreshToken.countDocuments();
      expect(tokensCount).toBe(0);
    });
  });

  describe("PATCH /api/changePassword", () => {
    test("Debe cambiar la contraseña con éxito", async () => {
      await request(app).post("/api/register").send(testUser);
      const loginRes = await request(app).post("/api/login").send({
        email: testUser.email,
        password: testUser.password
      });
      const token = loginRes.body.accessToken;

      const newPassword = "NewPass123!";
      const response = await request(app)
        .patch("/api/changePassword")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: testUser.password,
          newPassword: newPassword,
          confirmPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Contraseña actualizada correctamente, inicie sesión nuevamente");

      const oldLoginRes = await request(app).post("/api/login").send({
        email: testUser.email,
        password: testUser.password
      });
      expect(oldLoginRes.status).toBe(404);

      const newLoginRes = await request(app).post("/api/login").send({
        email: testUser.email,
        password: newPassword
      });
      expect(newLoginRes.status).toBe(200);
    });

    test("Debe fallar si la contraseña actual es incorrecta", async () => {
      await request(app).post("/api/register").send(testUser);
      const loginRes = await request(app).post("/api/login").send({
        email: testUser.email,
        password: testUser.password
      });
      const token = loginRes.body.accessToken;

      const response = await request(app)
        .patch("/api/changePassword")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongPassword123!",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Password incorrecto");
    });
  });

});
