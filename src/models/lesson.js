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

// A single blank inside a fill-in-the-blanks exercise.
// `id` matches a {{n}} token in the parent `template`.
const blankSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  answer: { type: String, required: true },        // canonical correct answer
  accepts: { type: [String], default: [] },        // optional extra accepted answers
  caseSensitive: { type: Boolean, default: true }, // strict (W3Schools-style) by default
  hint: { type: String, default: '' }
}, { _id: false });

// One fill-in-the-blanks exercise: a code/text `template` containing
// {{1}}, {{2}} … tokens that are rendered as inputs in the frontend.
const fillBlankSchema = new mongoose.Schema({
  prompt: { type: String, default: '' },           // instruction above the snippet
  language: { type: String, default: 'html' },     // label / future syntax highlight
  template: { type: String, required: true },      // text with {{n}} tokens
  blanks: { type: [blankSchema], default: [] },
  explanation: { type: String, default: '' }       // shown once all blanks are correct
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
  interviewQuestions: { type: [interviewQuestionSchema], default: [] },
  fillBlanks: { type: [fillBlankSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
