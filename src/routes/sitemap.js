const express = require("express");
const router = express.Router();
const Course = require("../models/course");
const Lesson = require("../models/lesson");

router.get("/", async (req, res) => {
  try {
    res.header("Content-Type", "application/xml");
    const sitemap = await generateSitemap();
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

// Generate sitemap dynamically
async function generateSitemap() {
  const baseUrl = process.env.FRONTEND_URL || "https://dev-el.co";

  // Fetch courses and lessons from MongoDB
  const courses = await Course.find().select("_id slug updatedAt").lean();

  // Fetch lessons with their course reference
  const lessons = await Lesson.find()
    .select('_id slug updatedAt courseId')
    .populate('courseId', 'slug')
    .lean();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Home Page -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Courses Page -->
  <url>
    <loc>${baseUrl}/courses</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

  // Add dynamic course URLs
  courses.forEach((course) => {
    const lastmod = course.updatedAt
      ? course.updatedAt.toISOString()
      : new Date().toISOString();
    const identifier = course.slug || course._id;
    xml += `
  <url>
    <loc>${baseUrl}/course/${identifier}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  // Add dynamic lesson URLs (nested under courses)
  lessons.forEach((lesson) => {
    if (lesson.courseId && lesson.courseId.slug) {
      const lastmod = lesson.updatedAt
        ? lesson.updatedAt.toISOString()
        : new Date().toISOString();
      const lessonIdentifier = lesson.slug || lesson._id;
      const courseSlug = lesson.courseId.slug;
      xml += `
  <url>
    <loc>${baseUrl}/course/${courseSlug}/${lessonIdentifier}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  });

  xml += `
</urlset>`;

  return xml;
}

module.exports = router;
