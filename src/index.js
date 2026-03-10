import app from "./app.js";
import connectDb from "../config/db.js";

const PORT = process.env.PORT || 3000;

// Conexión a la base de datos y arranque del servidor
connectDb();
app.listen(PORT, () => console.log(`Conexión establecida en el puerto ${PORT}`));
