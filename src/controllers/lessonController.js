const Lesson = require('../models/lesson');
const Part = require('../models/part');

exports.getLessons = async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ part: req.params.partId });

    if (!lessons) {
      return res
        .status(404)
        .json({ success: false, error: "No lessons found for this part" });
    }
    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


// @desc    Create a new lesson for a part
// @route   POST /api/parts/:partId/lessons
exports.createLesson = async (req, res) => {
    try {
        const { partId } = req.params;
        const lessonData = { ...req.body, part: partId };

        // Create the new lesson
        const lesson = await Lesson.create(lessonData);

        // Add the new lesson's ID to the part's lessons array
        await Part.findByIdAndUpdate(partId, { $push: { lessons: lesson._id } });

        res.status(201).json({ success: true, data: lesson });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};