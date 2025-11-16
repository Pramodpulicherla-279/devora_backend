const express = require('express');
const { createPart, getParts } = require('../controllers/partController');

const router = express.Router({ mergeParams: true });

// Route to create a part within a course
// POST /api/courses/:courseId/parts
router.route('/:courseId/parts').get(getParts).post(createPart);

module.exports = router;