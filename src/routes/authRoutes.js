import {Router} from "express"
import {body,validationResult} from "express-validator"
import {registerControllers,loginControllers,logoutControllers,refreshTokenControllers,changePassword,forgotPassword,resetPassword} from "../controllers/authControllers.js"
import {authentication} from "../middlewares/authentication.js"
import User from "../models/users.js"

const router=Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 *       403:
 *         description: El usuario ya existe
 */
router.post("/register",[
    body("email")
    .trim()
    .notEmpty().withMessage("Completar este campo")
    .isEmail().withMessage("Formato invalido"),
    body("password")
    .trim()
    .notEmpty().withMessage("Completar este campo")
    .isLength({min:8,max:20}).withMessage("longitud incorrecta")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]+$/).withMessage("Formato imcorrecto"),
    body("confirmPassword")
    .trim()
    .notEmpty().withMessage("Completar este campo")
    .custom((value,{req})=>{
      if(value!==req.body.password){
        throw new Error("Las contraseñas no coinciden")
      }
      return true;
    })
  ],(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors:errors.array()})
    }
    next();
  },registerControllers);
  
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, se recibe el accessToken y el refreshToken en una cookie
 *       400:
 *         description: Errores de validación
 *       404:
 *         description: Credenciales incorrectas
 */
router.post("/login",[
    body("email")
    .trim()
    .notEmpty().withMessage("Completar este campo"),
    body("password")
    .trim()
    .notEmpty().withMessage("Completar este campo")
  ],async(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors:errors.array()})
    }
    next();
  },loginControllers);
  
/**
 * @swagger
 * /api/refreshToken:
 *   post:
 *     summary: Renovar el accessToken usando el refreshToken
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nuevo accessToken generado
 *       401:
 *         description: Token inválido o no proporcionado
 */
  router.post("/refreshToken",refreshTokenControllers);
  
/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post("/logout",logoutControllers);

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Obtener el usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 */
router.get("/me", authentication, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});
  
/**
 * @swagger
 * /api/changePassword:
 *   patch:
 *     summary: Cambiar la contraseña del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Error en la validación o contraseña incorrecta
 */
  router.patch("/changePassword",authentication,[
      body("currentPassword")
      .trim()
      .notEmpty().withMessage("Completar este campo"),
      body("newPassword")
      .trim()
      .notEmpty().withMessage("Completar este campo")
      .isLength({min:8,max:20}).withMessage("Logitud incorrecta")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]+$/).withMessage("Formato imcorrecto"),
  body("confirmPassword")
    .trim()
    .notEmpty().withMessage("Completar este campo")
    .custom((value,{req})=>{
      if(value!==req.body.newPassword){
        throw new Error("Las contraseñas no coinciden")
      }
      return true;
    })
    ],(req,res,next)=>{
      const errors=validationResult(req);
      if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
      }
      next();
    },changePassword);
  
/**
 * @swagger
 * /api/forgot-password:
 *   post:
 *     summary: Enviar email para recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de recuperación enviado
 *       400:
 *         description: Email inválido
 *       404:
 *         description: Usuario no encontrado
 */
  router.post("/forgot-password",[
    body("email")
    .trim()
    .notEmpty().withMessage("Completar este campo")
  ],(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors:errors.array()});
    }
    next();
  },forgotPassword);

/**
 * @swagger
 * /api/reset-password/{token}:
 *   post:
 *     summary: Restablecer la contraseña usando el token de recuperación
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida correctamente
 *       400:
 *         description: Token inválido, expirado o error en las contraseñas
 */
router.post("/reset-password/:token",[
  body("password")
  .trim()
  .notEmpty().withMessage("Completar este campo")
  .isLength({min:8,max:20}).withMessage("Longitud incorrecta")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]+$/).withMessage("Formato incorrecto"),
  body("confirmPassword")
  .trim()
  .notEmpty().withMessage("Completar este campo")
],(req,res,next)=>{
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }
  next();
},resetPassword);


export default router;
