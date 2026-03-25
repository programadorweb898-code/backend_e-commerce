import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce Backend API",
      version: "1.0.0",
      description: "Documentación de la API para el proyecto de E-commerce",
      contact: {
        name: "Soporte Técnico",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: "Servidor local de desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["email", "password"],
          properties: {
            id: { type: "string", description: "ID autogenerado de MongoDB" },
            email: { type: "string", format: "email", example: "usuario@correo.com" },
            password: { type: "string", format: "password", example: "Password123!" },
            resetPasswordToken: { type: "string" },
            resetPasswordExpire: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Camiseta de Algodón" },
            description: { type: "string", example: "Camiseta 100% algodón, varios colores." },
            price: { type: "number", example: 19.99 },
            category: { type: "string", example: "Ropa" },
            stock: { type: "integer", example: 50 },
            image: { type: "string", example: "https://url-de-la-imagen.jpg" },
          },
        },
        CartItem: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string", description: "ID del producto a añadir" },
            quantity: { type: "integer", minimum: 1, example: 1 },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Error en la operación" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  msg: { type: "string" },
                  param: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger UI disponible en /api-docs");
};
