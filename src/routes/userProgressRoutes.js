const express = require('express');
const { protect } = require('../middleware/auth');
const { saveProgress, getUserProgressByPart, getUserProgressByCourse, deleteTrackProgress } = require('../controllers/userLessonProgressController');


const router = express.Router();
router.post('/lessons/:lessonId/complete', protect, saveProgress);
router.get('/parts/:partId', protect, getUserProgressByPart);
router.get('/courses/:courseId', protect, getUserProgressByCourse);
router.delete('/tracks/:trackSlug', protect, deleteTrackProgress);

module.exports = router;