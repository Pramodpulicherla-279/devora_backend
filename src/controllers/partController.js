const Part = require("../models/part");
const Course = require("../models/course");

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
