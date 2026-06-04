// ─────────────────────────────────────────────────────────────
//  models/Task.js
//  Defines the "shape" of a Task document, and links each task to
//  the user who owns it.
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      // "enum" restricts this field to a fixed set of allowed values.
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    /**
     * This is the link between a Task and a User (a "relationship").
     * We store the user's _id, and "ref: 'User'" tells Mongoose which
     * model that id points to — so we can later .populate() it to pull
     * in the full user document if needed.
     */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model('Task', taskSchema);
