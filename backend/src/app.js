import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import rackRoutes from "./routes/rack.routes.js";
import binRoutes from "./routes/bin.routes.js";
import binRecommendationRoutes from "./routes/binRecommendation.routes.js";
import receivingRoutes from "./routes/receiving.routes.js";
import orderRoutes from "./routes/order.routes.js";
import pickingRoutes from "./routes/picking.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import activityLogRoutes from "./routes/activityLog.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const rawOrigins = process.env.CLIENT_ORIGIN || "";
const configuredOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // If CLIENT_ORIGIN is wildcard or not configured, or origin is in configured list
      if (
        configuredOrigins.length === 0 ||
        configuredOrigins.includes("*") ||
        configuredOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      // Fallback: allow to prevent unexpected production breakages
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/racks", rackRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/bin-recommendation", binRecommendationRoutes);
app.use("/api/receipts", receivingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/picking", pickingRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
