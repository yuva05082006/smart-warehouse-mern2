import Order from "../models/Order.js";
import PickingTask from "../models/PickingTask.js";
import Product from "../models/Product.js";
import { logActivity } from "../services/activityLogger.service.js";
import { badRequest, notFound } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const TASK_POPULATE = [
  { path: "product", select: "name sku unit" },
  { path: "order", select: "orderNumber customerName status" },
];

function withPickInstruction(task) {
  const obj = task.toObject ? task.toObject() : task;
  const productName = obj.product?.name || "?";
  obj.pickInstruction = `${productName} -> ${obj.warehouseName || "-"} -> ${obj.rackCode || "-"} -> ${obj.binCode || "-"} -> ${obj.requiredQuantity}`;
  return obj;
}

/** Creates one picking task per order line item and moves the order into PICKING. */
export const startPicking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate({
    path: "items.product",
    populate: [
      { path: "warehouse", select: "name" },
      { path: "rack", select: "code" },
      { path: "bin", select: "code" },
    ],
  });
  if (!order) throw notFound("Order not found.");

  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw badRequest(`Cannot start picking for an order in status ${order.status}.`);
  }

  const existingCount = await PickingTask.countDocuments({ order: order._id });
  if (existingCount > 0) {
    throw badRequest("Picking tasks already exist for this order.");
  }

  const tasks = [];
  for (const item of order.items) {
    const product = item.product; // already fully populated above
    tasks.push(
      await PickingTask.create({
        order: order._id,
        orderItemId: item._id,
        product: product._id,
        requiredQuantity: item.quantity,
        pickedQuantity: item.pickedQuantity,
        warehouseName: product.warehouse?.name || "",
        rackCode: product.rack?.code || "",
        binCode: product.bin?.code || "",
        status: "PENDING",
      })
    );
  }

  order.status = "PICKING";
  await order.save();

  await logActivity({
    username: req.user.username,
    action: "PICK",
    module: "PICKING",
    description: `Started picking for order ${order.orderNumber} (${tasks.length} task(s) created).`,
    relatedRecord: `order:${order._id}`,
  });

  res.status(201).json(tasks.map(withPickInstruction));
});

export const listPickingTasks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.orderId) filter.order = req.query.orderId;
  const tasks = await PickingTask.find(filter).populate(TASK_POPULATE).sort({ createdDate: 1 });
  res.json(tasks.map(withPickInstruction));
});

/**
 * Records a pick. This is where inventory is ACTUALLY deducted - the
 * picked amount is removed from the product's reservedQuantity entirely
 * (it has physically left the warehouse). This is the only place
 * deduction happens, so dispatch never double-deducts.
 */
export const recordPick = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw badRequest("Enter a positive quantity to pick.");

  const task = await PickingTask.findById(req.params.id);
  if (!task) throw notFound("Picking task not found.");
  if (task.status === "COMPLETED") throw badRequest("This task is already completed.");

  const remaining = task.requiredQuantity - task.pickedQuantity;
  if (qty > remaining) {
    throw badRequest(`Cannot pick ${qty} - only ${remaining} unit(s) remain for this task.`);
  }

  const product = await Product.findById(task.product);
  if (!product) throw notFound("Product for this task not found.");

  product.reservedQuantity = Math.max(0, product.reservedQuantity - qty);
  await product.save();

  task.pickedQuantity += qty;
  task.status = task.pickedQuantity >= task.requiredQuantity ? "COMPLETED" : "IN_PROGRESS";
  if (task.status === "COMPLETED") task.completedDate = new Date();
  await task.save();

  // Mirror the picked quantity onto the order's embedded line item.
  const order = await Order.findById(task.order);
  const item = order.items.id(task.orderItemId);
  if (item) {
    item.pickedQuantity += qty;
  }

  // If every task for this order is now complete, the order moves to PICKED.
  const outstanding = await PickingTask.countDocuments({ order: order._id, status: { $ne: "COMPLETED" } });
  if (outstanding === 0) {
    order.status = "PICKED";
  }
  await order.save();

  await logActivity({
    username: req.user.username,
    action: "PICK",
    module: "PICKING",
    description: `Picked ${qty} unit(s) of "${product.name}" for order ${order.orderNumber}.`,
    relatedRecord: `order:${order._id}`,
  });

  res.json(withPickInstruction(await task.populate(TASK_POPULATE)));
});
