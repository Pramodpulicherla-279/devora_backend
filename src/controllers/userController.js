const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Generate a JWT that expires in 1 day.
// The protect middleware re-issues this on every request so the clock resets
// with each activity (sliding expiry — inactive for 1 day → logged out).
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
exports.registerUser = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const user = await User.create({ name, email, mobile, password });

        if (user) {
            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                token: generateToken(user._id),
            });
        }
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get current user data
// @route   GET /api/users/me
exports.getMe = async (req, res) => {
    // req.user is set by the auth middleware
    res.status(200).json({ success: true, data: req.user });
};

// @desc    Get enrolled tracks for current user
// @route   GET /api/users/tracks/enrolled
exports.getEnrolledTracks = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('enrolledTracks');
        res.status(200).json({ success: true, enrolledTracks: user.enrolledTracks || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Enroll or unenroll from a track
// @route   POST /api/users/tracks/enroll
// body: { slug: String, action: 'enroll' | 'unenroll' }
exports.updateTrackEnrollment = async (req, res) => {
    const { slug, action } = req.body;
    if (!slug || !['enroll', 'unenroll'].includes(action)) {
        return res.status(400).json({ success: false, error: 'slug and action (enroll|unenroll) are required' });
    }
    try {
        let user;
        if (action === 'enroll') {
            user = await User.findByIdAndUpdate(
                req.user._id,
                { $addToSet: { enrolledTracks: slug } },
                { new: true, select: 'enrolledTracks' }
            );
        } else {
            user = await User.findByIdAndUpdate(
                req.user._id,
                { $pull: { enrolledTracks: slug } },
                { new: true, select: 'enrolledTracks' }
            );
        }
        res.status(200).json({ success: true, enrolledTracks: user.enrolledTracks });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};