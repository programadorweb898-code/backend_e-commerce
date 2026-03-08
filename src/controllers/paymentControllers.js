import Stripe from "stripe"
import dotenv from "dotenv"
dotenv.config()

const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession=async(req,res)=>{
  try{
    const{items}=req.body;
    const sessions=await stripe.checkout.sessions.create({
      payment_methods_types:["card"],
      line_items:items.map(item=>({
        price_data:{
          currency:"usd",
          product_data:{
            name:item.name
          },
          unit_amount:item.price* 100
        },
        quantity:item.quantity
      })),
      mode:"payment",
      success_url:"http://localhost:5173/success",
      cancel_url:"http://localhost:5173/cancel"
    });
    res.json({url:session.url});
  }catch(err){
    next(err);
  }
}