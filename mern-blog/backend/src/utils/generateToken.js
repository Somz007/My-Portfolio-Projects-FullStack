const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId, jti: crypto.randomUUID() }, // unique jti prevents same-second duplicates
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

module.exports = { generateAccessToken, generateRefreshToken };
