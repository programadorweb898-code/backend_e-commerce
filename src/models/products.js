import mongoose, {Schema} from "mongoose"

const productSchema=new Schema({
  fakeStoreId:{
    type:Number,
    required:true,
    unique:true
  },
  title:{
    type:String,
    required:true
  },
  price:{
    type:Number,
    required:true
  },
  description:String,
  category:String,
  image:String,
  stock:{
    type:Number,
    default:10
  },
  isActive:{
    type:Boolean,
    default:true
  }
},{timestamps:true});

export default mongoose.model("product",productSchema);