// ─────────────────────────────────────────────────────────────
//  models/User.js
//  Extends the basic user model from Project 1 with three new
//  security features:
//
//  1. EMAIL VERIFICATION
//     emailVerified flag + a hashed verification token with expiry.
//     On register we email a raw token; the user clicks the link;
//     we hash what they sent and match it against the stored hash.
//
//  2. PASSWORD RESET
//     Same pattern: raw token → emailed, hash → stored in DB.
//     Expires in RESET_TOKEN_EXPIRES_MIN minutes (default 10).
//
//  3. ACCOUNT LOCKOUT
//     After 5 failed logins we set lockUntil = now + 2 hours.
//     The controller checks this before comparing passwords.
//     This stops brute-force attacks even if rate limiting is bypassed.
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, 'Name is required'], trim: true },
    email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },

    // ── Email verification ──────────────────────────────────
    emailVerified:      { type: Boolean, default: false },
    emailVerifyToken:   { type: String, select: false }, // stored as SHA-256 hash
    emailVerifyExpires: { type: Date,   select: false },

    // ── Password reset ──────────────────────────────────────
    passwordResetToken:   { type: String, select: false }, // stored as SHA-256 hash
    passwordResetExpires: { type: Date,   select: false },

    // ── Account lockout ─────────────────────────────────────
    loginAttempts: { type: Number, default: 0 },
    lockUntil:     { type: Date,   default: null },
  },
  { timestamps: true }
);

// ── Virtuals ──────────────────────────────────────────────────
// isLocked is computed, not stored. We check it in the controller.
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// ── Hooks ─────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); // cost 12 for auth system (vs 10 in Project 1)
  next();
});

// ── Instance methods ───────────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

/**
 * Increment failed login counter. After MAX_ATTEMPTS, lock for 2 hours.
 * Returns the updated document.
 */
userSchema.methods.incLoginAttempts = function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_HOURS   = 2;

  // If a previous lock has expired, reset the counter.
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_HOURS * 60 * 60 * 1000) };
  }
  return this.updateOne(updates);
};

/**
 * Generate a cryptographically random token for password reset or email
 * verification. Returns { rawToken, hashedToken, expires }.
 *
 * WHY crypto.randomBytes instead of jwt.sign?
 *   - Reset tokens are single-use and stored server-side — no need for
 *     self-contained JWT claims.
 *   - randomBytes(32) gives 256 bits of entropy — unguessable even with
 *     a trillion guesses per second for longer than the universe has existed.
 *   - We store the SHA-256 hash so a DB breach doesn't hand attackers
 *     working reset links.
 */
userSchema.methods.createResetToken = function (expiryMinutes = 10) {
  const rawToken    = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires     = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return { rawToken, hashedToken, expires };
};

module.exports = mongoose.model('User', userSchema);
