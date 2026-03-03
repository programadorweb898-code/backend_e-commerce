import Cart from "../models/cart.js"
import Product from "../models/products.js"

export const getCart=async(req,res)=>{
  try{
    const userId=req.user.id;
    let cart=await Cart.findOne({userId}).populate("items.productId","title price stock image");
    if(!cart){
      cart=await Cart.create({
        userId,
        items:[]
      })
    };
    res.status(200).json(cart);
  }catch(err){
    res.status(500).json({message:"Error al obtener el carrito"});
    console.error("Error: ",err.message);
  }
};

export const addProduct=async(req,res)=>{
  try{
    const userId=req.user.id;
    const {productId,quantity}=req.body;
    const product=await Product.findById(productId);
    if(!product){
      return res.status(400).json({message:"El producto no existe"});
    };
    if(product.stock < quantity){
      return res.status(400).json({message:"Stock insuficiente"});
    };
    let cart=await Cart.findOne({userId});
    if(!cart){
      cart=await Cart.create({
        userId,
        items:[{productId,quantity}]
      })
      return res.status(201).json(cart)
    };
    const itemIndex=cart.items.findIndex(item => item.productId.toString() === productId);
    
    if(itemIndex > -1){
      cart.items[itemIndex].quantity += quantity;
    }else{
      cart.items.push({productId,quantity});
    }
    await cart.save();
    res.status(200).json(cart);
    
  }catch(err){
    res.status(500).json({error:"Error sl agregar un producto al csrrrito"});
    console.error("Error: ",err.message);
  }
}

export const restProduct=async(req,res)=>{
  try{
    const userId=req.user.id;
    const {productId}=req.params;

    let cart=await Cart.findOne({userId});
    if(!cart){
      return res.status(404).json({message:"El carrito no existe"});
    }
    const itemIndex=cart.items.findIndex(item=>item.productId.equals(productId));
    if(itemIndex === -1){
      return res.status(404).json({
        message:"El producto no se encuentra en el carriti"
      });
    };
    const item=cart.items[itemIndex];
    if(item.quantity > 1){
      item.quantity-=1
    }else{
      cart.items.splice(itemIndex,1)
    }
    await cart.save();
    return res.status(200).json(cart);
    }catch(err){
    res.status(500).json({message:"Error interno del servidor sl eliminar un producto"});
    console.error("Error: ",err.message);
  }
}

export const deleteProduct=async(req,res)=>{
  try{
  const userId=req.user.id;
  const{productId}=req.params
  const cart=await Cart.findOne({userId});
  if(!cart){
    return res.status(404).json({message:"El carrito no existe"});
  };
  const itemIndex=cart.items.findIndex(item=>item.productId.equals(productId));
  if(itemIndex === -1){
    return res.status(404).json({message:"El producto no existe en el carrito"});
  };
  
    cart.items.splice(itemIndex,1);
  
  await cart.save();
  return res.status(200).json(cart);
  }catch(err){
    console.error("Error: ",err.message)
    return res.status(500).json({message:"Errir al eliminar un producto del carrito"});
  }
}

export const deleteCart=async(req,res)=>{
  try{
    const userId=req.user.id;
    const result=await Cart.updateOne(
        {userId},
        {$set:{items:[]}}
      );
      if(result.maychedCount===0){
        return res.status(404).json({
          message:"El carrito no existe"
        });
      };
      res.status(200).json({
        message:"Carrito vaciado correctamente"
      });
  }catch(err){
    res.status(500).json({message:"Error al vaciar el carrito"});
    console.error("Error: ",err.message);
  }
}