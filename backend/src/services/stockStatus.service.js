/**
 * Computes a product's live stock status from its current available
 * quantity vs its reorder level. Never stored - always calculated on
 * read, so it's always accurate. Same thresholds as the reference
 * project:
 *   0 available                  -> OUT_OF_STOCK
 *   available <= reorderLevel    -> LOW_STOCK
 *   available > 3x reorderLevel  -> OVERSTOCK   (only when reorderLevel > 0)
 *   otherwise                    -> IN_STOCK
 */
export function calculateStockStatus(availableQuantity, reorderLevel) {
  if (availableQuantity <= 0) return "OUT_OF_STOCK";
  if (availableQuantity <= reorderLevel) return "LOW_STOCK";
  if (reorderLevel > 0 && availableQuantity > reorderLevel * 3) return "OVERSTOCK";
  return "IN_STOCK";
}
