import { Router } from "express";
import { createCheckoutSession } from "../controllers/paymentControllers.js";
import { authentication } from "../middlewares/authentication.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Endpoints para la gestión de pagos y sesiones de Stripe
 */

/**
 * @swagger
 * /payments/checkout:
 *   post:
 *     summary: Crear una sesión de pago en Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión de pago creada exitosamente, devuelve la URL de Stripe
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al crear la sesión de pago
 */
router.post("/checkout", authentication, createCheckoutSession);

export default router;
