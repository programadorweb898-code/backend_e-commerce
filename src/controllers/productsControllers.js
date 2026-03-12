import Product from "../models/products.js";

export const getProducts = async (req, res, next) => {
  const { max, min, search } = req.query;
  try {
    const query = { isActive: true };
    
    if (min || max) {
      query.price = {};
      if (min) query.price.$gte = Number(min);
      if (max) query.price.$lte = Number(max);
    }

    if (search) {
      const s = search.toLowerCase();
      // Si busca "w", filtramos por categorías que empiecen con "w" (como women's clothing)
      // Si busca "clothing", incluimos men y women
      if (s === 'w' || s === 'women') {
        query.category = { $regex: "^women", $options: "i" };
      } else if (s === 'm' || s === 'men') {
        query.category = { $regex: "^men", $options: "i" };
      } else if (s.includes('clothing')) {
        query.category = { $regex: "clothing", $options: "i" };
      } else {
        query.$or = [
          { title: { $regex: `^${search}`, $options: "i" } },
          { category: { $regex: `^${search}`, $options: "i" } }
        ];
      }
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
    // Si es clothing, buscamos por coincidencia parcial para incluir men y women
    const searchPattern = category.toLowerCase().includes('clothing') ? 'clothing' : `^${category}$`;
    const productos = await Product.find({ 
      category: new RegExp(searchPattern, "i"), 
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
