import app from "./app.js";
import connectDb from "../config/db.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
};

startServer();
