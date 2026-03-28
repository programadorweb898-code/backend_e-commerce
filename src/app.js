import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/authRoutes.js";
import products from "./routes/productRoutes.js";
import cookieParser from "cookie-parser";
import payment from "./routes/paymentRoutes.js";
import orders from "./routes/orderRoutes.js";
import { setupSwagger } from "../config/swagger.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan("dev"));
app.use(cookieParser());

setupSwagger(app);

app.use("/api", router);
app.use("/products", products);
app.use("/payments", payment);
app.use("/api/orders", orders);

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.use((err, req, res, _next) => {
  res.status(400).json({ message: err.message });
});

export default app;
