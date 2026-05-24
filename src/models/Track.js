const mongoose = require('mongoose');
const slugify = require('slugify');

const trackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  type: { type: String, default: 'Web Development' },
  isOptional: { type: Boolean, default: false },
  icon: { type: String, default: '🛤️' }
}, { timestamps: true });

trackSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Track', trackSchema);
