// ─────────────────────────────────────────────────────────────
//  utils/generateToken.js
//  Helpers that create (sign) JWTs. We now have TWO kinds:
//    - access token:  short-lived, sent on every request
//    - refresh token: long-lived, used only to get a new access token
//  They are signed with DIFFERENT secrets so one can never be used
//  in place of the other.
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Create a short-lived ACCESS token for the given user id.
 * This is the token the client sends in the Authorization header.
 *
 * @param {string} userId - the MongoDB _id of the user
 * @returns {string} signed access JWT
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

/**
 * Create a long-lived REFRESH token for the given user id.
 * The client keeps this safe and only sends it to /api/auth/refresh
 * to obtain a fresh access token. A hash of it is also stored in the
 * database so it can be revoked.
 *
 * @param {string} userId - the MongoDB _id of the user
 * @returns {string} signed refresh JWT
 */
const generateRefreshToken = (userId) => {
  // "jti" (JWT ID) is a unique random value per token. Without it, two
  // refresh tokens minted for the same user in the same SECOND would be
  // byte-for-byte identical (the iat/exp timestamps are second-granular),
  // which would break token rotation / replay protection. The jti
  // guarantees every refresh token — and therefore its stored hash — is unique.
  return jwt.sign(
    { id: userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
