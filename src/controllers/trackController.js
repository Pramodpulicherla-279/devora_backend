const Track = require('../models/track');
const Course = require('../models/course');
const slugify = require('slugify');

exports.getTracks = async (req, res) => {
  try {
    const tracks = await Track.find()
      .populate('courses', 'title slug status')
      .populate('domain', 'name slug');
    res.json({ success: true, data: tracks });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getTrack = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id)
      .populate({ path: 'courses', populate: { path: 'parts', select: 'title lessons' } })
      .populate('domain', 'name slug');
    if (!track) return res.status(404).json({ success: false, error: 'Track not found' });
    res.json({ success: true, data: track });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createTrack = async (req, res) => {
  try {
    const { name, description, domain, type, isOptional, icon } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const track = await Track.create({ name, slug, description, domain, type, isOptional, icon });
    res.status(201).json({ success: true, data: track });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateTrack = async (req, res) => {
  try {
    const track = await Track.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!track) return res.status(404).json({ success: false, error: 'Track not found' });
    res.json({ success: true, data: track });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteTrack = async (req, res) => {
  try {
    const track = await Track.findByIdAndDelete(req.params.id);
    if (!track) return res.status(404).json({ success: false, error: 'Track not found' });
    await Course.updateMany({ tracks: req.params.id }, { $pull: { tracks: req.params.id } });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.assignCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const track = await Track.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { courses: courseId } },
      { new: true }
    ).populate('courses', 'title slug status');
    await Course.findByIdAndUpdate(courseId, { $addToSet: { tracks: req.params.id } });
    res.json({ success: true, data: track });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.removeCourse = async (req, res) => {
  try {
    const track = await Track.findByIdAndUpdate(
      req.params.id,
      { $pull: { courses: req.params.courseId } },
      { new: true }
    ).populate('courses', 'title slug status');
    await Course.findByIdAndUpdate(req.params.courseId, { $pull: { tracks: req.params.id } });
    res.json({ success: true, data: track });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
