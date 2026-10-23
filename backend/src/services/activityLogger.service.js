import ActivityLog from "../models/ActivityLog.js";

/**
 * Writes one activity log entry. Deliberately "fire and forget" at the
 * call site (callers can `await` it, but a logging failure should
 * never block the actual business operation) - callers wrap it in
 * try/catch if they want to be extra safe, but ActivityLog writes are
 * simple enough that failures here would be exceptional.
 */
export async function logActivity({ username, action, module, description, relatedRecord = "" }) {
  await ActivityLog.create({ username, action, module, description, relatedRecord });
}
