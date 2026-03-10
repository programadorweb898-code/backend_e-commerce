import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod = null;

/**
 * Conecta a la base de datos en memoria.
 */
export const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Opciones básicas de conexión
  await mongoose.connect(uri);
};

/**
 * Cierra la conexión y detiene el servidor de la base de datos.
 */
export const closeDatabase = async () => {
  if (mongod) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  }
};

/**
 * Limpia todas las colecciones para que cada test empiece de cero.
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
