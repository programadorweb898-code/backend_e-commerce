import Stripe from "stripe";
import dotenv from "dotenv";
import Cart from "../models/cart.js";
import Product from "../models/products.js"; // Asegurar que el modelo se registre

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener el carrito del usuario con los datos del producto (usando 'product' en minúsculas)
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    // Preparar los items para Stripe
    const lineItems = cart.items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productId.title,
          images: [item.productId.image],
        },
        unit_amount: Math.round(item.productId.price * 100), // En centavos
      },
      quantity: item.quantity,
    }));

    // Crear la sesión en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Error en Stripe: ", err.message);
    res.status(500).json({ message: "Error al crear la sesión de pago", error: err.message });
  }
};
