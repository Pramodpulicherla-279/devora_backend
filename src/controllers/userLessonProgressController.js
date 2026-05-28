const Lesson = require('../models/lesson');
const Part = require('../models/part');
const UserLessonProgress = require('../models/userLessonProgress');

// helper: compute course progress for a user, scoped to a specific track
async function getCourseProgress(userId, courseId, trackSlug = 'global') {
    const parts = await Part.find({ course: courseId }).select('_id');
    const partIds = parts.map(p => p._id);

    if (!partIds.length) {
        return { total: 0, completed: 0, percent: 0, completedLessonIds: [] };
    }

    const courseLessons = await Lesson.find({ part: { $in: partIds } }).select('_id');
    const courseLessonIds = courseLessons.map(l => l._id);
    const total = courseLessonIds.length;

    if (!total) {
        return { total: 0, completed: 0, percent: 0, completedLessonIds: [] };
    }

    const userCompleted = await UserLessonProgress.find({
        user: userId,
        lesson: { $in: courseLessonIds },
        trackSlug,
    }).select('lesson');

    const completedLessonIds = userCompleted.map(doc => doc.lesson);
    const completed = completedLessonIds.length;
    const percent = Math.round((completed / total) * 100);

    return { total, completed, percent, completedLessonIds };
}

// @route  POST /api/progress/lessons/:lessonId/complete
// @body   { trackSlug? }   — defaults to 'global' when accessed without a track context
exports.saveProgress = async (req, res, next) => {
    try {
        const { lessonId } = req.params;
        const trackSlug = (req.body && req.body.trackSlug) || 'global';

        const lesson = await Lesson.findById(lessonId)
            .select('_id part')
            .populate({ path: 'part', select: '_id course' });

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Mark lesson complete for this user + track (idempotent upsert)
        await UserLessonProgress.updateOne(
            { user: req.user._id, lesson: lessonId, trackSlug },
            { $setOnInsert: { completedAt: new Date() } },
            { upsert: true }
        );

        const courseId = lesson.part.course;
        const { total, completed, percent } = await getCourseProgress(req.user._id, courseId, trackSlug);

        return res.status(200).json({ success: true, total, completed, percent });
    } catch (err) {
        return next(err);
    }
};

// @route  GET /api/progress/courses/:courseId?trackSlug=mern-stack
exports.getUserProgressByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const trackSlug = req.query.trackSlug || 'global';
        const { total, completed, percent, completedLessonIds } =
            await getCourseProgress(req.user._id, courseId, trackSlug);
        return res.status(200).json({ total, completed, percent, completedLessonIds });
    } catch (err) {
        return next(err);
    }
};

// @route  GET /api/progress/parts/:partId?trackSlug=mern-stack
exports.getUserProgressByPart = async (req, res, next) => {
    try {
        const { partId } = req.params;
        const trackSlug = req.query.trackSlug || 'global';

        const lessons = await Lesson.find({ part: partId }).select('_id');
        const lessonIds = lessons.map(l => l._id);
        const total = lessonIds.length;

        if (!total) {
            return res.status(200).json({ total: 0, completed: 0, percent: 0 });
        }

        const completed = await UserLessonProgress.countDocuments({
            user: req.user._id,
            lesson: { $in: lessonIds },
            trackSlug,
        });

        const percent = Math.round((completed / total) * 100);
        return res.status(200).json({ total, completed, percent });
    } catch (err) {
        return next(err);
    }
};
