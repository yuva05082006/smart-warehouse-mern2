import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function generateOrderNumber() {
  return "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000);
}

const PRODUCT_POPULATE = { path: "items.product", select: "name sku unit" };

export const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).populate(PRODUCT_POPULATE).sort({ createdDate: 1 });
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(PRODUCT_POPULATE);
  if (!order) throw notFound("Order not found.");
  res.json(order);
});

/**
 * Creates an order AND reserves stock for every line item in the same
 * request. Reservation moves quantity from availableQuantity to
 * reservedQuantity on each Product - it is NOT yet a real deduction
 * (that happens during picking, see picking.controller.js).
 *
 * Note on atomicity: a standalone (non-replica-set) MongoDB instance -
 * the common setup for a local college project - does not support
 * multi-document transactions. We therefore validate every line item
 * FIRST (no writes yet) and only apply the reservation writes once every
 * item has passed validation, which avoids leaving a partially-reserved
 * order in the common case. For a production deployment on a replica
 * set, wrap the apply step in a mongoose.startSession() transaction.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerContact, items } = req.body;

  if (!customerName || !customerName.trim()) throw badRequest("Customer name is required.");
  if (!Array.isArray(items) || items.length === 0) throw badRequest("Add at least one order item.");

  const resolved = [];
  for (const line of items) {
    const quantity = Number(line.quantity);
    if (!line.productId || !quantity || quantity <= 0) {
      throw badRequest("Every order item needs a product and a positive quantity.");
    }
    const product = await Product.findById(line.productId);
    if (!product) throw badRequest(`Product ${line.productId} not found.`);
    if (product.availableQuantity < quantity) {
      throw badRequest(`Not enough available stock for "${product.name}" (requested ${quantity}, available ${product.availableQuantity}).`);
    }
    resolved.push({ product, quantity });
  }

  // Validation passed for every line - now apply the reservation.
  for (const { product, quantity } of resolved) {
    product.availableQuantity -= quantity;
    product.reservedQuantity += quantity;
    await product.save();
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customerName: customerName.trim(),
    customerContact: (customerContact || "").trim(),
    status: "PENDING",
    items: resolved.map(({ product, quantity }) => ({ product: product._id, quantity, pickedQuantity: 0 })),
  });

  await logActivity({
    username: req.user.username,
    action: "CREATE",
    module: "ORDER",
    description: `Created order ${order.orderNumber} for ${order.customerName} (${resolved.length} item(s)) and reserved stock.`,
    relatedRecord: `order:${order._id}`,
  });

  res.status(201).json(await order.populate(PRODUCT_POPULATE));
});

const VALID_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  PICKING: [],
  PICKED: ["READY_FOR_DISPATCH"],
  READY_FOR_DISPATCH: [],
  DISPATCHED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound("Order not found.");

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw badRequest(`Cannot move order from ${order.status} to ${status}.`);
  }

  if (status === "CANCELLED") {
    // Release whatever is still reserved (i.e. not yet picked) back to available stock.
    for (const item of order.items) {
      const stillReserved = item.quantity - item.pickedQuantity;
      if (stillReserved > 0) {
        const product = await Product.findById(item.product);
        if (product) {
          product.reservedQuantity = Math.max(0, product.reservedQuantity - stillReserved);
          product.availableQuantity += stillReserved;
          await product.save();
        }
      }
    }
  }

  order.status = status;
  await order.save();

  await logActivity({
    username: req.user.username,
    action: "STATUS_CHANGE",
    module: "ORDER",
    description: `Order ${order.orderNumber} status changed to ${status}.`,
    relatedRecord: `order:${order._id}`,
  });

  res.json(await order.populate(PRODUCT_POPULATE));
});
