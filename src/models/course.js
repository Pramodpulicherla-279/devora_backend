const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Part" }]
});

module.exports = mongoose.model("Course", courseSchema);
