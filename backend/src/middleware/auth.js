import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { unauthorized, forbidden } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Verifies the "Authorization: Bearer <token>" header, loads the
 * corresponding user, and attaches it to req.user. Every protected
 * route uses this first.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw unauthorized("No authentication token provided.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw unauthorized("Session expired or invalid token. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.active) {
    throw unauthorized("User account not found or inactive.");
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to one or more roles, e.g. requireRole("MANAGER").
 * Must run after protect().
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden(`This action requires one of these roles: ${roles.join(", ")}.`));
    }
    next();
  };
