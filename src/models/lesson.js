const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctIndex: { type: Number, default: 0 },
  explanation: { type: String, default: '' }
}, { _id: true });

const interviewQuestionSchema = new mongoose.Schema({
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  question: { type: String, required: true },
  answer: { type: String, default: '' }
}, { _id: true });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedTime: { type: Number, default: 15 },
  audience: { type: String, default: 'Beginner Developers' },
  tags: { type: [String], default: [] },
  quiz: { type: [quizSchema], default: [] },
  interviewQuestions: { type: [interviewQuestionSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
