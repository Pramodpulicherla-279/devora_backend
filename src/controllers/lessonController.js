const Lesson = require("../models/lesson");
const Part = require("../models/part");
const slugify = require("slugify");

exports.getLessons = async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ part: req.params.partId });
    if (!lessons) {
      return res.status(404).json({ success: false, error: "No lessons found for this part" });
    }
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.searchLessons = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: "Query is required" });
    const lessons = await Lesson.find({ title: { $regex: q, $options: "i" } }).select("title slug");
    res.status(200).json({ success: true, data: lessons });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getLesson = async (req, res, next) => {
  try {
    const { partSlug } = req.params;
    const part = await Part.findOne({ slug: partSlug });
    if (!part) return res.status(404).json({ success: false, error: "Part not found" });
    const lessons = await Lesson.find({ part: part._id });
    if (!lessons || lessons.length === 0) {
      return res.status(404).json({ success: false, error: "No lessons found for this part" });
    }
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getLessonBySlug = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ slug: req.params.slug }).populate({
      path: "part",
      populate: { path: "course", select: "slug title" },
    });
    if (!lesson) return res.status(404).json({ success: false, error: "Lesson not found" });
    res.status(200).json({ success: true, data: lesson });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createLesson = async (req, res) => {
  try {
    const { partId } = req.params;
    const slug = slugify(req.body.title, { lower: true, strict: true });
    const lessonData = { ...req.body, slug, part: partId };
    const lesson = await Lesson.create(lessonData);
    await Part.findByIdAndUpdate(partId, { $push: { lessons: lesson._id } });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, error: "Lesson not found" });

    const fields = ['title', 'content', 'status', 'difficulty', 'estimatedTime', 'audience', 'tags', 'quiz', 'interviewQuestions'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) lesson[f] = req.body[f];
    });

    const updatedLesson = await lesson.save();
    res.status(200).json({ success: true, data: updatedLesson });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all lessons (admin use)
// @route   GET /api/lessons
exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().select('title slug status difficulty part').lean();
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Reorder lessons within a part
// @route   PUT /api/lessons/:partId/reorder
exports.reorderLessons = async (req, res) => {
  try {
    const { partId } = req.params;
    const { lessonIds } = req.body;
    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({ success: false, error: 'lessonIds must be an array' });
    }
    await Part.findByIdAndUpdate(partId, { lessons: lessonIds });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    // Remove lesson reference from its part
    await Part.findByIdAndUpdate(lesson.part, { $pull: { lessons: lesson._id } });
    await Lesson.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Lesson deleted.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
