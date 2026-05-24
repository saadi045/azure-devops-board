/**
 * Authentication routes.
 *
 * POST /api/v1/auth/signup  — create a new user account
 * POST /api/v1/auth/login   — exchange email+password for a JWT
 *
 * Security choices made here:
 *   - Passwords must be at least 8 characters (industry minimum)
 *   - Email is normalized to lowercase to prevent duplicate accounts
 *   - Wrong email and wrong password both return the same generic error
 *     to prevent email enumeration attacks
 *   - Successful login returns just the token, not user details
 *     (the client can fetch /me later if needed)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Validation helpers ----------

function validateCredentials(body) {
  const errors = [];

  if (!body.email || typeof body.email !== 'string') {
    errors.push('email is required');
  } else if (!EMAIL_REGEX.test(body.email)) {
    errors.push('email must be a valid email address');
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push('password is required');
  } else if (body.password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  } else if (body.password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`password must be ${MAX_PASSWORD_LENGTH} characters or fewer`);
  }

  return errors;
}

// ---------- Routes ----------

// POST /api/v1/auth/signup — create a new user
router.post('/signup', async (req, res, next) => {
  try {
    const errors = validateCredentials(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors,
        requestId: req.id
      });
    }

    const email = req.body.email.toLowerCase().trim();
    const passwordHash = await auth.hashPassword(req.body.password);

    let user;
    try {
      const { rows } = await db.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, created_at`,
        [email, passwordHash]
      );
      user = rows[0];
    } catch (err) {
      // PostgreSQL error code 23505 = unique_violation
      if (err.code === '23505') {
        return res.status(409).json({
          error: 'Account already exists',
          message: 'An account with this email already exists',
          requestId: req.id
        });
      }
      throw err;
    }

    res.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login — exchange credentials for a JWT
router.post('/login', async (req, res, next) => {
  try {
    const errors = validateCredentials(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors,
        requestId: req.id
      });
    }

    const email = req.body.email.toLowerCase().trim();

    const { rows } = await db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    // Use the same error for "no such user" and "wrong password" to prevent
    // attackers from learning which emails are registered.
    const genericAuthError = () => res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
      requestId: req.id
    });

    if (rows.length === 0) {
      return genericAuthError();
    }

    const user = rows[0];
    const passwordOk = await auth.verifyPassword(req.body.password, user.password_hash);

    if (!passwordOk) {
      return genericAuthError();
    }

    const token = auth.generateToken(user);

    res.json({
      token,
      expiresIn: '24h'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;