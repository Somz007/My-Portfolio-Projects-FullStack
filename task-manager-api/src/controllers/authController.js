// ─────────────────────────────────────────────────────────────
//  controllers/authController.js
//  The "chef" for authentication: register, login, get-profile,
//  plus the refresh-token flow (refresh + logout).
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateToken');

/**
 * Small helper: if express-validator found problems, respond 400 and
 * return true so the caller stops. Returns false when input is valid.
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

/**
 * Core helper: mint a fresh access + refresh token pair for a user and
 * persist the refresh token's HASH in the database (so it can be revoked).
 *
 * Returns { accessToken, refreshToken } to send back to the client.
 */
const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Read the refresh token's expiry from its own payload so the DB record
  // expires at exactly the same moment (jwt.decode reads it without verifying).
  const { exp } = jwt.decode(refreshToken);

  // Store only the HASH — never the raw token.
  await RefreshToken.create({
    user: user._id,
    tokenHash: RefreshToken.hashToken(refreshToken),
    expiresAt: new Date(exp * 1000), // exp is in seconds; Date wants ms
  });

  return { accessToken, refreshToken };
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('A user with that email already exists');
    }

    const user = await User.create({ name, email, password });
    const tokens = await issueTokens(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      ...tokens, // accessToken + refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate a user and return a token pair
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    const { email, password } = req.body;

    // password has select:false, so request it explicitly here.
    const user = await User.findOne({ email }).select('+password');

    // Same generic message whether email or password is wrong → don't
    // reveal which emails are registered.
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const tokens = await issueTokens(user);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exchange a valid refresh token for a NEW access token.
 *          Implements "rotation": the old refresh token is revoked and a
 *          brand-new one is issued, limiting the damage if one is stolen.
 * @route   POST /api/auth/refresh
 * @access  Public (but requires a valid, non-revoked refresh token)
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401);
      throw new Error('Refresh token is required');
    }

    // 1. Verify the signature + expiry using the REFRESH secret.
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      res.status(401);
      throw new Error('Invalid or expired refresh token');
    }

    // 2. Check it still exists in the DB (i.e. it hasn't been revoked/used).
    const tokenHash = RefreshToken.hashToken(refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash });
    if (!stored) {
      res.status(401);
      throw new Error('Refresh token has been revoked');
    }

    // 3. ROTATE: delete the used token so it can't be replayed...
    await stored.deleteOne();

    // ...and confirm the user still exists.
    const user = await User.findById(payload.id);
    if (!user) {
      res.status(401);
      throw new Error('User no longer exists');
    }

    // 4. Issue a brand-new pair.
    const tokens = await issueTokens(user);
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out: revoke the given refresh token so it can no longer
 *          be used to mint access tokens.
 * @route   POST /api/auth/logout
 * @access  Public (idempotent — always returns success)
 *
 * Note: the access token is short-lived and stateless, so it naturally
 * expires within minutes. Revoking the refresh token is what truly ends
 * the session.
 */
const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete the matching token if it exists. We don't error if it's
      // already gone — logging out twice should still "succeed".
      await RefreshToken.deleteOne({
        tokenHash: RefreshToken.hashToken(refreshToken),
      });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires a valid access token)
 */
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
};
