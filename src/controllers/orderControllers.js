import Order from "../models/orders.js";
import Cart from "../models/cart.js";

/**
 * Service to create an order from a user's cart.
 */
export const createOrderService = async (userId, paymentIntentId) => {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    throw new Error("El carrito está vacío");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId;
    
    if (product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${product.title}`);
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
    status: "paid",
    paymentIntentId
  });

  cart.items = [];
  await cart.save();

  return newOrder;
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Buscando pedidos para el usuario: ${userId}`);
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    console.log(`Pedidos encontrados: ${orders.length}`);
    res.setHeader("Cache-Control", "no-store");
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener los pedidos" });
    console.error("Error detallado al obtener pedidos: ", err);
  }
};

export const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentIntentId } = req.body;
    
    const newOrder = await createOrderService(userId, paymentIntentId);

    res.status(201).json({ message: "Pedido creado correctamente", order: newOrder });
  } catch (err) {
    res.status(500).json({ message: "Error al crear el pedido", error: err.message });
    console.error("Error: ", err.message);
  }
};
