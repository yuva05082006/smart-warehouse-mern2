import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { unauthorized, badRequest } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../services/activityLogger.service.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw badRequest("Username and password are required.");
  }

  const user = await User.findOne({ username: username.trim() }).select("+password");
  if (!user || !user.active) {
    throw unauthorized("Invalid username or password.");
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    throw unauthorized("Invalid username or password.");
  }

  const token = generateToken(user);

  await logActivity({
    username: user.username,
    action: "LOGIN",
    module: "AUTH",
    description: `${user.fullName} logged in.`,
  });

  res.json({
    token,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  });
});

export const logout = asyncHandler(async (req, res) => {
  // JWTs are stateless, so there's nothing to invalidate server-side for
  // a college project's scope. We still log the action and let the
  // frontend discard its stored token.
  await logActivity({
    username: req.user.username,
    action: "LOGOUT",
    module: "AUTH",
    description: `${req.user.fullName} logged out.`,
  });
  res.json({ message: "Logged out." });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    username: req.user.username,
    fullName: req.user.fullName,
    role: req.user.role,
  });
});
