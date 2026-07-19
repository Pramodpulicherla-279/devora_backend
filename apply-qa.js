// apply-qa.js — validate & idempotently write quiz + interviewQuestions + fillBlanks to lessons.
// Usage: node apply-qa.js qa-data/<file>.json
// Only writes to lessons whose quiz is currently empty (idempotent / safe to re-run).
//
// JSON shape (per lesson):
// {
//   "slug": "...",
//   "quiz": [ {question, options[4], correctIndex, explanation} x5 ],
//   "interviewQuestions": [ {level, question, answer} x6  (2 beginner/2 intermediate/2 advanced) ],
//   "fillBlanks": [ {template, answer} OR full {prompt,language,template,blanks[],explanation} x2 ]
// }
// For fillBlanks the lean form {template, answer, [language], [prompt], [accepts], [caseSensitive]}
// auto-derives blanks/hint/explanation to match the platform convention.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const mongoose = require('mongoose');
require('./src/models/lesson');
const Lesson = mongoose.model('Lesson');

const file = process.argv[2];
if (!file) { console.error('Usage: node apply-qa.js <file.json>'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function validateQuiz(slug, quiz) {
  const errs = [];
  if (!Array.isArray(quiz) || quiz.length !== 5) errs.push(`quiz must have 5 (got ${quiz && quiz.length})`);
  (quiz || []).forEach((q, i) => {
    if (!q.question) errs.push(`quiz[${i}] missing question`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(`quiz[${i}] must have 4 options`);
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) errs.push(`quiz[${i}] correctIndex 0-3`);
    if (!q.explanation) errs.push(`quiz[${i}] missing explanation`);
  });
  return errs;
}

function validateInterview(slug, iq) {
  const errs = [];
  if (!Array.isArray(iq) || iq.length !== 6) errs.push(`interview must have 6 (got ${iq && iq.length})`);
  const split = { beginner: 0, intermediate: 0, advanced: 0 };
  (iq || []).forEach((q, i) => {
    if (!['beginner', 'intermediate', 'advanced'].includes(q.level)) errs.push(`interview[${i}] bad level`);
    else split[q.level]++;
    if (!q.question) errs.push(`interview[${i}] missing question`);
    if (!q.answer) errs.push(`interview[${i}] missing answer`);
  });
  if (split.beginner !== 2 || split.intermediate !== 2 || split.advanced !== 2)
    errs.push(`interview level split must be 2/2/2 (got ${JSON.stringify(split)})`);
  return errs;
}

// Normalises a lean fillBlank ({template, answer}) into full schema shape,
// auto-deriving hint ("Starts with \"X\", N characters") and explanation.
function normalizeFillBlank(fb, errs, slug, idx) {
  const out = {
    prompt: fb.prompt || 'Fill in the blank to complete this Python example.',
    language: fb.language || 'python',
    template: fb.template,
    blanks: [],
    explanation: fb.explanation || ''
  };
  if (!fb.template || !/\{\{\d+\}\}/.test(fb.template)) { errs.push(`fillBlanks[${idx}] template missing {{n}} token`); return out; }
  const tokens = [...fb.template.matchAll(/\{\{(\d+)\}\}/g)].map(m => parseInt(m[1], 10));

  let blanks = fb.blanks;
  if (!blanks) {
    // lean form: single {template, answer}
    if (fb.answer == null) { errs.push(`fillBlanks[${idx}] needs answer or blanks`); return out; }
    blanks = [{ id: tokens[0] || 1, answer: String(fb.answer), accepts: fb.accepts || [], caseSensitive: fb.caseSensitive !== false }];
  }
  out.blanks = blanks.map(b => {
    const answer = String(b.answer);
    const hint = b.hint || `Starts with "${answer[0]}", ${answer.length} characters`;
    return { id: b.id, answer, accepts: b.accepts || [], caseSensitive: b.caseSensitive !== false, hint };
  });
  // token/blank cross-check
  const blankIds = out.blanks.map(b => b.id).sort();
  const tokIds = [...new Set(tokens)].sort();
  if (JSON.stringify(blankIds) !== JSON.stringify(tokIds)) errs.push(`fillBlanks[${idx}] blank ids ${JSON.stringify(blankIds)} != tokens ${JSON.stringify(tokIds)}`);
  if (!out.explanation) {
    if (out.blanks.length === 1) out.explanation = `The missing keyword is "${out.blanks[0].answer}".`;
    else out.explanation = 'The missing pieces complete the snippet.';
  }
  return out;
}

function validateFill(slug, fills, errs) {
  if (!Array.isArray(fills) || fills.length < 1 || fills.length > 2) errs.push(`fillBlanks must have 1-2 (got ${fills && fills.length})`);
  return (fills || []).map((fb, i) => normalizeFillBlank(fb, errs, slug, i));
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  let written = 0, skipped = 0, failed = 0;
  for (const rec of data) {
    const errs = [];
    errs.push(...validateQuiz(rec.slug, rec.quiz));
    errs.push(...validateInterview(rec.slug, rec.interviewQuestions));
    const normFills = validateFill(rec.slug, rec.fillBlanks, errs);
    if (errs.length) { console.log(`✗ ${rec.slug}: ${errs.join('; ')}`); failed++; continue; }

    const lesson = await Lesson.findOne({ slug: rec.slug }).select('slug quiz');
    if (!lesson) { console.log(`✗ ${rec.slug}: lesson not found`); failed++; continue; }
    if (lesson.quiz && lesson.quiz.length > 0) { skipped++; continue; }

    await Lesson.updateOne({ slug: rec.slug }, {
      $set: {
        quiz: rec.quiz,
        interviewQuestions: rec.interviewQuestions,
        fillBlanks: normFills
      }
    });
    written++;
  }
  console.log(`\nDONE ${file}: written ${written} | skipped(existing) ${skipped} | failed ${failed}`);
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
