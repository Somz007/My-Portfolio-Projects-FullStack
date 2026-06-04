// ─────────────────────────────────────────────────────────────
//  controllers/postController.js
//  CRUD for posts, plus the like/unlike toggle.
// ─────────────────────────────────────────────────────────────
const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

/**
 * @route  GET /api/posts
 * Paginated list of posts. Supports ?search, ?tag, ?page, ?limit, ?sort.
 * Uses optionalAuth so logged-in users get a "liked" flag per post.
 */
const getPosts = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip  = (page - 1) * limit;
    const sort  = req.query.sort || '-createdAt';

    const filter = {};
    if (req.query.tag)    filter.tags = req.query.tag.toLowerCase();
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar'), // pull in author name + avatar
      Post.countDocuments(filter),
    ]);

    // Attach computed fields the frontend needs:
    //   likeCount  — so the UI doesn't have to call .length
    //   liked      — whether the current user has already liked this post
    const userId = req.user?._id?.toString();
    const shaped = posts.map((p) => ({
      ...p.toObject(),
      likeCount: p.likes.length,
      liked: userId ? p.likes.some((id) => id.toString() === userId) : false,
    }));

    res.status(200).json({ page, limit, total, totalPages: Math.ceil(total / limit), count: posts.length, posts: shaped });
  } catch (e) { next(e); }
};

/**
 * @route  GET /api/posts/:id
 * Single post with full content and the author's public profile.
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name avatar bio');
    if (!post) { res.status(404); throw new Error('Post not found'); }

    const userId = req.user?._id?.toString();
    res.status(200).json({
      ...post.toObject(),
      likeCount: post.likes.length,
      liked: userId ? post.likes.some((id) => id.toString() === userId) : false,
    });
  } catch (e) { next(e); }
};

/**
 * @route  POST /api/posts
 * Create a new post. Auto-generates an excerpt from the first 200 chars
 * of the content if the user didn't supply one.
 */
const createPost = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const { title, content, excerpt, coverImage, tags } = req.body;
    const post = await Post.create({
      title,
      content,
      // Trim the raw text to 200 chars for the excerpt. Strip any newlines first.
      excerpt: excerpt || content.replace(/\s+/g, ' ').slice(0, 200),
      coverImage: coverImage || '',
      tags: tags || [],
      author: req.user._id,
    });
    await post.populate('author', 'name avatar');
    res.status(201).json(post);
  } catch (e) { next(e); }
};

/**
 * @route  PUT /api/posts/:id
 * Only the author can update their post.
 */
const updatePost = async (req, res, next) => {
  try {
    if (validate(req, res)) return;
    const post = await Post.findById(req.params.id);
    if (!post) { res.status(404); throw new Error('Post not found'); }
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorised to edit this post');
    }
    const { title, content, excerpt, coverImage, tags } = req.body;
    if (title)       post.title       = title;
    if (content)     post.content     = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (tags)        post.tags        = tags;
    await post.save();
    await post.populate('author', 'name avatar');
    res.status(200).json(post);
  } catch (e) { next(e); }
};

/**
 * @route  DELETE /api/posts/:id
 * Only the author can delete their post. Also deletes all its comments.
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) { res.status(404); throw new Error('Post not found'); }
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorised to delete this post');
    }
    await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
    res.status(200).json({ message: 'Post deleted', id: req.params.id });
  } catch (e) { next(e); }
};

/**
 * @route  PUT /api/posts/:id/like
 * Toggle like. If the user hasn't liked the post → add. If they have → remove.
 * Uses MongoDB's $addToSet (add only if not present) and $pull (remove).
 */
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) { res.status(404); throw new Error('Post not found'); }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    const update = alreadyLiked
      ? { $pull: { likes: userId } }       // unlike
      : { $addToSet: { likes: userId } };  // like (addToSet is idempotent)

    const updated = await Post.findByIdAndUpdate(post._id, update, { new: true });
    res.status(200).json({ likeCount: updated.likes.length, liked: !alreadyLiked });
  } catch (e) { next(e); }
};

module.exports = { getPosts, getPostById, createPost, updatePost, deletePost, toggleLike };
