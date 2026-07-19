// dump-course.js — dump plain-text content of lessons (missing quiz) for a course slug.
// Usage: node dump-course.js <courseSlug> [maxChars]
require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./src/models/Course');
require('./src/models/part');
require('./src/models/lesson');
const Part = mongoose.model('Part');
const Lesson = mongoose.model('Lesson');

const slug = process.argv[2];
const maxChars = parseInt(process.argv[3] || '1000', 10);
if (!slug) { console.error('Usage: node dump-course.js <courseSlug> [maxChars]'); process.exit(1); }

function toText(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const course = await Course.findOne({ slug }).lean();
  if (!course) { console.error('Course not found:', slug); process.exit(1); }
  const parts = await Part.find({ course: course._id }).lean();
  const pids = parts.map(p => p._id);
  const lessons = await Lesson.find({
    part: { $in: pids },
    $or: [{ quiz: { $size: 0 } }, { quiz: { $exists: false } }]
  }).select('title slug content').lean();
  console.log(`COURSE: ${course.title}  (${lessons.length} lessons missing quiz)\n`);
  lessons.forEach((l, i) => {
    console.log(`\n===== [${i + 1}] ${l.slug} =====`);
    console.log(`TITLE: ${l.title}`);
    console.log(toText(l.content).slice(0, maxChars));
  });
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
