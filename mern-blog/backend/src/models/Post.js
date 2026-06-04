// ─────────────────────────────────────────────────────────────
//  models/Post.js
//  A blog post. Key design choices worth knowing:
//
//  LIKES: stored as an array of user ObjectIds directly on the post.
//  This is called "embedding references". It lets us:
//    - check if a user has liked a post in O(1): likes.includes(userId)
//    - get the like count without a separate query: post.likes.length
//    - toggle a like with a single $addToSet / $pull update
//  Downside: if a post gets millions of likes, the array grows huge. For
//  a blog, that's not a real concern. A separate "Likes" collection would
//  be the pattern for a social network at scale.
//
//  COMMENTS: stored separately (see Comment.js) because comments have
//  their own fields, pagination, and may be numerous.
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    content: { type: String, required: [true, 'Content is required'] },
    // A short preview shown on listing cards (auto-generated if omitted).
    excerpt: { type: String, default: '', maxlength: 300 },
    // URL to a cover image — user pastes a link (e.g. from Unsplash).
    coverImage: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Array of user IDs who have liked this post.
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

// Full-text index so MongoDB can efficiently search title + content.
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
