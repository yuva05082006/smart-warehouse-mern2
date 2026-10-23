import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    action: { type: String, required: true }, // CREATE, UPDATE, DELETE, RECEIVE, PICK, DISPATCH, STATUS_CHANGE, LOGIN, LOGOUT
    module: { type: String, required: true }, // PRODUCT, WAREHOUSE, RACK, BIN, RECEIVING, ORDER, PICKING, DISPATCH, AUTH
    description: { type: String, required: true },
    relatedRecord: { type: String, default: "" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

export default mongoose.model("ActivityLog", activityLogSchema);
