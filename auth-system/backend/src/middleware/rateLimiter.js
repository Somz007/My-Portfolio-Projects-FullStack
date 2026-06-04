// ─────────────────────────────────────────────────────────────
//  middleware/rateLimiter.js
//  express-rate-limit protects auth endpoints from brute-force
//  and credential-stuffing attacks.
//
//  WHY rate-limit auth specifically?
//  Login, register, and password-reset endpoints are the prime
//  targets for automated attacks. Without limiting:
//    - An attacker can try 100,000 passwords per minute against login.
//    - They can flood forgot-password to spam users' inboxes.
//    - They can enumerate registered emails via timing/response differences.
//
//  We use TWO limiters with different settings:
//    authLimiter  — general auth routes (register, login, refresh)
//    resetLimiter — forgot-password and reset (stricter, email-based)
// ─────────────────────────────────────────────────────────────
const rateLimit = require('express-rate-limit');

/**
 * General auth limiter: 20 requests per 15-minute window.
 * Applied to: /login, /register, /refresh, /logout
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,  // sends RateLimit-* headers so the client knows
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again in 15 minutes.' },
});

/**
 * Strict limiter for password reset: 5 requests per hour.
 * Applied to: /forgot-password, /reset-password
 *
 * Email-based attacks (sending thousands of reset emails) are particularly
 * harmful — they spam users and can be used to enumerate accounts.
 */
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts, please try again in an hour.' },
});

module.exports = { authLimiter, resetLimiter };
