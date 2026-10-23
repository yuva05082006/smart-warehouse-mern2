import mongoose from "mongoose";

/**
 * MERN design note: the old Java version kept a separate Inventory table
 * (one-to-one with Product) because a relational schema needs a join
 * table for that. In MongoDB a one-to-one relationship is more naturally
 * modeled as embedded fields on the owning document, so availableQuantity
 * and reservedQuantity live directly on the Product here. Every module
 * that used to read/write the Inventory table now reads/writes these two
 * fields on Product instead - the business meaning is identical.
 */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    unit: { type: String, trim: true, default: "" },
    reorderLevel: { type: Number, required: true, min: 0, default: 0 },

    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    rack: { type: mongoose.Schema.Types.ObjectId, ref: "Rack", default: null },
    bin: { type: mongoose.Schema.Types.ObjectId, ref: "Bin", default: null },

    status: { type: String, enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"], default: "ACTIVE" },

    availableQuantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: { createdAt: "createdDate", updatedAt: "updatedDate" } }
);

productSchema.index({ name: "text", sku: "text", category: "text" });

export default mongoose.model("Product", productSchema);
