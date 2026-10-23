import mongoose from "mongoose";

const dispatchSchema = new mongoose.Schema(
  {
    dispatchNumber: { type: String, required: true, unique: true, trim: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true }, // one dispatch per order
    dispatchDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"], default: "DISPATCHED" },
    carrier: { type: String, trim: true, default: "" },
    trackingNumber: { type: String, trim: true, default: "" },
    dispatchedBy: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: false }
);

export default mongoose.model("Dispatch", dispatchSchema);
