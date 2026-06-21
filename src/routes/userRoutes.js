const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getEnrolledTracks, updateTrackEnrollment, updateProfile, forgotPassword, resetPassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/tracks/enrolled', protect, getEnrolledTracks);
router.post('/tracks/enroll', protect, updateTrackEnrollment);

module.exports = router;