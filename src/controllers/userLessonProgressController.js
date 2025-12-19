const Lesson = require('../models/lesson');
const Part = require('../models/part');
const UserLessonProgress = require('../models/userLessonProgress');

// helper: compute course progress for a given user
async function getCourseProgress(userId, courseId) {
  // All parts in this course
  const parts = await Part.find({ course: courseId }).select('_id');
  const partIds = parts.map(p => p._id);

  if (!partIds.length) {
    return { total: 0, completed: 0, percent: 0 };
  }

  // All lessons in this course
  const courseLessons = await Lesson.find({ part: { $in: partIds } }).select('_id');
  const courseLessonIds = courseLessons.map(l => l._id);
  const total = courseLessonIds.length;

  if (!total) {
    return { total: 0, completed: 0, percent: 0 };
  }

  const completed = await UserLessonProgress.countDocuments({
    user: userId,
    lesson: { $in: courseLessonIds },
  });

  const percent = Math.round((completed / total) * 100);

  return { total, completed, percent };
}

exports.saveProgress = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId)
      .select('_id part')
      .populate({ path: 'part', select: '_id course' });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // mark this lesson as completed for this user (idempotent)
    await UserLessonProgress.updateOne(
      { user: req.user._id, lesson: lessonId },
      { $setOnInsert: { completedAt: new Date() } },
      { upsert: true }
    );

    // course-level progress for this specific user
    const courseId = lesson.part.course;
    const { total, completed, percent } = await getCourseProgress(req.user._id, courseId);

    return res.status(200).json({
      success: true,
      total,
      completed,
      percent, // course-level percent for this user
    });
  } catch (err) {
    return next(err);
  }
};

// OPTIONAL: GET course-level progress explicitly
exports.getUserProgressByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { total, completed, percent } = await getCourseProgress(req.user._id, courseId);
    return res.status(200).json({ total, completed, percent });
  } catch (err) {
    return next(err);
  }
};

exports.getUserProgressByPart = async (req, res, next) => {
  try {
    const { partId } = req.params;

    // All lessons in this part
    const lessons = await Lesson.find({ part: partId }).select('_id');
    const lessonIds = lessons.map(l => l._id);
    const total = lessonIds.length;

    if (!total) {
      return res.status(200).json({ total: 0, completed: 0, percent: 0 });
    }

    // Completed lessons for this user in this part
    const completed = await UserLessonProgress.countDocuments({
      user: req.user._id,
      lesson: { $in: lessonIds },
    });

    const percent = Math.round((completed / total) * 100);

    return res.status(200).json({ total, completed, percent });
  } catch (err) {
    return next(err);
  }
};