import mongoose,{Schema} from "mongoose"

const refreshSchema=new Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    unique:true
  },
  token:{
    type:String,
    required:true
  },
  createAt:{
    type:Date,
    default:Date.now,
    expires:"7d"
  }
});

export default mongoose.model("RefreshToken",refreshSchema)
