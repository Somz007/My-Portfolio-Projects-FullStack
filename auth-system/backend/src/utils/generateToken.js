const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken  = (id) => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN  || '15m' });
const generateRefreshToken = (id) => jwt.sign({ id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

module.exports = { generateAccessToken, generateRefreshToken };
