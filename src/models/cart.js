import mongoose,{Schema} from "mongoose"

const cartSchema=new Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    unique:true
  },
  items:[
      {
        productId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"Product",
          required:true
        },
        quantity:{
          type:Number,
          required:true,
          min:1
        },
        priceSnapShot:{
          type:Number,
          required:true
        }
      }
    ]
},{timestamps:true});

export default mongoose.model("Cart",cartSchema);