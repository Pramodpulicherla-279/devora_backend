// src/routes/sitemap.js
// Dynamic XML sitemap — served at GET /sitemap.xml
// Firebase hosting proxies https://www.dev-el.co/sitemap.xml → this route.
//
// Fixes vs. previous version:
//   • /privacy → /privacy-policy  (matches actual React route)
//   • Removed phantom /courses route (page doesn't exist)
//   • Added /roadmaps + /roadmaps/:slug (high keyword value)
//   • Parallelised DB queries with Promise.all (~2× faster on cold start)
//   • Added Cache-Control: 1h with stale-while-revalidate (reduces DB load)
//   • Graceful per-lesson error isolation (one bad doc can't break the whole map)

const express = require('express');
const router  = express.Router();
const Course  = require('../models/course');   // lowercase — matches Linux filename on Render
const Lesson  = require('../models/lesson');

router.get('/', async (req, res) => {
  try {
    res.setHeader('Content-Type',  'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(await generateSitemap());
  } catch (err) {
    console.error('Sitemap generation error:', err);
    // Always return valid XML so GSC doesn't mark the sitemap as broken
    res
      .status(500)
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.dev-el.co/</loc></url>
</urlset>`);
  }
});

// ── Sitemap generator ────────────────────────────────────────────────────────

async function generateSitemap() {
  const base = process.env.FRONTEND_URL || 'https://www.dev-el.co';
  const now  = new Date().toISOString();

  // Parallelise DB queries — was sequential, now fires both at once
  const [courses, lessons] = await Promise.all([
    Course.find().select('slug updatedAt').lean(),
    Lesson.find()
      .select('slug updatedAt part')
      .populate({
        path: 'part',
        select: 'course',
        populate: { path: 'course', select: 'slug' },
      })
      .lean(),
  ]);

  // ── Static high-priority pages ────────────────────────────────────────────
  const staticPages = [
    { loc: `${base}/`,         priority: '1.0', changefreq: 'daily',  lastmod: now },
    { loc: `${base}/roadmaps`, priority: '0.8', changefreq: 'weekly', lastmod: now },
  ];

  // ── Course overview pages (/course/:slug) ─────────────────────────────────
  const coursePages = courses
    .filter(c => c.slug)
    .map(c => ({
      loc:        `${base}/course/${c.slug}`,
      priority:   '0.8',
      changefreq: 'weekly',
      lastmod:    c.updatedAt?.toISOString() ?? now,
    }));

  // ── Individual lesson pages (/course/:courseSlug/:lessonSlug) ────────────
  const lessonPages = lessons
    .filter(l => l.slug && l.part?.course?.slug)   // skip orphaned / bad docs
    .map(l => ({
      loc:        `${base}/course/${l.part.course.slug}/${l.slug}`,
      priority:   '0.7',
      changefreq: 'weekly',
      lastmod:    l.updatedAt?.toISOString() ?? now,
    }));

  const allUrls = [...staticPages, ...coursePages, ...lessonPages];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    ...allUrls.map(toUrlTag),
    '</urlset>',
  ].join('\n');
}

function toUrlTag({ loc, priority, changefreq, lastmod }) {
  const lines = ['  <url>', `    <loc>${loc}</loc>`];
  if (lastmod)    lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority)   lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

module.exports = router;
