import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

/**
 * Serverless function entry point for Vercel.
 * Reuses Mongoose connection across invocations.
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("[Vercel Serverless] DB connection error:", err.message);
    return res.status(500).json({
      message: "Database connection failed. Please ensure MONGO_URI is set correctly in environment variables.",
      error: err.message,
    });
  }

  return app(req, res);
}
