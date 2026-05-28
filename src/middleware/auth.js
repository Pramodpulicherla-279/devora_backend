const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Re-usable token factory (1-day expiry matches the sliding window)
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify signature + expiry
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            // Token valid but user no longer exists (deleted account with live token)
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
            }

            // ── Sliding expiry ──────────────────────────────────────────
            // Issue a fresh 1-day token on every authenticated request.
            // The browser reads this header via authFetch and silently
            // updates localStorage, so the clock resets on every activity.
            // If the user is inactive for a full day the old token expires
            // and they are asked to log in again.
            res.setHeader('X-New-Token', generateToken(decoded.id));
            // ────────────────────────────────────────────────────────────

            next();
        } catch (error) {
            return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
        }
    } else if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};
