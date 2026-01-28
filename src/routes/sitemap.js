const express = require("express");
const router = express.Router();
const Course = require("../models/course");
const Part = require("../models/part");
const Lesson = require("../models/lesson");

router.get("/", async (req, res) => {
  try {
    res.header("Content-Type", "application/xml");
    const sitemap = await generateSitemap();
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    // Return valid XML even on error
    res.status(500).header("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dev-el.co/</loc>
  </url>
</urlset>`);
  }
});

// Generate sitemap dynamically
async function generateSitemap() {
  const baseUrl = process.env.FRONTEND_URL || "https://dev-el.co";

  // Fetch courses
  const courses = await Course.find().select("_id slug updatedAt").lean();

  // Fetch all parts with their course reference
  const parts = await Part.find()
    .select('_id course')
    .populate('course', 'slug')
    .lean();

  // Fetch all lessons with their part reference
  const lessons = await Lesson.find()
    .select('_id slug updatedAt part')
    .populate({
      path: 'part',
      select: 'course',
      populate: {
        path: 'course',
        select: 'slug'
      }
    })
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

  // Add dynamic lesson URLs (nested: course > part > lesson)
  lessons.forEach((lesson) => {
    // Check if we have the full chain: lesson -> part -> course
    if (lesson.part && lesson.part.course && lesson.part.course.slug && lesson.slug) {
      const lastmod = lesson.updatedAt
        ? lesson.updatedAt.toISOString()
        : new Date().toISOString();
      const courseSlug = lesson.part.course.slug;
      const lessonSlug = lesson.slug;
      
      xml += `
  <url>
    <loc>${baseUrl}/course/${courseSlug}/${lessonSlug}</loc>
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
