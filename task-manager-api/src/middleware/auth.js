// ─────────────────────────────────────────────────────────────
//  middleware/auth.js
//  The "bouncer". This middleware runs BEFORE protected controllers.
//  It checks for a valid JWT and, if valid, attaches the logged-in
//  user to req.user so the controller knows who is making the request.
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Express middleware has the signature (req, res, next):
 *   - req  = the incoming request
 *   - res  = the response we can send back
 *   - next = a function we call to pass control to the NEXT handler.
 *            If we never call next() (and never send a response), the
 *            request hangs. If we call next(error), Express jumps to
 *            the error handler.
 */
const protect = async (req, res, next) => {
  let token;

  // Convention: clients send the token in the Authorization header like:
  //   Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // 1. Pull the token out of "Bearer <token>".
      token = authHeader.split(' ')[1];

      // 2. Verify the signature + expiry using our secret.
      //    If the token was tampered with or expired, this THROWS.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. The decoded payload contains { id: <userId> }. Look that user up.
      //    We exclude the password (it's already select:false, but this is
      //    explicit and safe). Attach the user to the request object.
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res
          .status(401)
          .json({ message: 'Not authorized, user no longer exists' });
      }

      // 4. Everything checks out → let the request continue.
      return next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Not authorized, token failed' });
    }
  }

  // No token was provided at all.
  return res
    .status(401)
    .json({ message: 'Not authorized, no token provided' });
};

module.exports = { protect };
