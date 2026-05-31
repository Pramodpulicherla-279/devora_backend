const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Part" }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  coverImage: { type: String, default: '' },
  icon: { type: String, default: '📘' },
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
  domains: [{ type: mongoose.Schema.Types.ObjectId, ref: "Domain" }]
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
