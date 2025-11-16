const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./src/config/db');
const itemRoutes = require('./src/routes/itemRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const partRoutes = require('./src/routes/partRoutes');
const lessonRoutes = require('./src/routes/lessonRoutes')

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());

// Mount routers
app.use('/api/items', itemRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/lessons', lessonRoutes);
const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(`Server running on port ${PORT}`)
);