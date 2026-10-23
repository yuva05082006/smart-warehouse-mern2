import ActivityLog from "../models/ActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listActivityLogs = asyncHandler(async (req, res) => {
  const { module, username } = req.query;
  const filter = {};
  if (module) filter.module = module;
  if (username) filter.username = { $regex: username, $options: "i" };

  const logs = await ActivityLog.find(filter).sort({ timestamp: -1 }).limit(500);
  res.json(logs);
});
