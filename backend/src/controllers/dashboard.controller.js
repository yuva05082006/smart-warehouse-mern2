import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Warehouse from "../models/Warehouse.js";
import ActivityLog from "../models/ActivityLog.js";
import { calculateStockStatus } from "../services/stockStatus.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Every number here is computed live from MongoDB - nothing is hardcoded. */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const products = await Product.find();

  const totalProducts = products.length;
  const totalInventoryUnits = products.reduce((sum, p) => sum + p.availableQuantity + p.reservedQuantity, 0);

  let lowStockCount = 0;
  let outOfStockCount = 0;
  const alerts = [];
  for (const p of products) {
    const status = calculateStockStatus(p.availableQuantity, p.reorderLevel);
    if (status === "LOW_STOCK") lowStockCount++;
    if (status === "OUT_OF_STOCK") outOfStockCount++;
    if (status !== "IN_STOCK") {
      alerts.push({ productId: p._id, productName: p.name, sku: p.sku, alertType: status, message: `${p.name}: ${status.replace(/_/g, " ").toLowerCase()}` });
    }
  }

  const [pendingOrders, pickingOrders, readyForDispatchOrders] = await Promise.all([
    Order.countDocuments({ status: "PENDING" }),
    Order.countDocuments({ status: "PICKING" }),
    Order.countDocuments({ status: "READY_FOR_DISPATCH" }),
  ]);

  const warehouses = await Warehouse.find();
  const totalWarehouseCapacity = warehouses.reduce((sum, w) => sum + w.totalCapacity, 0);
  const totalWarehouseOccupied = products.reduce((sum, p) => sum + (p.warehouse ? p.availableQuantity + p.reservedQuantity : 0), 0);

  const recentActivities = await ActivityLog.find().sort({ timestamp: -1 }).limit(10);

  res.json({
    totalProducts,
    totalInventoryUnits,
    lowStockCount,
    outOfStockCount,
    pendingOrders,
    pickingOrders,
    readyForDispatchOrders,
    totalWarehouseCapacity,
    totalWarehouseOccupied,
    recentActivities,
    alerts,
  });
});
