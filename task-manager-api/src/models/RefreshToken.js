// ─────────────────────────────────────────────────────────────
//  models/RefreshToken.js
//  Stores refresh tokens server-side so they can be REVOKED (= real
//  logout). We never store the raw token — only a SHA-256 hash of it.
//  That way, even if the database leaks, the stored values can't be
//  used to log in (an attacker would need the original token).
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    // Which user this token belongs to.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The SHA-256 hash of the refresh token string.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    // When the token expires. We add a TTL index below so MongoDB
    // automatically deletes expired tokens — no cleanup cron needed.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB removes a document once "expiresAt" is in the past
// (expireAfterSeconds: 0 means "expire at the date stored in the field").
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * STATIC helper to hash a raw token consistently wherever we need to.
 * We use SHA-256 (fast) rather than bcrypt here because refresh tokens are
 * long, high-entropy random strings — unlike passwords, they aren't
 * guessable, so the slow salted hashing bcrypt provides isn't necessary.
 *
 * Usage: RefreshToken.hashToken(rawToken)
 */
refreshTokenSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
