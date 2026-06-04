// ─────────────────────────────────────────────────────────────
//  routes/taskRoutes.js
//  The "menu" for tasks. Mounted at /api/tasks in app.js.
//
//  EVERY task route is protected: we apply router.use(protect) once,
//  so the bouncer runs before all handlers below it. No token = no entry.
// ─────────────────────────────────────────────────────────────
const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth to ALL routes defined after this line.
router.use(protect);

// Validation for creating a task: title is required, status (if sent)
// must be one of the allowed values, dueDate (if sent) must be a date.
const createRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid date'),
];

// On update, every field is optional (you might update only the status).
const updateRules = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid date'),
];

// Routes for the collection: /api/tasks
router
  .route('/')
  .get(getTasks)
  .post(createRules, createTask);

// Routes for a single item: /api/tasks/:id
router
  .route('/:id')
  .get(getTaskById)
  .put(updateRules, updateTask)
  .delete(deleteTask);

module.exports = router;
