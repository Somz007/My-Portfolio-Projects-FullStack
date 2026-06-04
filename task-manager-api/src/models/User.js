// ─────────────────────────────────────────────────────────────
//  models/User.js
//  Defines the "shape" of a User document in MongoDB, plus the
//  password-hashing logic that keeps passwords safe.
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * A Schema is the blueprint for a document. It tells Mongoose:
 *   - what fields exist
 *   - their types
 *   - validation rules (required, unique, min length, etc.)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true, // removes leading/trailing whitespace
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // no two users can share an email
      lowercase: true, // store emails in lowercase for consistency
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // by default, don't return the password in queries
    },
  },
  {
    // Automatically adds "createdAt" and "updatedAt" timestamp fields.
    timestamps: true,
  }
);

/**
 * MONGOOSE MIDDLEWARE ("pre-save hook").
 * This function runs automatically BEFORE a user document is saved.
 * We use it to hash the password so we never store it in plain text.
 *
 * We only re-hash when the password actually changed (e.g. on register or
 * password update) — otherwise saving an unrelated field would double-hash it.
 */
userSchema.pre('save', async function (next) {
  // "this" refers to the user document about to be saved.
  if (!this.isModified('password')) {
    return next(); // password unchanged → skip hashing
  }

  // A "salt" is random data mixed into the hash so two identical passwords
  // produce different hashes. 10 is the cost factor (higher = slower = safer).
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // continue with the save
});

/**
 * INSTANCE METHOD.
 * Lets us call user.matchPassword(plainTextPassword) anywhere.
 * bcrypt.compare re-hashes the candidate and checks it against the stored
 * hash — returns true/false. We never "decrypt" the stored password
 * (hashing is one-way).
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// A "Model" is the tool we use to create/read/update/delete documents.
// Mongoose will create a "users" collection (pluralised, lowercased).
module.exports = mongoose.model('User', userSchema);
