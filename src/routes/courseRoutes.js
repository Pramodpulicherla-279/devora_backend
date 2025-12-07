const express = require('express');
const {
    getCourses,
    createCourse,
    getCourse
} = require('../controllers/courseController');
const { createPart, getParts } = require('../controllers/partController');

const router = express.Router();

router.route('/').get(getCourses).post(createCourse);

// Add the new route for getting a single course
// GET /api/courses/:id
router.route('/:slug').get(getCourse);

// Route to create/get parts within a course
router.route('/:courseId/parts').get(getParts).post(createPart);

module.exports = router;