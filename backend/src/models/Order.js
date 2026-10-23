import mongoose from "mongoose";

/**
 * Order items are embedded sub-documents (Mongo-idiomatic for a
 * parent that always loads with its children). Each sub-document gets
 * its own _id automatically, which PickingTask.orderItem below points
 * back to - the equivalent of the old OrderItem table's primary key.
 */
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  pickedQuantity: { type: Number, required: true, min: 0, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerContact: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PICKING", "PICKED", "READY_FOR_DISPATCH", "DISPATCHED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: { createdAt: "createdDate", updatedAt: false } }
);

export default mongoose.model("Order", orderSchema);
