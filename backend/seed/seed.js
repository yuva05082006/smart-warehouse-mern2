import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

import User from "../src/models/User.js";
import Warehouse from "../src/models/Warehouse.js";
import Rack from "../src/models/Rack.js";
import Bin from "../src/models/Bin.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";

/**
 * Inserts the same demo dataset as the reference project's DataSeeder:
 * 2 users, 2 warehouses, 3 racks, 5 bins, 9 realistic products (one
 * deliberately low stock, one out of stock, one overstocked), and one
 * sample order with reserved stock. Only runs if the "users" collection
 * is empty, so it's always safe to call again.
 */
export async function maybeSeed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log("[Seed] Data already present -> skipping demo data seed.");
    return;
  }

  console.log("[Seed] Empty database detected -> inserting demo data...");

  const managerPasswordHash = await bcrypt.hash("manager123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);

  await User.create([
    { username: "manager", password: managerPasswordHash, fullName: "Priya Sharma (Manager)", role: "MANAGER" },
    { username: "staff", password: staffPasswordHash, fullName: "Arun Kumar (Staff)", role: "STAFF" },
  ]);

  const mainWarehouse = await Warehouse.create({ name: "Chennai Central Warehouse", location: "Chennai, Tamil Nadu", totalCapacity: 5000 });
  const secondaryWarehouse = await Warehouse.create({ name: "Coimbatore Distribution Center", location: "Coimbatore, Tamil Nadu", totalCapacity: 2000 });

  const rackA = await Rack.create({ code: "A1", capacity: 800, warehouse: mainWarehouse._id });
  const rackB = await Rack.create({ code: "A2", capacity: 800, warehouse: mainWarehouse._id });
  const rackC = await Rack.create({ code: "B1", capacity: 600, warehouse: secondaryWarehouse._id });

  const binA1 = await Bin.create({ code: "A1-BIN-01", capacity: 200, rack: rackA._id });
  const binA2 = await Bin.create({ code: "A2-BIN-01", capacity: 250, rack: rackB._id });
  const binB1 = await Bin.create({ code: "A2-BIN-02", capacity: 250, rack: rackB._id });
  const binB2 = await Bin.create({ code: "A2-BIN-03", capacity: 250, rack: rackB._id });
  const binC1 = await Bin.create({ code: "B1-BIN-01", capacity: 300, rack: rackC._id });

  const products = await Product.create([
    { name: "Dell Latitude Laptop", sku: "LAP-001", category: "Electronics", description: "14-inch business laptop, 16GB RAM", unit: "pcs", reorderLevel: 10, warehouse: mainWarehouse._id, rack: rackA._id, bin: binA1._id, availableQuantity: 24 },
    { name: "Mechanical Keyboard", sku: "KEY-001", category: "Electronics", description: "Wired mechanical keyboard", unit: "pcs", reorderLevel: 15, warehouse: mainWarehouse._id, rack: rackA._id, bin: binA1._id, availableQuantity: 60 },
    { name: "Wireless Mouse", sku: "MOU-001", category: "Electronics", description: "2.4GHz wireless mouse", unit: "pcs", reorderLevel: 20, warehouse: mainWarehouse._id, rack: rackB._id, bin: binA2._id, availableQuantity: 3 }, // deliberately LOW_STOCK
    { name: "27-inch Monitor", sku: "MON-001", category: "Electronics", description: "27-inch 1440p IPS monitor", unit: "pcs", reorderLevel: 8, warehouse: mainWarehouse._id, rack: rackB._id, bin: binB1._id, availableQuantity: 35 },
    { name: "Noise-Cancelling Headphones", sku: "HPH-001", category: "Electronics", description: "Over-ear ANC headphones", unit: "pcs", reorderLevel: 12, warehouse: mainWarehouse._id, rack: rackB._id, bin: binB1._id, availableQuantity: 42 },
    { name: "LaserJet Printer", sku: "PRN-001", category: "Electronics", description: "Monochrome laser printer", unit: "pcs", reorderLevel: 5, warehouse: mainWarehouse._id, rack: rackB._id, bin: binB2._id, availableQuantity: 0 }, // deliberately OUT_OF_STOCK
    { name: "Ergonomic Office Chair", sku: "CHR-001", category: "Furniture", description: "Mesh-back ergonomic chair", unit: "pcs", reorderLevel: 6, warehouse: secondaryWarehouse._id, rack: rackC._id, bin: binC1._id, availableQuantity: 18 },
    { name: "HDMI Cable 2m", sku: "CBL-001", category: "Accessories", description: "High-speed HDMI 2.1 cable", unit: "pcs", reorderLevel: 30, warehouse: secondaryWarehouse._id, rack: rackC._id, bin: binC1._id, availableQuantity: 150 }, // deliberately OVERSTOCK
    { name: "WiFi 6 Router", sku: "RTR-001", category: "Electronics", description: "Dual-band WiFi 6 router", unit: "pcs", reorderLevel: 10, availableQuantity: 12 }, // deliberately unassigned to any location
  ]);

  // One sample order, reserving stock for two of the products above.
  const laptop = products.find((p) => p.sku === "LAP-001");
  const keyboard = products.find((p) => p.sku === "KEY-001");

  laptop.availableQuantity -= 2;
  laptop.reservedQuantity += 2;
  keyboard.availableQuantity -= 5;
  keyboard.reservedQuantity += 5;
  await laptop.save();
  await keyboard.save();

  await Order.create({
    orderNumber: "ORD-DEMO-0001",
    customerName: "Vellore Tech Solutions",
    customerContact: "contact@velloretech.example",
    status: "PENDING",
    items: [
      { product: laptop._id, quantity: 2, pickedQuantity: 0 },
      { product: keyboard._id, quantity: 5, pickedQuantity: 0 },
    ],
  });

  console.log("[Seed] Demo data inserted successfully.");
  console.log("[Seed] Demo login -> manager / manager123   and   staff / staff123");
}

// Allows running this file directly: `npm run seed`
const isDirectRun = process.argv[1] && process.argv[1].endsWith("seed.js");
if (isDirectRun) {
  connectDB()
    .then(maybeSeed)
    .then(() => mongoose.connection.close())
    .catch((err) => {
      console.error("[Seed] Failed:", err);
      process.exit(1);
    });
}
