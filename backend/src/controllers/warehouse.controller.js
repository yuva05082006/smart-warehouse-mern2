import Warehouse from "../models/Warehouse.js";
import Rack from "../models/Rack.js";
import Product from "../models/Product.js";
import { occupiedInWarehouse } from "../services/capacity.service.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find().sort({ name: 1 });
  res.json(warehouses);
});

export const getWarehouseCapacity = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) throw notFound("Warehouse not found.");
  const occupied = await occupiedInWarehouse(warehouse._id);
  res.json({ capacity: warehouse.totalCapacity, occupied, available: Math.max(0, warehouse.totalCapacity - occupied) });
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const { name, location, totalCapacity } = req.body;
  if (!name || !name.trim()) throw badRequest("Warehouse name is required.");
  if (totalCapacity === undefined || Number(totalCapacity) < 0) throw badRequest("Total capacity must be zero or more.");

  const existing = await Warehouse.findOne({ name: name.trim() });
  if (existing) throw badRequest(`A warehouse named "${name}" already exists.`);

  const warehouse = await Warehouse.create({ name: name.trim(), location: (location || "").trim(), totalCapacity: Number(totalCapacity) });

  await logActivity({ username: req.user.username, action: "CREATE", module: "WAREHOUSE", description: `Created warehouse "${warehouse.name}".`, relatedRecord: `warehouse:${warehouse._id}` });

  res.status(201).json(warehouse);
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) throw notFound("Warehouse not found.");

  const { name, location, totalCapacity } = req.body;
  if (name !== undefined) warehouse.name = name.trim();
  if (location !== undefined) warehouse.location = location.trim();
  if (totalCapacity !== undefined) warehouse.totalCapacity = Number(totalCapacity);

  await warehouse.save();

  await logActivity({ username: req.user.username, action: "UPDATE", module: "WAREHOUSE", description: `Updated warehouse "${warehouse.name}".`, relatedRecord: `warehouse:${warehouse._id}` });

  res.json(warehouse);
});

export const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) throw notFound("Warehouse not found.");

  const rackCount = await Rack.countDocuments({ warehouse: warehouse._id });
  if (rackCount > 0) throw badRequest("Cannot delete a warehouse that still has racks. Delete its racks first.");

  const productCount = await Product.countDocuments({ warehouse: warehouse._id });
  if (productCount > 0) throw badRequest("Cannot delete a warehouse that still has products assigned to it.");

  await warehouse.deleteOne();

  await logActivity({ username: req.user.username, action: "DELETE", module: "WAREHOUSE", description: `Deleted warehouse "${warehouse.name}".`, relatedRecord: `warehouse:${warehouse._id}` });

  res.json({ message: "Warehouse deleted." });
});
