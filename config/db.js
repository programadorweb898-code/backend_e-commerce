import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();

const connectDb=async()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI);
  }catch(err){
    console.error("Error: ", err.message);
  }
}

export default connectDb;


