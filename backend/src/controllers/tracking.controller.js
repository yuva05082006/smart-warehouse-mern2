import mongoose from "mongoose";
import Product from "../models/Product.js";
import StockReceipt from "../models/StockReceipt.js";
import Order from "../models/Order.js";
import PickingTask from "../models/PickingTask.js";
import Dispatch from "../models/Dispatch.js";
import { calculateStockStatus } from "../services/stockStatus.service.js";
import { notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Looks a product up by its Mongo _id OR its SKU - the same dual lookup
 * the reference project offered (numeric ID or SKU), adapted to Mongo's
 * ObjectId strings. Also returns recent receiving/order/picking/dispatch
 * history for that product, since the reference project's Product
 * Tracking page showed that history too.
 */
export const trackProduct = asyncHandler(async (req, res) => {
  const idOrSku = req.params.idOrSku;
  const POPULATE = [
    { path: "warehouse", select: "name" },
    { path: "rack", select: "code" },
    { path: "bin", select: "code" },
  ];

  let product = null;
  if (mongoose.Types.ObjectId.isValid(idOrSku)) {
    product = await Product.findById(idOrSku).populate(POPULATE);
  }
  if (!product) {
    product = await Product.findOne({ sku: idOrSku.trim().toUpperCase() }).populate(POPULATE);
  }
  if (!product) throw notFound(`No product found for ID or SKU "${idOrSku}".`);

  const [receipts, orders, pickingTasks, dispatches] = await Promise.all([
    StockReceipt.find({ product: product._id }).sort({ receivedDate: -1 }).limit(10),
    Order.find({ "items.product": product._id }).select("orderNumber customerName status createdDate").sort({ createdDate: -1 }).limit(10),
    PickingTask.find({ product: product._id }).sort({ createdDate: -1 }).limit(10),
    Dispatch.find({ order: { $in: await Order.find({ "items.product": product._id }).distinct("_id") } }).sort({ dispatchDate: -1 }).limit(10),
  ]);

  res.json({
    id: product._id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    status: product.status,
    warehouseName: product.warehouse?.name || null,
    rackCode: product.rack?.code || null,
    binCode: product.bin?.code || null,
    availableQuantity: product.availableQuantity,
    reservedQuantity: product.reservedQuantity,
    reorderLevel: product.reorderLevel,
    stockStatus: calculateStockStatus(product.availableQuantity, product.reorderLevel),
    receivingHistory: receipts,
    orderHistory: orders,
    pickingHistory: pickingTasks,
    dispatchHistory: dispatches,
  });
});
