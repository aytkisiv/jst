const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for AI proxy endpoints (60 requests per minute).
 * Apply to any route that calls Claude or ElevenLabs.
 */
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Too many requests, please slow down.' },
});

module.exports = { aiRateLimit };
