import { Router } from "express";
import { getUserOrders, createOrderFromCart } from "../controllers/orderControllers.js";
import { authentication } from "../middlewares/authentication.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Endpoints para la gestión y consulta de pedidos
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Obtener el historial de pedidos del usuario
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos obtenida con éxito
 */
router.get("/", authentication, getUserOrders);

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Convertir el carrito en un pedido tras el pago
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pedido creado correctamente y carrito vaciado
 */
router.post("/checkout", authentication, createOrderFromCart);

export default router;
