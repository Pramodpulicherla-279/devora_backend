const express = require('express');
const { getTracks, getTrack, createTrack, updateTrack, deleteTrack, assignCourse, removeCourse, reorderCourses } = require('../controllers/trackController');

const router = express.Router();

router.route('/').get(getTracks).post(createTrack);
router.route('/:id').get(getTrack).put(updateTrack).delete(deleteTrack);
router.post('/:id/assign', assignCourse);
router.delete('/:id/courses/:courseId', removeCourse);
router.put('/:id/reorder', reorderCourses);

module.exports = router;
