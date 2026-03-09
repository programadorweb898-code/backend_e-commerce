import {Router} from "express"
import {createCheckoutSession} from "../controllers/paymentControllers.js"

const router=Router();

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
 *     responses:
 *       200:
 *         description: Sesión de pago creada exitosamente, devuelve la URL de Stripe
 *       500:
 *         description: Error al crear la sesión de pago
 */
router.post("/checkout",createCheckoutSession);

export default router;
