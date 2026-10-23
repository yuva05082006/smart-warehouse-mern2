/**
 * Wraps an async Express route handler so any thrown error (or
 * rejected promise) is forwarded to next(), instead of crashing the
 * process or hanging the request. Avoids repeating try/catch in every
 * single controller function.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
