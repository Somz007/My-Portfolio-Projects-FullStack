const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  const { exp } = jwt.decode(refreshToken);
  await RefreshToken.create({ user: user._id, tokenHash: RefreshToken.hashToken(refreshToken), expiresAt: new Date(exp * 1000) });
  return { accessToken, refreshToken };
};

const registerUser = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) { res.status(400); throw new Error('Email already registered'); }
    const user = await User.create({ name, email, password });
    const tokens = await issueTokens(user);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, ...tokens });
  } catch (e) { next(e); }
};

const loginUser = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error('Invalid email or password'); }
    const tokens = await issueTokens(user);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, ...tokens });
  } catch (e) { next(e); }
};

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
    res.status(200).json(await issueTokens(user));
  } catch (e) { next(e); }
};

const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await RefreshToken.deleteOne({ tokenHash: RefreshToken.hashToken(refreshToken) });
    res.status(200).json({ message: 'Logged out' });
  } catch (e) { next(e); }
};

const getMe = (req, res) => res.status(200).json(req.user);

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser, getMe };
