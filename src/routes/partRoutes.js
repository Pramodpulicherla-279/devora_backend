const express = require('express');
const { createPart, getParts, deletePart, getAllParts } = require('../controllers/partController');

const router = express.Router({ mergeParams: true });

// GET all parts (admin)
router.route('/').get(getAllParts);

// Route to create a part within a course
// POST /api/courses/:courseId/parts
router.route('/:courseId/parts').get(getParts).post(createPart);

// DELETE a specific part
// DELETE /api/parts/:id
router.route('/:id').delete(deletePart);

module.exports = router;