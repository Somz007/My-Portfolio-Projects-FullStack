const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Optional auth: attaches req.user if a valid token is present, but doesn't
// block the request if there's no token. Used on public routes that have
// per-user state (e.g. "has this user liked this post?").
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // invalid token → just proceed without a user
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
