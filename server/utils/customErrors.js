/**
 * GY: This is a good pattern to use. 
 * - I recently adopted this as well to create different types of errors
 *   - internal errors: include a lot more debug information, but shouldn't
 *     expose by API
 *   - external errors: converting internal errors to externally visible one
 *     - i.e stripping out sensitive data, wrapping with better error message
 */
class ApplicationError extends Error {
  constructor(message, status, extra) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status || 500;
    this.extra = extra || {};
  }
}

module.exports = {
  ApplicationError,
};
