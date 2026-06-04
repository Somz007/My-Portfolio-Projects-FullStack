// ─────────────────────────────────────────────────────────────
//  controllers/authController.js
//  Complete auth system:
//    register, login, refresh, logout, getMe  — same as Projects 1+2
//    forgotPassword, resetPassword            — NEW: password reset flow
//    verifyEmail                              — NEW: email verification
// ─────────────────────────────────────────────────────────────
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/email');

// ── Helpers ──────────────────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

const issueTokens = async (userId) => {
  const accessToken  = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  const { exp } = jwt.decode(refreshToken);
  await RefreshToken.create({ user: userId, tokenHash: RefreshToken.hashToken(refreshToken), expiresAt: new Date(exp * 1000) });
  return { accessToken, refreshToken };
};

const userPayload = (user) => ({
  _id: user._id, name: user.name, email: user.email, emailVerified: user.emailVerified,
});

// ── Register ─────────────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      res.status(400); throw new Error('Email already registered');
    }

    const user = await User.create({ name, email, password });

    // Generate email verification token and send it.
    const { rawToken, hashedToken, expires } = user.createResetToken(60 * 24); // 24h to verify
    user.emailVerifyToken   = hashedToken;
    user.emailVerifyExpires = expires;
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
    const emailInfo = await sendVerificationEmail(email, verifyUrl);

    const tokens = await issueTokens(user._id);
    const devOnly = process.env.NODE_ENV !== 'production' ? { _devVerifyPreview: emailInfo._etherealPreview } : {};
    res.status(201).json({ ...userPayload(user), ...tokens, ...devOnly });
  } catch (e) { next(e); }
};

// ── Login ─────────────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) { res.status(401); throw new Error('Invalid email or password'); }

    // Check account lockout.
    if (user.isLocked) {
      const unlockAt = new Date(user.lockUntil).toLocaleTimeString();
      res.status(423); throw new Error(`Account locked due to too many failed attempts. Try again after ${unlockAt}`);
    }

    const match = await user.matchPassword(password);
    if (!match) {
      await user.incLoginAttempts();
      const remaining = 5 - (user.loginAttempts + 1);
      res.status(401);
      throw new Error(remaining > 0
        ? `Invalid email or password (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
        : 'Invalid email or password — account locked for 2 hours'
      );
    }

    // Successful login: reset lockout counter.
    if (user.loginAttempts > 0) {
      await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
    }

    const tokens = await issueTokens(user._id);
    res.status(200).json({ ...userPayload(user), ...tokens });
  } catch (e) { next(e); }
};

// ── Refresh ──────────────────────────────────────────────────
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(401); throw new Error('Refresh token required'); }

    let payload;
    try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
    catch { res.status(401); throw new Error('Invalid or expired refresh token'); }

    const stored = await RefreshToken.findOne({ tokenHash: RefreshToken.hashToken(refreshToken) });
    if (!stored) { res.status(401); throw new Error('Refresh token has been revoked'); }

    await stored.deleteOne();
    const user = await User.findById(payload.id);
    if (!user) { res.status(401); throw new Error('User no longer exists'); }

    res.status(200).json(await issueTokens(user._id));
  } catch (e) { next(e); }
};

// ── Logout ───────────────────────────────────────────────────
const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await RefreshToken.deleteOne({ tokenHash: RefreshToken.hashToken(refreshToken) });
    res.status(200).json({ message: 'Logged out' });
  } catch (e) { next(e); }
};

// ── Get Me ───────────────────────────────────────────────────
const getMe = (req, res) => res.status(200).json(req.user);

// ── Forgot Password ───────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  SECURITY NOTE: we always respond with 200 and the same message
//  whether or not the email is registered. This prevents an attacker
//  from using this endpoint to find out which emails are in our DB
//  (an "account enumeration" attack).
// ─────────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { email } = req.body;
    const genericResponse = { message: 'If that email is registered you will receive a reset link shortly.' };

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(genericResponse); // don't reveal whether email exists

    const expiryMin = Number(process.env.RESET_TOKEN_EXPIRES_MIN) || 10;
    const { rawToken, hashedToken, expires } = user.createResetToken(expiryMin);
    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = expires;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    let resetEmailInfo;
    try {
      resetEmailInfo = await sendPasswordResetEmail(email, resetUrl);
    } catch (emailErr) {
      // If email fails, clear the token so we don't leave a dangling record.
      user.passwordResetToken   = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500); throw new Error('Email could not be sent. Please try again.');
    }

    const devOnly = process.env.NODE_ENV !== 'production' ? { _devResetPreview: resetEmailInfo?._etherealPreview } : {};
    res.status(200).json({ ...genericResponse, ...devOnly });
  } catch (e) { next(e); }
};

// ── Reset Password ────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { token, email, password } = req.body;

    // Hash the submitted token to compare with the stored hash.
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // not expired
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      res.status(400); throw new Error('Reset token is invalid or has expired');
    }

    // Update password — the pre-save hook hashes it.
    user.password             = password;
    user.passwordResetToken   = undefined; // clear the token
    user.passwordResetExpires = undefined;
    user.loginAttempts        = 0;         // clear any lockout
    user.lockUntil            = undefined;
    await user.save();

    // Revoke all existing refresh tokens — forces re-login everywhere.
    await RefreshToken.deleteMany({ user: user._id });

    const tokens = await issueTokens(user._id);
    res.status(200).json({
      message: 'Password reset successful',
      ...userPayload(user),
      ...tokens,
    });
  } catch (e) { next(e); }
};

// ── Verify Email ──────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      emailVerifyToken:   hashedToken,
      emailVerifyExpires: { $gt: Date.now() },
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) {
      res.status(400); throw new Error('Verification link is invalid or has expired');
    }

    user.emailVerified      = true;
    user.emailVerifyToken   = undefined;
    user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'Email verified successfully', emailVerified: true });
  } catch (e) { next(e); }
};

// ── Resend Verification ───────────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+emailVerifyToken +emailVerifyExpires');
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });

    const { rawToken, hashedToken, expires } = user.createResetToken(60 * 24);
    user.emailVerifyToken   = hashedToken;
    user.emailVerifyExpires = expires;
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await sendVerificationEmail(user.email, verifyUrl);

    res.status(200).json({ message: 'Verification email resent' });
  } catch (e) { next(e); }
};

module.exports = {
  registerUser, loginUser, refreshAccessToken, logoutUser, getMe,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
};
