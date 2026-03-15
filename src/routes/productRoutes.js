import {Router} from "express"
import {getProducts,getProduct,getCategoryProducts} from "../controllers/productsControllers.js"
import {authentication} from "../middlewares/authentication.js"
import {addProduct, getCart, deleteCart, deleteProduct, restProduct} from "../controllers/cartControllers.js"

const router=Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Endpoints para la gestión y consulta de productos
 *   - name: Cart
 *     description: Endpoints para la gestión del carrito de compras
 */

/**
 * @swagger
 * /products/getCart:
 *   get:
 *     summary: Obtener el carrito del usuario
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito obtenido con éxito
 */
router.get("/getCart",authentication,getCart);

/**
 * @swagger
 * /products/getProducts:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos obtenida con éxito
 */
router.get("/getProducts",getProducts)

/**
 * @swagger
 * /products/getProduct/{id}:
 *   get:
 *     summary: Obtener un producto por su ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto obtenido con éxito
 *       404:
 *         description: Producto no encontrado
 */
router.get("/getProduct/:id",getProduct);

/**
 * @swagger
 * /products/categoryProducts/{category}:
 *   get:
 *     summary: Obtener productos por categoría
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la categoría
 *     responses:
 *       200:
 *         description: Lista de productos de la categoría obtenida con éxito
 */
router.get("/categoryProducts/:category",getCategoryProducts);

/**
 * @swagger
 * /products/addProduct:
 *   post:
 *     summary: Añadir un producto al carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto añadido al carrito con éxito
 */
router.post("/addProduct",authentication,addProduct);

/**
 * @swagger
 * /products/restProduct/{productId}:
 *   patch:
 *     summary: Restar una unidad de un producto en el carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cantidad del producto actualizada con éxito
 */
router.patch("/restProduct/:productId",authentication,restProduct);

/**
 * @swagger
 * /products/deleteProduct/{productId}:
 *   delete:
 *     summary: Eliminar un producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito con éxito
 */
router.delete("/deleteProduct/:productId",authentication,deleteProduct);

/**
 * @swagger
 * /products/deleteCart:
 *   delete:
 *     summary: Vaciar el carrito de compras
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado con éxito
 */
router.delete("/deleteCart",authentication,deleteCart);

export default router;
