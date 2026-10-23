/**
 * A custom error class that carries an HTTP status code. Thrown from
 * anywhere in a controller/service and caught by the global error
 * handler middleware (see middleware/errorHandler.js).
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export const badRequest = (message) => new ApiError(400, message);
export const unauthorized = (message) => new ApiError(401, message || "Unauthorized");
export const forbidden = (message) => new ApiError(403, message || "Forbidden");
export const notFound = (message) => new ApiError(404, message || "Not found");
export const conflict = (message) => new ApiError(409, message);
