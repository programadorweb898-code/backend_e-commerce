import nodemail from "nodemailer"
import dotenv from "dotenv"
dotenv.config();

export const transporter=nodemailer.createTransport({
  service:"gmail",
  auth:{
    user:prpcess.env.USER_EMAIL,
    pass:process.env.PASS_EMAIL
  }
})