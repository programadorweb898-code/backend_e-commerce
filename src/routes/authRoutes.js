import {Router} from "express"
import {body,validationResult} from "express-validator"
import {registerControllers,loginControllers,logoutControllers,refreshTokenControllers,changePassword,forgotPassword} from "../controllers/authControllers.js"
import {authentication} from "../middlewares/authentication.js"

const router=Router();
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
      return res.json({errors:errors.array()})
    }
    next();
  },registerControllers);
  
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
  
  router.post("/refreshToken",refreshTokenControllers);
  
  router.post("/logout",logoutControllers);
  
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
    ],async(req,res,next)=>{
      const errors=validationResult(req);
      if(!errors.isEmpty()){
        return res.status(404).json({errors:errors.array()})
      }
      next();
    },changePassword);
  
  router.post("/forgot-password",forgotPassword);


export default router;