const Domain = require('../models/domain');
const Course = require('../models/course');
const slugify = require('slugify');

exports.getDomains = async (req, res) => {
  try {
    const domains = await Domain.find().populate('courses', 'title slug status');
    res.json({ success: true, data: domains });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getDomain = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id).populate({
      path: 'courses',
      populate: { path: 'parts', select: 'title lessons' }
    });
    if (!domain) return res.status(404).json({ success: false, error: 'Domain not found' });
    res.json({ success: true, data: domain });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createDomain = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const domain = await Domain.create({ name, slug, description, icon });
    res.status(201).json({ success: true, data: domain });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!domain) return res.status(404).json({ success: false, error: 'Domain not found' });
    res.json({ success: true, data: domain });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    const domain = await Domain.findByIdAndDelete(req.params.id);
    if (!domain) return res.status(404).json({ success: false, error: 'Domain not found' });
    await Course.updateMany({ domains: req.params.id }, { $pull: { domains: req.params.id } });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.assignCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const domain = await Domain.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { courses: courseId } },
      { new: true }
    ).populate('courses', 'title slug status');
    await Course.findByIdAndUpdate(courseId, { $addToSet: { domains: req.params.id } });
    res.json({ success: true, data: domain });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.removeCourse = async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(
      req.params.id,
      { $pull: { courses: req.params.courseId } },
      { new: true }
    ).populate('courses', 'title slug status');
    await Course.findByIdAndUpdate(req.params.courseId, { $pull: { domains: req.params.id } });
    res.json({ success: true, data: domain });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
