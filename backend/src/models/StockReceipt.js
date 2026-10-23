import mongoose from "mongoose";

const stockReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    supplier: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    rack: { type: mongoose.Schema.Types.ObjectId, ref: "Rack", default: null },
    bin: { type: mongoose.Schema.Types.ObjectId, ref: "Bin", default: null },
    receivedDate: { type: Date, default: Date.now },
    receivedBy: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: false }
);

export default mongoose.model("StockReceipt", stockReceiptSchema);
