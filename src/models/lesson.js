const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true // Ensures slugs are unique across all lessons
    },
    content: {
        type: String, // Can be changed to store HTML, Markdown, etc.
        required: true,
    },
    part: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Part',
        required: true,
    }
});

module.exports = mongoose.model('Lesson', lessonSchema);
