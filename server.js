/* ═══════════════════════════════════════════════════════
   SERVER.JS — Express backend for Portfolio
   ═══════════════════════════════════════════════════════
   Features:
     • Serves static frontend files
     • POST /api/contact   → validates, saves message, sends email
     • GET  /api/contacts  → admin endpoint to list all messages
     • GET  /api/health    → health check
     • Works with MongoDB OR JSON file (no setup needed!)
     • Rate-limiting, CORS, Helmet security headers
   ═══════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ───────────────────────────────── */

// Security headers (allow inline scripts/styles your frontend uses)
app.use(
    helmet({
        contentSecurityPolicy: false, // frontend uses inline styles & CDN scripts
    })
);

// CORS — allow requests from any origin in dev
app.use(cors());

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate-limiter for API routes — 20 requests per 15 min per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
});

/* ── Static files (your frontend) ────────────── */
app.use(express.static(__dirname));

/* ── API Routes ──────────────────────────────── */
app.use('/api/contact', apiLimiter, contactRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Server is running 🚀',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/* ── SPA fallback — serve index.html for any non-API route ── */
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ── Global error handler ────────────────────── */
app.use((err, _req, res, _next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error.',
    });
});

/* ── Try MongoDB, fallback to JSON file storage ── */
async function startServer() {
    let dbConnected = false;

    // Try MongoDB if MONGO_URI is configured
    if (process.env.MONGO_URI) {
        try {
            const mongoose = require('mongoose');
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ MongoDB connected');
            dbConnected = true;
            // Store flag so routes know to use MongoDB
            app.set('useMongoDb', true);
        } catch (err) {
            console.log('⚠️  MongoDB unavailable:', err.message);
        }
    }

    if (!dbConnected) {
        console.log('📁 Using JSON file storage (no MongoDB needed)');
        app.set('useMongoDb', false);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running → http://localhost:${PORT}`);
        console.log(`📂 Open the URL above in your browser!`);
    });
}

startServer();

module.exports = app;
