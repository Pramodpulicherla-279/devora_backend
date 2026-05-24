const express = require('express');
const { createLesson, getLessons, updateLesson, getLesson, getLessonBySlug, searchLessons, getAllLessons, deleteLesson } = require('../controllers/lessonController');

const router = express.Router({ mergeParams: true });

// Get ALL lessons (admin)
router.route('/').get(getAllLessons);

// Route to create a lesson within a part
// POST /api/parts/:partId/lessons
router.route('/:partId/lessons').get(getLessons).post(createLesson);
router.route('/parts/:partSlug/lessons').get(getLesson);

// Get lesson by slug
router.route('/slug/:slug').get(getLessonBySlug);
// get lessons by search
router.route('/lessons/search').get(searchLessons);

// Update or delete a specific lesson by its ID
router.route('/:id').put(updateLesson).delete(deleteLesson);

module.exports = router;