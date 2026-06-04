const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

/**
 * @route  GET /api/posts/:postId/comments
 * All comments for a post, oldest first, with author details.
 */
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatar');
    res.status(200).json({ count: comments.length, comments });
  } catch (e) { next(e); }
};

/**
 * @route  POST /api/posts/:postId/comments
 * Add a comment. Checks that the post exists first.
 */
const addComment = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const post = await Post.findById(req.params.postId);
    if (!post) { res.status(404); throw new Error('Post not found'); }

    const comment = await Comment.create({
      content: req.body.content,
      author: req.user._id,
      post: post._id,
    });
    await comment.populate('author', 'name avatar');
    res.status(201).json(comment);
  } catch (e) { next(e); }
};

/**
 * @route  DELETE /api/comments/:id
 * Only the comment's author can delete it.
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) { res.status(404); throw new Error('Comment not found'); }
    if (comment.author.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorised to delete this comment');
    }
    await comment.deleteOne();
    res.status(200).json({ message: 'Comment deleted', id: req.params.id });
  } catch (e) { next(e); }
};

module.exports = { getComments, addComment, deleteComment };
