// ─────────────────────────────────────────────────────────────
//  routes/authRoutes.js
//  The "menu" for authentication. Maps URLs → validation → controllers.
//  Mounted at /api/auth in app.js, so "/register" becomes
//  "/api/auth/register".
// ─────────────────────────────────────────────────────────────
const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Validation rules run as middleware BEFORE the controller. Each rule
 * inspects req.body and records any problems; the controller then checks
 * validationResult() and responds with 400 if there were errors.
 */
const registerRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.post('/register', registerRules, registerUser);
router.post('/login', loginRules, loginUser);

// Refresh-token flow (the refresh token itself is the credential here,
// so these don't use the "protect" access-token middleware).
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

// Private route — "protect" runs first; only a valid access token gets through.
router.get('/me', protect, getMe);

module.exports = router;
