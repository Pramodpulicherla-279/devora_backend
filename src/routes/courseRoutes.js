const express = require('express');
const {
    getCourses,
    createCourse,
    getCourse,
    updateCourse,
    deleteCourse,
} = require('../controllers/courseController');
const { createPart, getParts } = require('../controllers/partController');

const router = express.Router();

router.route('/').get(getCourses).post(createCourse);

// Route to create/get parts within a course
router.route('/:courseId/parts').get(getParts).post(createPart);

// Get, update or delete a single course by id/slug
router.route('/:slug').get(getCourse).put(updateCourse).delete(deleteCourse);

module.exports = router;