import {transporter} from "../config/mail.js"
export const sendResetEmail=async(to,link)=>{
  await transporter.sendMail({
    from: `soporte ${process.env.EMAIL_USER}`,
    to,
    subject:"Restablecer contraseña",
    html:`
      <h1>Recuperar contraseña</h1>
      <a href="${link}">${link}</a>
      `
  })
}