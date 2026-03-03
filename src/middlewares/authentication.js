import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

export const authentication=(req,res,next)=>{
  try{
  const authHeader=req.headers?.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer")){
    return res.status(401).json({message:"El token es requerido"});
  }
  const token=authHeader.split(" ")[1];
  if(!token){
    return res.status(404).json({message:"El token es requerido"})
  }
  const decoded=jwt.verify(token,process.env.JWT_SECRET);
  req.user=decoded;
  next();
  }catch(err){
    res.status(401).json({message:"El token es inválido o ha expirado"});
    console.error("Error: ",err.message);
  }
}