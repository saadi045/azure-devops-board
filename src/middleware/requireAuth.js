/**
 * Authentication middleware.
 *
 * Verifies the JWT in the Authorization header. If valid, attaches
 * the decoded user info to req.user so route handlers can access it.
 * If invalid or missing, returns 401.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 *
 * After this middleware runs, route handlers can use:
 *   req.user.id     — the authenticated user's id
 *   req.user.email  — their email
 */

const auth = require('../auth');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
      requestId: req.id
    });
  }

  const token = header.substring(7);  // strip "Bearer "

  let decoded;
  try {
    decoded = auth.verifyToken(token);
  } catch (err) {
    // jwt.verify throws specific error types — translate them to clear responses
    const reason = err.name === 'TokenExpiredError'
      ? 'Token has expired. Please log in again.'
      : 'Invalid token';

    return res.status(401).json({
      error: 'Authentication failed',
      message: reason,
      requestId: req.id
    });
  }

  // Attach user info to the request for downstream handlers
  req.user = {
    id: decoded.sub,
    email: decoded.email
  };

  next();
}

module.exports = requireAuth;