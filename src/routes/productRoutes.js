import {Router} from "express"
import {getProducts,getProduct,getCategoryProducts} from "../controllers/productsControllers.js"
import {authentication} from "../middlewares/authentication.js"
import {addCart} from "../controllers/cartControllers.js"

const router=Router();
router.get("/getProducts",getProducts)
router.get("/getProduct/:id",getProduct);
router.get("/categoryProducts/:category",getCategoryProducts);
router.post("/addProduct",authentication,addCart)
export default router;