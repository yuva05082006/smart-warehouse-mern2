import Bin from "../models/Bin.js";
import Rack from "../models/Rack.js";
import Product from "../models/Product.js";
import { occupiedInBin } from "../services/capacity.service.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const POPULATE = { path: "rack", select: "code warehouse", populate: { path: "warehouse", select: "name" } };

export const listBins = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.rackId) filter.rack = req.query.rackId;
  else if (req.query.warehouseId) {
    const racks = await Rack.find({ warehouse: req.query.warehouseId }).select("_id");
    filter.rack = { $in: racks.map((r) => r._id) };
  }
  const bins = await Bin.find(filter).populate(POPULATE).sort({ code: 1 });
  res.json(bins);
});

export const getBinCapacity = asyncHandler(async (req, res) => {
  const bin = await Bin.findById(req.params.id);
  if (!bin) throw notFound("Bin not found.");
  const occupied = await occupiedInBin(bin._id);
  res.json({ capacity: bin.capacity, occupied, available: Math.max(0, bin.capacity - occupied) });
});

export const createBin = asyncHandler(async (req, res) => {
  const { rackId, code, capacity } = req.body;
  if (!rackId || !code || !code.trim()) throw badRequest("Rack and bin code are required.");
  if (capacity === undefined || Number(capacity) < 0) throw badRequest("Capacity must be zero or more.");

  const rack = await Rack.findById(rackId);
  if (!rack) throw badRequest("Selected rack does not exist.");

  const clash = await Bin.findOne({ code: code.trim(), rack: rackId });
  if (clash) throw badRequest(`Bin code "${code}" already exists in this rack.`);

  const bin = await Bin.create({ code: code.trim(), capacity: Number(capacity), rack: rackId });

  await logActivity({ username: req.user.username, action: "CREATE", module: "BIN", description: `Created bin "${bin.code}" in rack "${rack.code}".`, relatedRecord: `bin:${bin._id}` });

  res.status(201).json(await bin.populate(POPULATE));
});

export const updateBin = asyncHandler(async (req, res) => {
  const bin = await Bin.findById(req.params.id);
  if (!bin) throw notFound("Bin not found.");

  const { rackId, code, capacity } = req.body;
  if (rackId !== undefined) bin.rack = rackId;
  if (code !== undefined) bin.code = code.trim();
  if (capacity !== undefined) bin.capacity = Number(capacity);

  await bin.save();

  await logActivity({ username: req.user.username, action: "UPDATE", module: "BIN", description: `Updated bin "${bin.code}".`, relatedRecord: `bin:${bin._id}` });

  res.json(await bin.populate(POPULATE));
});

export const deleteBin = asyncHandler(async (req, res) => {
  const bin = await Bin.findById(req.params.id);
  if (!bin) throw notFound("Bin not found.");

  const productCount = await Product.countDocuments({ bin: bin._id });
  if (productCount > 0) throw badRequest("Cannot delete a bin that still has products assigned to it.");

  await bin.deleteOne();

  await logActivity({ username: req.user.username, action: "DELETE", module: "BIN", description: `Deleted bin "${bin.code}".`, relatedRecord: `bin:${bin._id}` });

  res.json({ message: "Bin deleted." });
});
