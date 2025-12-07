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

    let course = await Course.findOne({ slug: identifier }).populate({
      path: "parts",
      model: "Part",
      populate: {
        path: "lessons",
        model: "Lesson",
      },
    });

    // If not found by slug, try by title (case-insensitive)
    if (!course) {
      course = await Course.findOne({ 
        title: { $regex: new RegExp(`^${identifier}$`, 'i') } 
      }).populate({
        path: "parts",
        model: "Part",
        populate: {
          path: "lessons",
          model: "Lesson",
        },
      });
    }

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