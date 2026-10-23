import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false }, // bcrypt hash, excluded from queries by default
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["MANAGER", "STAFF"], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdDate", updatedAt: false } }
);

export default mongoose.model("User", userSchema);
