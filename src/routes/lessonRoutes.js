const express = require('express');
const { createLesson, getLessons } = require('../controllers/lessonController');

const router = express.Router({ mergeParams: true });

// Route to create a lesson within a part
// POST /api/parts/:partId/lessons
router.route('/:partId/lessons').get(getLessons).post(createLesson);

module.exports = router;