import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { maybeSeed } from "../seed/seed.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  if (String(process.env.SEED_ON_START).toLowerCase() === "true") {
    await maybeSeed();
  }

  app.listen(PORT, () => {
    console.log(`[Server] Smart Warehouse API listening on http://localhost:${PORT}`);
  });
}

start();
