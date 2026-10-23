import { ApiError } from "../utils/ApiError.js";

/** Converts a Mongoose/Mongo error into a consistent ApiError-shaped response. */
function normalizeError(err) {
  // Mongoose validation error -> 400 with field-level messages.
  if (err.name === "ValidationError") {
    const fieldErrors = {};
    for (const field in err.errors) {
      fieldErrors[field] = err.errors[field].message;
    }
    return { statusCode: 400, message: "Validation failed.", fieldErrors };
  }

  // Mongoose CastError -> usually a malformed ObjectId in a URL param.
  if (err.name === "CastError") {
    return { statusCode: 400, message: `Invalid value for "${err.path}".` };
  }

  // MongoDB duplicate key error -> a unique index was violated.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return { statusCode: 409, message: `A record with that ${field} already exists.` };
  }

  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  return { statusCode: 500, message: err.message || "Internal server error." };
}

/** Express 4-arg error handler. Must be registered LAST, after all routes. */
export function errorHandler(err, req, res, next) {
  const { statusCode, message, fieldErrors } = normalizeError(err);

  if (statusCode >= 500) {
    console.error("[ERROR]", err);
  }

  res.status(statusCode).json({
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  });
}

/** Catches any request that didn't match a route. */
export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
