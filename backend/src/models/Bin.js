import mongoose from "mongoose";

const binSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 0 },
  rack: { type: mongoose.Schema.Types.ObjectId, ref: "Rack", required: true },
});

// A bin code only needs to be unique within its own rack.
binSchema.index({ code: 1, rack: 1 }, { unique: true });

export default mongoose.model("Bin", binSchema);
