const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }]
});

module.exports = mongoose.model('Part', partSchema);
