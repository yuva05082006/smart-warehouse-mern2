import StockReceipt from "../models/StockReceipt.js";
import Product from "../models/Product.js";
import Bin from "../models/Bin.js";
import { occupiedInBin } from "../services/capacity.service.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function generateReceiptNumber() {
  return "RCPT-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000);
}

export const listReceipts = asyncHandler(async (req, res) => {
  const receipts = await StockReceipt.find()
    .populate("product", "name sku")
    .populate("warehouse", "name")
    .populate("rack", "code")
    .populate("bin", "code")
    .sort({ receivedDate: 1 });
  res.json(receipts);
});

export const createReceipt = asyncHandler(async (req, res) => {
  const { productId, supplier, quantity, binId, notes } = req.body;

  if (!productId || !quantity || Number(quantity) <= 0) {
    throw badRequest("Product and a positive quantity are required.");
  }

  const product = await Product.findById(productId);
  if (!product) throw notFound("Product not found.");

  const qty = Number(quantity);
  const targetBinId = binId || product.bin;

  // If we know which bin the stock is going into, make sure it actually fits.
  if (targetBinId) {
    const bin = await Bin.findById(targetBinId);
    if (!bin) throw badRequest("Selected bin does not exist.");
    const occupied = await occupiedInBin(bin._id);
    const remaining = bin.capacity - occupied;
    if (qty > remaining) {
      throw badRequest(`Bin "${bin.code}" only has ${remaining} unit(s) of free capacity - cannot receive ${qty}.`);
    }
    // First-time receiving into a bin the product wasn't already assigned to: assign it.
    if (!product.bin) {
      const populatedBin = await bin.populate("rack");
      product.bin = bin._id;
      product.rack = populatedBin.rack._id;
      product.warehouse = populatedBin.rack.warehouse;
    }
  }

  product.availableQuantity += qty;
  await product.save();

  const receipt = await StockReceipt.create({
    receiptNumber: generateReceiptNumber(),
    product: product._id,
    supplier: (supplier || "").trim(),
    quantity: qty,
    warehouse: product.warehouse || null,
    rack: product.rack || null,
    bin: product.bin || null,
    receivedBy: req.user.username,
    notes: (notes || "").trim(),
  });

  await logActivity({
    username: req.user.username,
    action: "RECEIVE",
    module: "RECEIVING",
    description: `Received ${qty} unit(s) of "${product.name}" (${product.sku}).`,
    relatedRecord: `receipt:${receipt._id}`,
  });

  const populated = await receipt.populate([
    { path: "product", select: "name sku" },
    { path: "warehouse", select: "name" },
    { path: "rack", select: "code" },
    { path: "bin", select: "code" },
  ]);
  res.status(201).json(populated);
});
