import Product from "../models/products.js";

export const getProducts = async (req, res, next) => {
  const { max, min } = req.query;
  try {
    const query = { isActive: true };
    
    if (min || max) {
      query.price = {};
      if (min) query.price.$gte = Number(min);
      if (max) query.price.$lte = Number(max);
    }

    const productos = await Product.find(query);
    res.json({ productos });
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Buscamos primero por el ID de MongoDB y si no, por el fakeStoreId
    let producto = await Product.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { fakeStoreId: isNaN(id) ? null : Number(id) }
      ].filter(cond => cond !== null && Object.values(cond)[0] !== null)
    });

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ producto });
  } catch (err) {
    next(err);
  }
};

export const getCategoryProducts = async (req, res, next) => {
  const { category } = req.params;
  try {
    const productos = await Product.find({ 
      category: new RegExp(`^${category}$`, "i"), // Búsqueda insensible a mayúsculas
      isActive: true 
    });

    if (productos.length === 0) {
      return res.status(404).json({ message: "La categoría no existe o no tiene productos" });
    }

    res.json({ productos });
  } catch (err) {
    next(err);
  }
};
