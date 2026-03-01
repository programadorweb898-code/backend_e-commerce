import mongoose,{Schema} from "mongoose"
import bcrypt from "bcryptjs"

const userSchema=new Schema({
  email:{
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true,
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/,
      "Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
    ]}
},{timestamps:true});

userSchema.pre("save",async function (){
  if(!this.isModified("password")){
    return
  }
  const salt=await bcrypt.genSalt(10);
  this.password=await bcrypt.hash(this.password,salt);
})
const user=mongoose.model("User",userSchema);
export default user;



