const express = require('express');
const { body } = require('express-validator');
const {
  registerUser, loginUser, refreshAccessToken, logoutUser, getMe,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, resetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── Validation rules ──────────────────────────────────────────
const registerRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];
const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];
const forgotRules   = [body('email').isEmail().withMessage('Valid email required')];
const resetRules    = [
  body('token').notEmpty().withMessage('Token required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];
const verifyRules   = [
  body('token').notEmpty().withMessage('Token required'),
  body('email').isEmail().withMessage('Valid email required'),
];

// ── Routes ─────────────────────────────────────────────────────
router.post('/register',           authLimiter,  registerRules, registerUser);
router.post('/login',              authLimiter,  loginRules,    loginUser);
router.post('/refresh',                                          refreshAccessToken);
router.post('/logout',                                           logoutUser);
router.get('/me',                  protect,                     getMe);
router.post('/forgot-password',    resetLimiter, forgotRules,   forgotPassword);
router.post('/reset-password',     resetLimiter, resetRules,    resetPassword);
router.post('/verify-email',                     verifyRules,   verifyEmail);
router.post('/resend-verification', protect,                    resendVerification);

module.exports = router;
