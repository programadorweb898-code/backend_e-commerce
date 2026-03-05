import {Router} from "express"
import {getProducts,getProduct,getCategoryProducts} from "../controllers/productsControllers.js"
import {authentication} from "../middlewares/authentication.js"
import {addProduct, deleteCart, deleteProduct, restProduct} from "../controllers/cartControllers.js"

const router=Router();
router.get("/getProducts",getProducts)
router.get("/getProduct/:id",getProduct);
router.get("/categoryProducts/:category",getCategoryProducts);
router.post("/addProduct",authentication,addProduct);
router.patch("/restProduct/:productId",authentication,restProduct);
router.delete("/deleteProduct/:productId",authentication,deleteProduct);
router.delete("/deleteCart",authentication,deleteCart);
export default router;