import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: { type: String, trim: true, default: "" },
    totalCapacity: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: "createdDate", updatedAt: false } }
);

export default mongoose.model("Warehouse", warehouseSchema);
