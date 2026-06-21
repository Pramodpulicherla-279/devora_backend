const crypto = require('crypto');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

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

// @desc    Send password reset email
// @route   POST /api/users/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    // Always respond with success to avoid leaking which emails are registered
    if (!user) return res.json({ success: true });

    // Generate raw token, store its hash in DB
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || 'https://dev-el.co')
      : 'http://localhost:5180';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your Dev.EL password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:36px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h2 style="color:#7c3aed;margin:0 0 8px;font-size:22px;">Reset your password</h2>
          <p style="color:#475569;margin:0 0 24px;line-height:1.6;">Hi ${user.name},<br>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:13px 30px;background:#7c3aed;color:#fff;border-radius:9px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password →</a>
          <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;">Didn't request this? You can safely ignore this email — your password won't change.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    // Log full error to Render logs for diagnosis
    console.error('[forgot-password] failed:', err);
    // Clear token on failure so a retry works
    await User.updateOne({ email }, { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } });
    // TEMP: surface real error to diagnose prod SMTP failure (revert to generic after fix)
    res.status(500).json({ success: false, error: `Could not send email: ${err.message}` });
  }
};

// @desc    Reset password using token
// @route   PUT /api/users/reset-password/:token
exports.resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  try {
    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, error: 'Reset link is invalid or has expired.' });

    user.password             = req.body.password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update current user's profile (name)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      name: user.name,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
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