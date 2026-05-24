const Part = require("../models/part");
const Course = require("../models/course");

// @desc    Get ALL parts (admin)
// @route   GET /api/parts
exports.getAllParts = async (req, res) => {
  try {
    const parts = await Part.find()
      .populate('course', 'title')
      .lean();
    const mapped = parts.map(p => ({
      ...p,
      courseTitle: p.course?.title || 'Unknown Course',
    }));
    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getParts = async (req, res, next) => {
  try {
    const parts = await Part.find({ course: req.params.courseId });

    if (!parts) {
      return res
        .status(404)
        .json({ success: false, error: "No parts found for this course" });
    }
    res.status(200).json({
      success: true,
      count: parts.length,
      data: parts,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create a new part for a course
// @route   POST /api/courses/:courseId/parts
exports.createPart = async (req, res) => {
  try {
    const { courseId } = req.params;
    const partData = { ...req.body, course: courseId };

    // Create the new part
    const part = await Part.create(partData);

    // Add the new part's ID to the course's parts array
    await Course.findByIdAndUpdate(courseId, { $push: { parts: part._id } });

    res.status(201).json({ success: true, data: part });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete a part and all its lessons
// @route   DELETE /api/parts/:id
exports.deletePart = async (req, res) => {
  try {
    const Lesson = require('../models/lesson');
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });

    // Remove all lessons in this part
    await Lesson.deleteMany({ part: part._id });
    // Remove part reference from course
    await Course.findByIdAndUpdate(part.course, { $pull: { parts: part._id } });
    // Delete the part
    await Part.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Part and all its lessons deleted.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
