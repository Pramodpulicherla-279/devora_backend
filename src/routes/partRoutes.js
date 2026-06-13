const express = require('express');
const { createPart, getParts, deletePart, getAllParts, updatePart } = require('../controllers/partController');

const router = express.Router({ mergeParams: true });

// GET all parts (admin)
router.route('/').get(getAllParts);

// Route to create a part within a course
// POST /api/courses/:courseId/parts
router.route('/:courseId/parts').get(getParts).post(createPart);

// GET/PUT/DELETE a specific part
// PUT /api/parts/:id  — update title etc.
// DELETE /api/parts/:id
router.route('/:id').put(updatePart).delete(deletePart);

module.exports = router;