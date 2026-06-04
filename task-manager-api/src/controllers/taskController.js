// ─────────────────────────────────────────────────────────────
//  controllers/taskController.js
//  The "chef" for tasks. Full CRUD (Create, Read, Update, Delete).
//
//  KEY SECURITY RULE: every query is scoped to the logged-in user via
//  "owner: req.user._id". This guarantees a user can only ever see or
//  modify THEIR OWN tasks — never anyone else's.
// ─────────────────────────────────────────────────────────────
const { validationResult } = require('express-validator');
const Task = require('../models/Task');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

/**
 * @desc    Create a new task for the logged-in user
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    const { title, description, status, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      dueDate,
      owner: req.user._id, // stamp the task with its owner
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the logged-in user's tasks, with pagination, search,
 *          filtering and sorting.
 * @route   GET /api/tasks
 * @access  Private
 *
 * Supported query-string parameters (all optional):
 *   ?status=pending|in-progress|completed   filter by status
 *   ?search=node                             case-insensitive text search
 *                                            across title + description
 *   ?sort=-createdAt                         sort field; prefix with "-"
 *                                            for descending (default -createdAt)
 *   ?page=2                                  page number (default 1)
 *   ?limit=10                                items per page (default 10, max 100)
 *
 * Example: GET /api/tasks?search=api&status=in-progress&page=1&limit=5&sort=dueDate
 */
const getTasks = async (req, res, next) => {
  try {
    // ── Build the filter ─────────────────────────────────────────────
    // Always scope to the current user so they only see their own tasks.
    const filter = { owner: req.user._id };

    // Optional filtering by status, e.g. ?status=completed
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Optional text search across title + description.
    // $regex does a pattern match; "i" makes it case-insensitive.
    // $or means "match if EITHER field contains the term".
    if (req.query.search) {
      const term = req.query.search;
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    // ── Pagination maths ─────────────────────────────────────────────
    // parseInt(value, 10) → base-10 integer. The "|| default" guards
    // against missing/invalid values. We clamp limit to a sane maximum
    // so a client can't request, say, 1,000,000 records at once.
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit; // how many docs to skip to reach this page

    // ── Sorting ──────────────────────────────────────────────────────
    // Mongoose accepts a string like "-createdAt" (desc) or "dueDate" (asc).
    const sort = req.query.sort || '-createdAt';

    // ── Run the query + a parallel count ─────────────────────────────
    // Promise.all runs both queries at the same time (faster than awaiting
    // them one after another). We need the total count to compute totalPages.
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    // ── Respond with the data PLUS pagination metadata ───────────────
    // Returning metadata is what separates a professional API from a toy:
    // the frontend needs it to render "Page 2 of 5" and next/prev buttons.
    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: tasks.length, // how many are on THIS page
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single task by id (only if the user owns it)
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a task (only if the user owns it)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    if (handleValidation(req, res)) return;

    // findOneAndUpdate finds the matching doc and updates it in one step.
    //   - { new: true }            → return the UPDATED document, not the old one
    //   - { runValidators: true }  → re-run schema validation (e.g. status enum)
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task (only if the user owns it)
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.status(200).json({ message: 'Task deleted', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
