import { Router } from "express";
import { createCheckoutSession, confirmPayment } from "../controllers/paymentControllers.js";
import { authentication } from "../middlewares/authentication.js";

const router = Router();

// ... swagger docs ...

router.post("/checkout", authentication, createCheckoutSession);
router.post("/confirm-payment", authentication, confirmPayment);

export default router;

