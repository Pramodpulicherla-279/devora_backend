const express = require('express');
const {
    getCourses,
    createCourse,
    getCourse,
    deleteCourse,
} = require('../controllers/courseController');
const { createPart, getParts } = require('../controllers/partController');

const router = express.Router();

router.route('/').get(getCourses).post(createCourse);

// Route to create/get parts within a course
router.route('/:courseId/parts').get(getParts).post(createPart);

// Get or delete a single course by id/slug
router.route('/:slug').get(getCourse).delete(deleteCourse);

module.exports = router;