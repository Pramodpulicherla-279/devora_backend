const Course = require("../models/course");
const slugify = require('slugify');

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
    const identifier = req.params.slug;
    const mongoose = require('mongoose');

    const populate = {
      path: "parts",
      model: "Part",
      populate: { path: "lessons", model: "Lesson" },
    };

    let course = null;

    // Try by ObjectId first (when called with _id from admin)
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      course = await Course.findById(identifier).populate(populate);
    }

    // Try by slug
    if (!course) {
      course = await Course.findOne({ slug: identifier }).populate(populate);
    }

    // Try by title (case-insensitive)
    if (!course) {
      course = await Course.findOne({
        title: { $regex: new RegExp(`^${identifier}$`, 'i') }
      }).populate(populate);
    }

    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// exports.createCourse = async (req, res, next) => {
//   try {
//     const course = await Course.create(req.body);
//     res.status(201).json({
//       success: true,
//       data: course,
//     });
//     console.log("called create course api");
//   } catch (err) {
//     res.status(400).json({ success: false });
//   }
// };

exports.createCourse = async (req, res, next) => {
  try {
    // Generate a slug from the title
    const slug = slugify(req.body.title, { lower: true, strict: true });

    const course = await Course.create({
      ...req.body,
      slug
    });

    res.status(201).json({
      success: true,
      data: course,
    });
    console.log("called create course api");
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const identifier = req.params.slug;
    const mongoose = require('mongoose');
    let course = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      course = await Course.findById(identifier);
    }
    if (!course) course = await Course.findOne({ slug: identifier });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const allowed = ['title', 'description', 'status', 'coverImage', 'icon'];
    allowed.forEach(f => { if (req.body[f] !== undefined) course[f] = req.body[f]; });
    const updated = await course.save();
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const Part = require('../models/part');
    const Lesson = require('../models/lesson');
    const mongoose = require('mongoose');
    // Route param is :slug but we accept both id and slug
    const id = req.params.slug || req.params.id;

    let course = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    }
    if (!course) {
      course = await Course.findOne({ slug: id });
    }
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const courseId = course._id;
    // Delete all lessons in all parts of this course
    const parts = await Part.find({ course: courseId });
    for (const part of parts) {
      await Lesson.deleteMany({ part: part._id });
    }
    // Delete all parts
    await Part.deleteMany({ course: courseId });
    // Delete the course
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ success: true, message: 'Course and all its content deleted.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};