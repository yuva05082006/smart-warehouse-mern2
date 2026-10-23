import Product from "../models/Product.js";
import { calculateStockStatus } from "../services/stockStatus.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MESSAGES = {
  OUT_OF_STOCK: (p) => `"${p.name}" is out of stock. Reorder immediately.`,
  LOW_STOCK: (p) => `"${p.name}" is at or below its reorder level (${p.availableQuantity}/${p.reorderLevel}).`,
  OVERSTOCK: (p) => `"${p.name}" has more than 3x its reorder level in stock (${p.availableQuantity} units) - consider redistributing.`,
};

/** Computed live from current quantities - never stored, so it's always accurate. */
export const listAlerts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "ACTIVE" });
  const alerts = [];

  for (const p of products) {
    const stockStatus = calculateStockStatus(p.availableQuantity, p.reorderLevel);
    if (stockStatus === "IN_STOCK") continue;
    alerts.push({
      productId: p._id,
      productName: p.name,
      sku: p.sku,
      alertType: stockStatus,
      availableQuantity: p.availableQuantity,
      reorderLevel: p.reorderLevel,
      message: MESSAGES[stockStatus](p),
    });
  }

  // Most urgent first: out of stock, then low stock, then overstock.
  const order = { OUT_OF_STOCK: 0, LOW_STOCK: 1, OVERSTOCK: 2 };
  alerts.sort((a, b) => order[a.alertType] - order[b.alertType]);

  res.json(alerts);
});
