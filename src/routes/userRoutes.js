const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getEnrolledTracks, updateTrackEnrollment } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/tracks/enrolled', protect, getEnrolledTracks);
router.post('/tracks/enroll', protect, updateTrackEnrollment);

module.exports = router;