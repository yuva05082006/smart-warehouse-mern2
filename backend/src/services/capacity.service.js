import Product from "../models/Product.js";

/** Sums (available + reserved) for every product stored in a given bin/rack/warehouse. */
export async function occupiedInBin(binId) {
  const products = await Product.find({ bin: binId });
  return products.reduce((sum, p) => sum + p.availableQuantity + p.reservedQuantity, 0);
}

export async function occupiedInRack(rackId) {
  const products = await Product.find({ rack: rackId });
  return products.reduce((sum, p) => sum + p.availableQuantity + p.reservedQuantity, 0);
}

export async function occupiedInWarehouse(warehouseId) {
  const products = await Product.find({ warehouse: warehouseId });
  return products.reduce((sum, p) => sum + p.availableQuantity + p.reservedQuantity, 0);
}
