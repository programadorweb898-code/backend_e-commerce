import {transporter} from "../config/mail.js"
import dotenv from "dotenv"
dotenv.config();

export const sendResetEmail=async(to,link)=>{
  await transporter.sendMail({
    from: `Soporte <${process.env.USER_EMAIL}>`,
    to,
    subject:"Restablecer contraseña",
    html:`
      <h1>Recuperar contraseña</h1>
      <a href="${link}">${link}</a>
      `
  })
}

export const sendPurchaseDetailsEmail = async (to, cartItems, total, lang = "es") => {
  const isEn = lang === "en";
  const subject = isEn ? "Your Purchase Details" : "Detalle de tu compra";
  const title = isEn ? "Thanks for your purchase!" : "¡Gracias por tu compra!";
  const subTitle = isEn ? "Here is your order summary:" : "Aquí tienes el detalle de tu pedido:";
  const totalText = isEn ? "Total Paid" : "Total Pagado";
  const footerText = isEn ? "If you have any questions, feel free to contact us." : "Si tienes alguna pregunta, no dudes en contactarnos.";
  const qtyText = isEn ? "Quantity" : "Cantidad";
  const priceText = isEn ? "Unit Price" : "Precio unitario";

  // Preparamos los adjuntos para las imágenes incrustadas (cid)
  const attachments = [];

  const itemsHtml = cartItems.map((item, index) => {
    let imageUrl = (item.productId?.image || "").trim();
    if (imageUrl.startsWith("http://")) {
      imageUrl = imageUrl.replace("http://", "https://");
    }
    
    // Si la URL es relativa, la convertimos a absoluta para que Nodemailer pueda descargarla
    if (imageUrl.startsWith("/")) {
      const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    const cid = `product-image-${index}`;
    
    // Añadimos la imagen a los adjuntos si existe
    if (imageUrl) {
      attachments.push({
        filename: `product-${index}.jpg`,
        path: imageUrl,
        cid: cid
      });
    }

    const itemTitle = item.productId?.title || (isEn ? "Product" : "Producto");
    const itemPrice = item.productId?.price || 0;

    return `
      <tr>
        <td style="padding: 15px 0; border-bottom: 1px solid #edf2f7; vertical-align: middle;" width="80">
          <!-- Referenciamos la imagen usando cid: -->
          <img src="cid:${cid}" 
               alt="${itemTitle}" 
               width="80" 
               height="80" 
               border="0"
               style="display: block; width: 80px; height: 80px; border-radius: 8px; border: 1px solid #f0f4f8;">
        </td>
        <td style="padding: 15px 0 15px 20px; border-bottom: 1px solid #edf2f7; vertical-align: middle;">
          <strong style="font-size: 16px; color: #1a202c; display: block; margin-bottom: 4px; font-family: Arial, sans-serif;">${itemTitle}</strong>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size: 14px; color: #718096; font-family: Arial, sans-serif; padding-right: 15px;">
                ${qtyText}: <b style="color: #2d3748;">${item.quantity}</b>
              </td>
              <td style="font-size: 14px; color: #718096; font-family: Arial, sans-serif;">
                ${priceText}: <b style="color: #2563eb;">$${itemPrice.toFixed(2)}</b>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  await transporter.sendMail({
    from: `Soporte E-Commerce <${process.env.USER_EMAIL}>`,
    to,
    subject,
    attachments, // Pasamos el array de adjuntos con sus cids
    html: `
      <div style="background-color: #f7fafc; padding: 40px 10px; font-family: Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(to right, #2563eb, #3b82f6);">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-style: italic; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #4a5568; font-weight: bold; margin-bottom: 25px;">${subTitle}</p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${itemsHtml}
              </table>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 25px; text-align: left; font-size: 18px; font-weight: 900; color: #1a202c; text-transform: uppercase; font-style: italic;">
                    ${totalText}
                  </td>
                  <td style="padding: 25px; text-align: right; font-size: 32px; font-weight: 900; color: #2563eb; font-style: italic;">
                    $${total.toFixed(2)}
                  </td>
                </tr>
              </table>
              
              <p style="margin-top: 40px; text-align: center; color: #a0aec0; font-size: 14px; font-weight: 500;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  });
};
