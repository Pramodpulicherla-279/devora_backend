const express = require('express');
const { createLesson, getLessons, updateLesson } = require('../controllers/lessonController');

const router = express.Router({ mergeParams: true });

// Route to create a lesson within a part
// POST /api/parts/:partId/lessons
router.route('/:partId/lessons').get(getLessons).post(createLesson);

// This route updates a specific lesson by its ID
router.route('/:id').put(updateLesson);

module.exports = router;