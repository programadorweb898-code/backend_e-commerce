
export const getProducts=async(req,res,next)=>{
  const{max,min}=req.query;
  try{
    const response=await fetch("http://fakestoreapi.com/products");
    if(!response.ok){
      throw new Error("Error al obtener todos los productos")
    }

    let result=await response.json();
    const filtered=result.filter((items)=>{
      const price=items.price;
      if(min && price < Number(min)) return false;
      if(max && price > Number(max) ) return false;
      return true;
    })
    res.json({productos:filtered});
  }catch(err){
    next(err)
  }
};

export const getProduct=async(req,res,next)=>{
  try{
    const response=await fetch(`http://fakestoreapi.com/products/${req.params.id}`);
    if(!response.ok){
      throw new Error("Error al obtener un producto")
    };
    const result=await response.json();
    res.json({producto:result})
  }catch(err){
    next(err)
  }
};;

export const getCategoryProducts=async(req,res,next)=>{
  try{
    const response=await fetch(`http://fakestoreapi.com/products/category/${req.params.category}`);
    if(!response.ok){
      throw new Error("La categoria no existe");
    };
    const result=await response.json();
    res.json({productos:result})
  }catch(err){
    next(err);
  }
}