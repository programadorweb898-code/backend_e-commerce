import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();

const connectDb=async()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conección exitosa a mongoDB")
  }catch(err){
    console.log("Error: ", err.message);
  }
}

export default connectDb;


