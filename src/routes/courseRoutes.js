const express = require('express');
const {
    getCourses,
    createCourse,
} = require('../controllers/courseController');

const router = express.Router();

router.route('/').get(getCourses).post(createCourse);

module.exports = router;