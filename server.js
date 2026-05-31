const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const itemRoutes = require('./src/routes/itemRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const partRoutes = require('./src/routes/partRoutes');
const lessonRoutes = require('./src/routes/lessonRoutes');
const userRoutes = require('./src/routes/userRoutes');
const sitemapRouter = require('./src/routes/sitemap');
const progressRoutes = require('./src/routes/userProgressRoutes');
const domainRoutes = require('./src/routes/domainRoutes');
const trackRoutes = require('./src/routes/trackRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: true,                          // reflect the request origin (dev + prod)
  credentials: true,
  exposedHeaders: ['X-New-Token'],       // let the browser read our sliding-token header
}));
app.use(express.json({ limit: '10mb' }));

// ── SEO HTTP headers ──────────────────────────────────────────────────────────
// 1. Block search engines from indexing API endpoints.
//    Without this, Googlebot wastes crawl budget on /api/* JSON responses.
app.use('/api', (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// 2. Global headers — improve CDN caching correctness + security posture
app.use((req, res, next) => {
  // Tells proxies/CDNs this response varies by encoding — prevents serving
  // gzipped content to clients that don't support it.
  res.setHeader('Vary', 'Accept-Encoding, Accept');

  // Prevents MIME-type sniffing — small but meaningful trust signal for Google
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Passes referrer data to GSC so traffic sources are correctly attributed
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// 3. Canonical domain enforcement.
//    Redirects bare domain → www so Google treats them as one canonical origin.
//    Only relevant if Render ever receives a request with host = dev-el.co.
app.use((req, res, next) => {
  if ((req.headers.host || '') === 'dev-el.co') {
    return res.redirect(301, `https://www.dev-el.co${req.url}`);
  }
  next();
});
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/items', itemRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/sitemap.xml', sitemapRouter);
app.use('/api/progress', progressRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server running on port ${PORT}`));
