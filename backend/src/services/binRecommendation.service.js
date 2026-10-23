import Bin from "../models/Bin.js";
import Rack from "../models/Rack.js";
import Product from "../models/Product.js";
import { badRequest } from "../utils/ApiError.js";

/**
 * Rule-based (NOT machine learning) bin recommendation, identical in
 * spirit to the reference project's algorithm:
 *   1. The bin must have enough free capacity for the requested quantity.
 *   2. Prefer a bin that already stores the same product category
 *      (keeps similar stock together).
 *   3. Otherwise prefer the "best fit" bin - the one with the least
 *      remaining capacity that still satisfies the quantity (avoids
 *      wasting a huge bin on a small batch).
 * Explainable by design: the response always includes a plain-English
 * reason for the pick.
 */
export async function recommendBin({ category, quantity, warehouseId }) {
  if (!quantity || quantity <= 0) {
    throw badRequest("Quantity must be a positive number.");
  }

  const rackFilter = warehouseId ? { warehouse: warehouseId } : {};
  const racksInScope = warehouseId ? await Rack.find(rackFilter).select("_id") : null;
  const binFilter = warehouseId ? { rack: { $in: racksInScope.map((r) => r._id) } } : {};

  const bins = await Bin.find(binFilter).populate({ path: "rack", populate: { path: "warehouse" } });
  if (bins.length === 0) {
    throw badRequest("No bins exist yet. Create a warehouse, rack and bin first.");
  }

  const scored = [];
  for (const bin of bins) {
    const productsInBin = await Product.find({ bin: bin._id });
    const occupied = productsInBin.reduce((sum, p) => sum + p.availableQuantity + p.reservedQuantity, 0);
    const remaining = bin.capacity - occupied;
    if (remaining < quantity) continue; // rule 1: must fit

    const sameCategory = category
      ? productsInBin.some((p) => (p.category || "").toLowerCase() === category.toLowerCase())
      : false;

    scored.push({ bin, remaining, sameCategory });
  }

  if (scored.length === 0) {
    throw badRequest("No bin currently has enough free capacity for that quantity.");
  }

  // Rule 2 (category affinity) outranks rule 3 (best fit / tightest remaining capacity).
  scored.sort((a, b) => {
    if (a.sameCategory !== b.sameCategory) return a.sameCategory ? -1 : 1;
    return a.remaining - b.remaining;
  });

  const winner = scored[0];
  const reason = winner.sameCategory
    ? `This bin already stores products in the "${category}" category, keeping similar stock together, and has ${winner.remaining} unit(s) of free capacity.`
    : `This is the best-fit bin with enough free capacity (${winner.remaining} unit(s) remaining after placement) with the least wasted space.`;

  return {
    warehouseId: winner.bin.rack.warehouse._id,
    warehouseName: winner.bin.rack.warehouse.name,
    rackId: winner.bin.rack._id,
    rackCode: winner.bin.rack.code,
    binId: winner.bin._id,
    binCode: winner.bin.code,
    remainingCapacity: winner.remaining - quantity,
    reason,
  };
}
