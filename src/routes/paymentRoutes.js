import {Router} from "express"
import {createCheckoutSession} from "../controllers/paymentControllers.js"

const router=Router();
router.post("/checkout",createCheckoutSession);

export default router;