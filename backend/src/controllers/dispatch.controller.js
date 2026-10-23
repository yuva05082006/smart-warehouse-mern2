import Dispatch from "../models/Dispatch.js";
import Order from "../models/Order.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function generateDispatchNumber() {
  return "DSP-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000);
}

export const listDispatches = asyncHandler(async (req, res) => {
  const dispatches = await Dispatch.find()
    .populate({ path: "order", select: "orderNumber customerName status" })
    .sort({ dispatchDate: 1 });
  res.json(dispatches);
});

/**
 * Dispatches an order. Deliberately does NOT touch product inventory -
 * stock was already deducted during picking (see picking.controller.js).
 * The unique index on Dispatch.order also guarantees an order can only
 * ever be dispatched once, at the database level.
 */
export const createDispatch = asyncHandler(async (req, res) => {
  const { orderId, carrier, trackingNumber, notes } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw notFound("Order not found.");

  if (!["PICKED", "READY_FOR_DISPATCH"].includes(order.status)) {
    throw badRequest(`Order must be PICKED or READY_FOR_DISPATCH to dispatch it (current status: ${order.status}).`);
  }

  const existing = await Dispatch.findOne({ order: order._id });
  if (existing) throw badRequest("This order has already been dispatched.");

  const dispatch = await Dispatch.create({
    dispatchNumber: generateDispatchNumber(),
    order: order._id,
    carrier: (carrier || "").trim(),
    trackingNumber: (trackingNumber || "").trim(),
    dispatchedBy: req.user.username,
    notes: (notes || "").trim(),
    status: "DISPATCHED",
  });

  order.status = "DISPATCHED";
  await order.save();

  await logActivity({
    username: req.user.username,
    action: "DISPATCH",
    module: "DISPATCH",
    description: `Dispatched order ${order.orderNumber} (dispatch ${dispatch.dispatchNumber}).`,
    relatedRecord: `order:${order._id}`,
  });

  res.status(201).json(await dispatch.populate({ path: "order", select: "orderNumber customerName status" }));
});
