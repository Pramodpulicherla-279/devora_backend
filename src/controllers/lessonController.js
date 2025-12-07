const Lesson = require("../models/lesson");
const Part = require("../models/part");
const slugify = require("slugify");

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

exports.getLesson = async (req, res, next) => {
  try {
    const { partSlug } = req.params;

    // First, find the part by slug
    const part = await Part.findOne({ slug: partSlug });

    if (!part) {
      return res.status(404).json({
        success: false,
        error: "Part not found",
      });
    }

    // Then find all lessons for that part
    const lessons = await Lesson.find({ part: part._id });

    if (!lessons || lessons.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No lessons found for this part",
      });
    }

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getLessonBySlug = async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ slug: req.params.slug }).populate('part');
        
        if (!lesson) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lesson not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: lesson,
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

    // Generate slug from title
    const slug = slugify(req.body.title, { lower: true, strict: true });

    const lessonData = {
      ...req.body,
      slug,
      part: partId,
    };

    // Create the new lesson
    const lesson = await Lesson.create(lessonData);

    // Add the new lesson's ID to the part's lessons array
    await Part.findByIdAndUpdate(partId, {
      $push: { lessons: lesson._id },
    });

    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update a lesson
// @route   PUT /api/lessons/:id
// @access  Private/Admin
exports.updateLesson = async (req, res) => {
  const { title, content } = req.body;

  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, error: "Lesson not found" });
    }

    // Update fields that are provided
    lesson.title = title || lesson.title;
    lesson.content = content !== undefined ? content : lesson.content;

    const updatedLesson = await lesson.save();

    res.status(200).json({
      success: true,
      data: updatedLesson,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
