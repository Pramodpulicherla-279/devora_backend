const express = require('express');
const { protect } = require('../middleware/auth');
const { saveProgress, getUserProgressByPart, getUserProgressByCourse } = require('../controllers/userLessonProgressController');


const router = express.Router();
router.post('/lessons/:lessonId/complete', protect, saveProgress);
router.get('/parts/:partId', protect, getUserProgressByPart);
router.get('/courses/:courseId', protect, getUserProgressByCourse);

module.exports = router;