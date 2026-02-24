const express = require('express');
const cors = require('cors');

// Import routes
const lexiconRoutes = require('./modules/lexicon/lexicon.routes');
const lexiconAdminRoutes = require('./modules/lexicon/lexicon.admin.routes');

const app = express();

// ========================
// Middleware
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// Health Check
// ========================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Dynamic Legal Lexicon API is running',
        timestamp: new Date().toISOString(),
    });
});

// ========================
// API Routes
// ========================
app.use('/api/lexicon', lexiconRoutes);
app.use('/api/lexicon/admin', lexiconAdminRoutes);

// ========================
// 404 Handler
// ========================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ========================
// Global Error Handler
// ========================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

module.exports = app;
