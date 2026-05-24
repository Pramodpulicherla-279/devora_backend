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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
