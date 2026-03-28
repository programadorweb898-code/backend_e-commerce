import app from "./app.js";
import connectDb from "../config/db.js";

const PORT = process.env.PORT || 4000;

connectDb();
app.listen(PORT);
