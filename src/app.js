import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/authRoutes.js";
import connectDb from "../config/db.js";
import products from "./routes/productRoutes.js";
import cookieParser from "cookie-parser";
import payment from "./routes/paymentRoutes.js";
import orders from "./routes/orderRoutes.js";
import { setupSwagger } from "../config/swagger.js";

dotenv.config();
const app = express();

// Configuración de middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());

// Documentación
setupSwagger(app);

// Rutas
app.use("/api", router);
app.use("/products", products);
app.use("/payments", payment);
app.use("/api/orders", orders);

// Manejo de errores
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.use((err, req, res, _next) => {
  res.status(400).json({ message: err.message });
});

export default app;
