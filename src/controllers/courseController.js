const Course = require("../models/course");

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find();
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: "parts",
      model: "Part",
      populate: {
        path: "lessons",
        model: "Lesson",
      },
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: "Invalid course ID" });
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({
      success: true,
      data: course,
    });
    console.log("called create course api");
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
