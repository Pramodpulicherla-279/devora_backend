const mongoose = require('mongoose');

const userLessonProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    // Which track this progress belongs to.
    // 'global' = accessed directly (no track context).
    // Separate records per track so MERN Stack HTML progress ≠ Frontend Dev HTML progress.
    trackSlug: {
      type: String,
      required: true,
      default: 'global',
      index: true,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One record per (user, lesson, trackSlug) — allows same lesson to be tracked independently
// across different enrolled tracks.
// NOTE: drop the old (user, lesson) unique index from MongoDB before deploying:
//   db.userlessonprogresses.dropIndex('user_1_lesson_1')
userLessonProgressSchema.index({ user: 1, lesson: 1, trackSlug: 1 }, { unique: true });

module.exports = mongoose.model('UserLessonProgress', userLessonProgressSchema);