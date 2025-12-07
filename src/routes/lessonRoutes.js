const express = require('express');
const { createLesson, getLessons, updateLesson, getLesson, getLessonBySlug } = require('../controllers/lessonController');

const router = express.Router({ mergeParams: true });

// Route to create a lesson within a part
// POST /api/parts/:partId/lessons
router.route('/:partId/lessons').get(getLessons).post(createLesson);
router.route('/parts/:partSlug/lessons').get(getLesson);

// Get lesson by slug
router.route('/slug/:slug').get(getLessonBySlug);

// This route updates a specific lesson by its ID
router.route('/:id').put(updateLesson);

module.exports = router;