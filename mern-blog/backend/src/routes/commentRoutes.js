const express = require('express');
const { body } = require('express-validator');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const commentRule = [body('content').notEmpty().withMessage('Comment content required')];

router.get('/posts/:postId/comments',  getComments);
router.post('/posts/:postId/comments', protect, commentRule, addComment);
router.delete('/comments/:id',         protect, deleteComment);

module.exports = router;
