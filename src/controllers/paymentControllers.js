import Stripe from "stripe";
import dotenv from "dotenv";
import Cart from "../models/cart.js";
import { sendPurchaseDetailsEmail } from "../../services/emailService.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lang } = req.body || {};

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    const lineItems = cart.items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productId.title,
          images: [item.productId.image],
        },
        unit_amount: Math.round(item.productId.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      locale: lang || "es",
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}&lang=${lang || "es"}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Error en Stripe: ", err.message);
    res.status(500).json({ message: "Error al crear la sesión de pago", error: err.message });
  }
};

export const confirmPayment = async (req, res) => {
  const { session_id, lang } = req.body || {};

  try {
    if (!session_id) {
      return res.status(400).json({ message: "Falta session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const userId = req.user.id;
      
      const User = (await import("../models/users.js")).default;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const userEmail = user.email;

      const cart = await Cart.findOne({ userId }).populate("items.productId");

      if (cart && cart.items.length > 0) {
        const total = cart.items.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);
        
        const itemsForEmail = cart.items.map(item => ({
          quantity: item.quantity,
          productId: {
            title: item.productId.title,
            price: item.productId.price,
            image: item.productId.image
          }
        }));

        // Vaciamos primero para evitar reintentos duplicando pedidos si el email falla.
        cart.items = [];
        await cart.save();

        try {
          await sendPurchaseDetailsEmail(userEmail, itemsForEmail, total, lang || "es");
        } catch (emailError) {
          console.error("Error NO CRÍTICO al enviar email:", emailError.message);
        }

        return res.json({ 
          success: true, 
          message: "Pago confirmado y carrito vaciado con éxito",
          emailSent: true 
        });
      }

      return res.json({ message: "El pago ya había sido procesado o el carrito estaba vacío" });
    } else {
      return res.status(400).json({ message: "El pago no ha sido completado en Stripe" });
    }
  } catch (err) {
    console.error("Error CRÍTICO al confirmar pago:", err.message);
    res.status(500).json({ message: "Error al confirmar el pago", error: err.message });
  }
};

