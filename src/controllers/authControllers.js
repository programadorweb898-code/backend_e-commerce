import bcrypt from "bcryptjs"
import User from "../models/users.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import RefreshToken from "../models/refreshToken.js"
import dotenv from "dotenv"
import {sendResetEmail} from "../../services/emailService.js"

dotenv.config();
const hashToken=(token)=> crypto.createHash("sha256").update(token).digest("hex");

export const registerControllers=async(req,res)=>{
  const {email,password,confirmPassword}=req.body;
  try{
    const userExists=await User.findOne({email});
    if(userExists){
      return res.status(403).json({message:"el usuario ya existe"});
    }else{
      if(password !== confirmPassword){
        return res.status(401).json({message:"Las contraseñas no coinciden"})
      }
    }
    const newUser=new User({
      email,
      password
    });
    await newUser.save();
    res.json({message:"Usuario registrado correctamente"});
  }catch(err){
    if(err.code === 11000){
     return res.json({message:err.message})
    }
    res.status(500).json({error:"Error en el servidor al registrar usuario"});
    console.error("Error: ",err.message)
  }
};

export const loginControllers=async (req,res)=>{
  const{email,password}=req.body
  try{
    const userExists=await User.findOne({email});
    if(!userExists){
      return res.status(404).json({message:"Credenciales incorrectas"})
    }
    const passwordUser=await bcrypt.compare(password,userExists.password);
    if(!passwordUser){
      return res.status(404).json({message:"Credenciales incorrectas"});
    };
    await RefreshToken.deleteMany({userId:userExists._id})
    const payload={id:userExists._id};
    const accessToken=jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"15m"});
    const refreshToken=jwt.sign(payload,process.env.JWT_REFRESHTOKEN,{expiresIn:"7d"});
    await RefreshToken.create({
      userId:userExists._id,
      token:hashToken(refreshToken),
      expiresAt:new Date(Date.now() + 7 *24 *60 *60 * 1000)
    });
    res.cookie("refreshToken",refreshToken,{
      httpOnly:true,
      secure:true,
      sameSite:"strict"
    });
    res.json({accessToken,message:"Login exitoso"});
    
  }catch(err){
    res.status(500).json({error:"Error interno del servidor al hacer login"});
    console.error("Error: ",err.message)
  }
}

export const refreshTokenControllers=async(req,res)=>{
  try{
    const oldToken=req.cookies.refreshToken;
    if(!oldToken){
      return res.status(401).json({message:"Token requerido"});
    };
    const decoded=jwt.verify(oldToken,process.env.JWT_REFRESHTOKEN);
    const hash=hashToken(oldToken);
    const storedToken=await RefreshToken.findOne({
      userId:decoded.id,
      token:hash
    });
    if(!storedToken){
      await RefreshToken.deleteMany({
        userId:decoded.id
      });
      return res.status(401).json({message:"Token invalida o reutilizado"})
    }
    await storedToken.deleteOne();
    const newAccessToken=jwt.sign(
        {id:decoded.id},
        process.env.JWT_SECRET,
        {expiresIn:"15m"}
      );
    const newRefreshToken=jwt.sign(
        {id:decoded.id},
        process.env.JWT_REFRESHTOKEN,
        {expiresIn:"7d"}
      );
  
  await RefreshToken.create({
    userId:decoded.id,
    token:hashToken(newRefreshToken),
    createAt:new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  res.cookie("refreshToken",newRefreshToken,{
    httpOnly:true,
    secure:true,
    sameSite:"strict"
    
  });
  res.json({accessToken:newAccessToken})
    
  }catch(err){
    res.status(401).json({
      message:"RefreshToken expirado o invalido"
    });
    console.error("Error::",err.message)
  }
}

export const logoutControllers=async(req,res)=>{
  try{
  const refreshToken=req.cookies.refreshToken;
  if(refreshToken){
    await RefreshToken.deleteOne({token: hashToken(refreshToken)});
  };
  res.clearCookie("refreshToken",{
    httpOnly:true,
    secure:true,
    sameSite:"strict"
  });
  res.json({message:"cierre de sesión exitoso"})
  }catch(err){
    res.status(500).json({message:"Error sl cerrar sesión"})
    console.error("Error: ",err.message)
  }
}

export const changePassword=async(req,res,next)=>{
  try{
    const {currentPassword,newPassword,confirmPassword}=req.body;
    const user=await User.findById(req.user.id);
    if(!user){
      return res.status(404).json({message:"El usuario no existe"})
    }
    const match=await bcrypt.compare(currentPassword,user.password);
    if(!match){
      return res.status(400).json({message:"Password incorrecto"});
    };
    if(currentPassword === newPassword){
      return res.status(400).json({message:"La nueva contraseña debe ser diferente a la actual"});
    }
    user.password=newPassword;
    await user.save();
    await RefreshToken.deleteMany({userId:user._id});
    res.clearCookie("refreshToken",{
      httpOnly:true,
      secure:process.env.NODE_ENV === "production",
      sameSite:"strict"
    });
    res.status(200).json({
      message:"Contraseña actualizada correctamente, inicie sesión nuevamente"
    })
  }catch(err){
    next(err);
    console.error("Error: ",err.stack)
  }
}

export const forgotPassword=async(req,res,next)=>{
  try{
    const{email}=req.body;
    const user=await User.findOne({email});
    if(!user){
      return res.status(404).json({message:"Usuario no encontrado"});
    };
    const resetToken=crypto.randomBytes(32).toString("hex");
    const tokenHash=crypto.createHash("sha256")
    .update(resetToken)
    .digest("hex");
    
    user.resetPasswordToken=tokenHash;
    user.resetPasswordExpire=Date.now() + 15 * 60 *1000;
    await user.save();
    
    const link=`${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    if (process.env.NODE_ENV !== "test") {
      await sendResetEmail(user.email,link);
    }
    
    res.json({message:"Email de recuperación enviado"});
  }catch(err){
    next(err)
  }
}

export const resetPassword=async(req,res,next)=>{
  try{
    const {token}=req.params;
    const {password,confirmPassword}=req.body;
    if(password !== confirmPassword){
      return res.status(400).json({message:"Las contraseñas no coinciden"})
    };
    const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
    const user=await User.findOne({
      resetPasswordToken:tokenHash,
      resetPasswordExpire:{$gt:Date.now()}
    });
    if(!user){
      return res.status(400).json({message:"Token invalido o expirado"})
    };
    user.password=password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save();
    res.json({message:"Contraseña restablecida correctamente"});
  }catch(err){
    next(err)
  }
}