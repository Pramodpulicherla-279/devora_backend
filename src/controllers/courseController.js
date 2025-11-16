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
