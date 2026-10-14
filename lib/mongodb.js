import mongoose from "mongoose";

const MONGODB_URL="mongodb://127.0.0.1:27017/triplens"

if(!MONGODB_URL){
    throw new Error("mongodb is missing for some reason");
}
let cached=global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URL);
  }

  cached.conn = await cached.promise;

  return cached.conn;
}