import mongoose from "mongoose";

/**
 * One picking task per order line item. warehouseName/rackCode/binCode
 * are denormalised (copied) at the moment picking starts, so the
 * instruction "PRODUCT -> WAREHOUSE -> RACK -> BIN -> QUANTITY" stays
 * stable even if the product is later moved to a different bin.
 */
const pickingTaskSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // _id of the sub-document in order.items
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    requiredQuantity: { type: Number, required: true, min: 1 },
    pickedQuantity: { type: Number, required: true, min: 0, default: 0 },
    warehouseName: { type: String, default: "" },
    rackCode: { type: String, default: "" },
    binCode: { type: String, default: "" },
    status: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED"], default: "PENDING" },
    notes: { type: String, trim: true, default: "" },
    completedDate: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdDate", updatedAt: false } }
);

export default mongoose.model("PickingTask", pickingTaskSchema);
