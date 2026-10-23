import Product from "../models/Product.js";
import { calculateStockStatus } from "../services/stockStatus.service.js";
import { notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const POPULATE = [
  { path: "warehouse", select: "name" },
  { path: "rack", select: "code" },
  { path: "bin", select: "code" },
];

function toInventoryResponse(p) {
  return {
    productId: p._id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    warehouseName: p.warehouse?.name || null,
    rackCode: p.rack?.code || null,
    binCode: p.bin?.code || null,
    availableQuantity: p.availableQuantity,
    reservedQuantity: p.reservedQuantity,
    reorderLevel: p.reorderLevel,
    stockStatus: calculateStockStatus(p.availableQuantity, p.reorderLevel),
  };
}

export const listInventory = asyncHandler(async (req, res) => {
  const products = await Product.find().populate(POPULATE).sort({ name: 1 });
  res.json(products.map(toInventoryResponse));
});

export const getInventoryForProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).populate(POPULATE);
  if (!product) throw notFound("Product not found.");
  res.json(toInventoryResponse(product));
});
