import Product from "../models/Product.js";
import { calculateStockStatus } from "../services/stockStatus.service.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function toProductResponse(p) {
  return {
    id: p._id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    description: p.description,
    unit: p.unit,
    reorderLevel: p.reorderLevel,
    warehouseId: p.warehouse?._id || p.warehouse || null,
    warehouseName: p.warehouse?.name || null,
    rackId: p.rack?._id || p.rack || null,
    rackCode: p.rack?.code || null,
    binId: p.bin?._id || p.bin || null,
    binCode: p.bin?.code || null,
    status: p.status,
    availableQuantity: p.availableQuantity,
    reservedQuantity: p.reservedQuantity,
    stockStatus: calculateStockStatus(p.availableQuantity, p.reorderLevel),
    createdDate: p.createdDate,
    updatedDate: p.updatedDate,
  };
}

const POPULATE = [
  { path: "warehouse", select: "name" },
  { path: "rack", select: "code" },
  { path: "bin", select: "code" },
];

export const listProducts = asyncHandler(async (req, res) => {
  const { keyword, category, status, sortBy } = req.query;
  const filter = {};

  if (keyword) {
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { sku: { $regex: keyword, $options: "i" } },
    ];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;

  let query = Product.find(filter).populate(POPULATE);

  const sortMap = {
    name: { name: 1 },
    sku: { sku: 1 },
    category: { category: 1 },
    quantity: { availableQuantity: -1 },
  };
  if (sortBy && sortMap[sortBy]) query = query.sort(sortMap[sortBy]);
  else query = query.sort({ createdDate: -1 });

  const products = await query;
  res.json(products.map(toProductResponse));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(POPULATE);
  if (!product) throw notFound("Product not found.");
  res.json(toProductResponse(product));
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, description, unit, reorderLevel, warehouseId, rackId, binId, status, initialQuantity } = req.body;

  if (!name || !sku) throw badRequest("Product name and SKU are required.");

  const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
  if (existing) throw badRequest(`SKU "${sku}" is already in use.`);

  const product = await Product.create({
    name: name.trim(),
    sku: sku.trim(),
    category: (category || "").trim(),
    description: (description || "").trim(),
    unit: (unit || "").trim(),
    reorderLevel: Number(reorderLevel) || 0,
    warehouse: warehouseId || null,
    rack: rackId || null,
    bin: binId || null,
    status: status || "ACTIVE",
    availableQuantity: Math.max(0, Number(initialQuantity) || 0),
    reservedQuantity: 0,
  });

  await logActivity({
    username: req.user.username,
    action: "CREATE",
    module: "PRODUCT",
    description: `Created product "${product.name}" (${product.sku}).`,
    relatedRecord: `product:${product._id}`,
  });

  const populated = await product.populate(POPULATE);
  res.status(201).json(toProductResponse(populated));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound("Product not found.");

  const { name, sku, category, description, unit, reorderLevel, warehouseId, rackId, binId, status } = req.body;

  if (sku && sku.trim().toUpperCase() !== product.sku) {
    const clash = await Product.findOne({ sku: sku.trim().toUpperCase(), _id: { $ne: product._id } });
    if (clash) throw badRequest(`SKU "${sku}" is already in use.`);
    product.sku = sku.trim();
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (unit !== undefined) product.unit = unit.trim();
  if (reorderLevel !== undefined) product.reorderLevel = Number(reorderLevel) || 0;
  if (warehouseId !== undefined) product.warehouse = warehouseId || null;
  if (rackId !== undefined) product.rack = rackId || null;
  if (binId !== undefined) product.bin = binId || null;
  if (status !== undefined) product.status = status;

  await product.save();

  await logActivity({
    username: req.user.username,
    action: "UPDATE",
    module: "PRODUCT",
    description: `Updated product "${product.name}" (${product.sku}).`,
    relatedRecord: `product:${product._id}`,
  });

  const populated = await product.populate(POPULATE);
  res.json(toProductResponse(populated));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound("Product not found.");

  if (product.availableQuantity > 0 || product.reservedQuantity > 0) {
    throw badRequest("Cannot delete a product that still has stock. Dispatch or adjust its inventory to zero first.");
  }

  await product.deleteOne();

  await logActivity({
    username: req.user.username,
    action: "DELETE",
    module: "PRODUCT",
    description: `Deleted product "${product.name}" (${product.sku}).`,
    relatedRecord: `product:${product._id}`,
  });

  res.json({ message: "Product deleted." });
});
