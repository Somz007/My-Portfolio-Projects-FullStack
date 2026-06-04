const express = require('express');
const { body } = require('express-validator');
const { getPosts, getPostById, createPost, updatePost, deletePost, toggleLike } = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const postRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
];

// Public routes use optionalAuth so the "liked" flag works for logged-in users.
router.get('/',    optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostById);

// Protected routes require a valid access token.
router.post('/',       protect, postRules, createPost);
router.put('/:id',     protect, postRules, updatePost);
router.delete('/:id',  protect, deletePost);
router.put('/:id/like', protect, toggleLike);

module.exports = router;
