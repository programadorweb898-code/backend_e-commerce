import Products from "./src/models/products.js"
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();

const seedProducts=async()=>{
  await mongoose.connect(process.env.MONGO_URI);
  const response=await fetch("http://fakestoreapi.com/products");
  if(!response.ok){
    throw new Error("Error al cargar oroductos con seed");
  };
  const data=await response.json();
  for(const items of data){
    await Products.create({
      fakeStoreId:items.id,
      title:items.title,
      price:items.price,
      description:items.description,
      category:items.category,
      image:items.image,
      stock:10
    })
  }
  console.log("productos insertados");
  process.exit();
}
seedProducts();
