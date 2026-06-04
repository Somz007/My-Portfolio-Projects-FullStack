const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, refreshAccessToken, logoutUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
], registerUser);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], loginUser);

router.post('/refresh', refreshAccessToken);
router.post('/logout',  logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
