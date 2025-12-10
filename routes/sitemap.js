const express = require("express");
const router = express.Router();

// Import your Lesson model
const Lesson = require("../models/Lesson");

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

  // Fetch lessons from MongoDB
  const lessons = await Lesson.find({ isPublished: true })
    .select("course slug updatedAt")
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
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
`;

  // Add dynamic lesson URLs
  lessons.forEach((lesson) => {
    const lastmod = lesson.updatedAt
      ? lesson.updatedAt.toISOString()
      : new Date().toISOString();

    xml += `
  <url>
    <loc>${baseUrl}/course/${lesson.course}/${lesson.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
}

module.exports = router;
