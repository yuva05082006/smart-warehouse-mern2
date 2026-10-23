import mongoose from "mongoose";

const rackSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 0 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
});

// A rack code only needs to be unique within its own warehouse.
rackSchema.index({ code: 1, warehouse: 1 }, { unique: true });

export default mongoose.model("Rack", rackSchema);
