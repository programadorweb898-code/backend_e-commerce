import Order from "../models/orders.js";
import Cart from "../models/cart.js";

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener los pedidos" });
    console.error("Error: ", err.message);
  }
};

export const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentIntentId } = req.body;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Stock insuficiente para ${product.title}` });
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        title: product.title,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });
      totalAmount += product.price * item.quantity;
    }

    const newOrder = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      // Marcamos paid porque este flujo se ejecuta despues de Stripe.
      status: "paid",
      paymentIntentId
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({ message: "Pedido creado correctamente", order: newOrder });
  } catch (err) {
    res.status(500).json({ message: "Error al crear el pedido", error: err.message });
    console.error("Error: ", err.message);
  }
};
