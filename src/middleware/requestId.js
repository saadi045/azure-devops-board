/**
 * Request ID middleware.
 *
 * Every incoming HTTP request gets a unique ID that flows through logs,
 * responses, and (eventually) traces. This is one of the most valuable
 * patterns in production observability — when a user reports a problem,
 * they can give you the request ID from their error response and you can
 * find every log line related to that one request.
 *
 * The middleware:
 *  1. Reads X-Request-ID from the incoming request if present (so a
 *     gateway or upstream service can pass through its own ID).
 *  2. Generates a new UUID v4 if none is set.
 *  3. Attaches it to req.id so route handlers can use it.
 *  4. Echoes it back in the X-Request-ID response header.
 */

const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  // Trust an incoming header if present, otherwise generate
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = requestId;