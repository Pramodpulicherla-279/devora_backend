const express = require('express');
const { getTracks, getTrack, createTrack, updateTrack, deleteTrack, assignCourse, removeCourse } = require('../controllers/trackController');

const router = express.Router();

router.route('/').get(getTracks).post(createTrack);
router.route('/:id').get(getTrack).put(updateTrack).delete(deleteTrack);
router.post('/:id/assign', assignCourse);
router.delete('/:id/courses/:courseId', removeCourse);

module.exports = router;
