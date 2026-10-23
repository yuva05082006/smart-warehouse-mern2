import mongoose from "mongoose";

let isConnecting = false;

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Reuses existing connection if available (crucial for serverless environments like Vercel).
 */
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not set. Please set MONGO_URI in your environment variables.");
    }
    isConnecting = true;
    const conn = await mongoose.connect(uri);
    isConnecting = false;
    console.log(`[DB] MongoDB connected -> ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnecting = false;
    console.error(`[DB] Connection failed: ${err.message}`);
    if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw err;
  }
}
