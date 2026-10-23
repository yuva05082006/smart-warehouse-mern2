import Rack from "../models/Rack.js";
import Bin from "../models/Bin.js";
import Product from "../models/Product.js";
import Warehouse from "../models/Warehouse.js";
import { occupiedInRack } from "../services/capacity.service.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const POPULATE = { path: "warehouse", select: "name" };

export const listRacks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.warehouseId) filter.warehouse = req.query.warehouseId;
  const racks = await Rack.find(filter).populate(POPULATE).sort({ code: 1 });
  res.json(racks);
});

export const getRackCapacity = asyncHandler(async (req, res) => {
  const rack = await Rack.findById(req.params.id);
  if (!rack) throw notFound("Rack not found.");
  const occupied = await occupiedInRack(rack._id);
  res.json({ capacity: rack.capacity, occupied, available: Math.max(0, rack.capacity - occupied) });
});

export const createRack = asyncHandler(async (req, res) => {
  const { warehouseId, code, capacity } = req.body;
  if (!warehouseId || !code || !code.trim()) throw badRequest("Warehouse and rack code are required.");
  if (capacity === undefined || Number(capacity) < 0) throw badRequest("Capacity must be zero or more.");

  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) throw badRequest("Selected warehouse does not exist.");

  const clash = await Rack.findOne({ code: code.trim(), warehouse: warehouseId });
  if (clash) throw badRequest(`Rack code "${code}" already exists in this warehouse.`);

  const rack = await Rack.create({ code: code.trim(), capacity: Number(capacity), warehouse: warehouseId });

  await logActivity({ username: req.user.username, action: "CREATE", module: "RACK", description: `Created rack "${rack.code}" in warehouse "${warehouse.name}".`, relatedRecord: `rack:${rack._id}` });

  res.status(201).json(await rack.populate(POPULATE));
});

export const updateRack = asyncHandler(async (req, res) => {
  const rack = await Rack.findById(req.params.id);
  if (!rack) throw notFound("Rack not found.");

  const { warehouseId, code, capacity } = req.body;
  if (warehouseId !== undefined) rack.warehouse = warehouseId;
  if (code !== undefined) rack.code = code.trim();
  if (capacity !== undefined) rack.capacity = Number(capacity);

  await rack.save();

  await logActivity({ username: req.user.username, action: "UPDATE", module: "RACK", description: `Updated rack "${rack.code}".`, relatedRecord: `rack:${rack._id}` });

  res.json(await rack.populate(POPULATE));
});

export const deleteRack = asyncHandler(async (req, res) => {
  const rack = await Rack.findById(req.params.id);
  if (!rack) throw notFound("Rack not found.");

  const binCount = await Bin.countDocuments({ rack: rack._id });
  if (binCount > 0) throw badRequest("Cannot delete a rack that still has bins. Delete its bins first.");

  const productCount = await Product.countDocuments({ rack: rack._id });
  if (productCount > 0) throw badRequest("Cannot delete a rack that still has products assigned to it.");

  await rack.deleteOne();

  await logActivity({ username: req.user.username, action: "DELETE", module: "RACK", description: `Deleted rack "${rack.code}".`, relatedRecord: `rack:${rack._id}` });

  res.json({ message: "Rack deleted." });
});
