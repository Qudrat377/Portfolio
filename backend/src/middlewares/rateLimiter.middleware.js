const rateLimit = require('express-rate-limit');
const { AppError } = require('../utils/AppError');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new AppError(message, 429));
    },
  });

// General API limiter
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX) || 100,
  'Too many requests, please try again later'
);

// Strict limiter for auth endpoints
const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 min
  20,
  'Too many authentication attempts, please try again in 15 minutes'
);

// Very strict for password change
const passwordLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many password change attempts, please try again in 1 hour'
);

module.exports = { apiLimiter, authLimiter, passwordLimiter };
