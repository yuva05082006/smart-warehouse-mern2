import { recommendBin } from "../services/binRecommendation.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getBinRecommendation = asyncHandler(async (req, res) => {
  const { category, quantity, warehouseId } = req.query;
  const result = await recommendBin({
    category: category || null,
    quantity: Number(quantity),
    warehouseId: warehouseId || null,
  });
  res.json(result);
});
