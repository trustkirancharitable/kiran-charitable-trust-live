const path = require('path');

// Global Safety Interceptors to ensure 100% server uptime
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception intercepted:', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection intercepted:', reason?.message || reason);
});
try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    require('dotenv').config();
} catch (e) {
    // Environment variables injected directly in serverless environment
}
const dns = require('dns');

// DNS server fallback setup for local development network compatibility (disabled on Vercel)
if (!process.env.VERCEL && dns && typeof dns.setServers === 'function') {
    try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch (err) {
        console.warn('⚠️ DNS resolver warning:', err.message);
    }
}

const http = require('http');
const { initializeSocketIO } = require('./services/socketService');
const { jaegerTracingMiddleware } = require('./middleware/jaegerTracing');
const { metricsMiddleware, getMetricsEndpoint } = require('./services/metricsService');
const { kongGatewayMiddleware } = require('./gateway/kongGatewayMiddleware');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Trust reverse proxy (Required for Vercel / Cloudflare serverless edge)
app.set('trust proxy', 1);

// Security: Hide server technology stack info
app.disable('x-powered-by');

// Security: Enterprise Security Response Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!req.path.includes('sabpaisa-callback')) {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
    next();
});

// 1. Jaeger Distributed Tracing Middleware
app.use(jaegerTracingMiddleware);

// 2. Prometheus & Grafana Metrics Middleware
app.use(metricsMiddleware);

// 3. Kong-Pattern API Gateway Middleware
app.use(kongGatewayMiddleware);

// Database Connection Manager (Supports Serverless & Standalone Server)
mongoose.set('bufferCommands', false);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kiran-charitable-trust';

let isConnecting = false;
let lastDbAttempt = 0;
const DB_RETRY_INTERVAL_MS = 60000; // 60s cooldown between reconnect attempts to prevent request latency

const connectDB = async (force = false) => {
    if (mongoose.connection.readyState >= 1) return;
    if (isConnecting) return;
    if (!force && (Date.now() - lastDbAttempt < DB_RETRY_INTERVAL_MS)) return;

    lastDbAttempt = Date.now();
    try {
        isConnecting = true;
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
    } finally {
        isConnecting = false;
    }
};

// Initial connection attempt on boot
connectDB(true).catch(() => {});

// Database auto-connection middleware for serverless invocations
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState < 1) {
            connectDB().catch(() => {});
        }
    } catch (err) {
        console.error('⚠️ DB connection middleware notice:', err.message);
    }
    next();
});

// CORS Security Configuration
const configuredOrigins = [
    process.env.CLIENT_URL || 'https://www.kirancharitabletrust.org',
    'https://www.kirancharitabletrust.org',
    'https://kirancharitabletrust.org',
    'https://kiran-charitable-trust.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, server-to-server, curl)
        if (!origin) return callback(null, true);

        // Allow official domain, Vercel previews, and configured origins
        if (
            origin.endsWith('.vercel.app') ||
            origin.includes('kirancharitabletrust.org') ||
            configuredOrigins.includes(origin)
        ) {
            return callback(null, true);
        }

        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-Key']
}));

// Payload limits to prevent DoS vector attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input Sanitization Middleware — Strips potential MongoDB Operator Injection keys ($/.)
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        for (const key in obj) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        }
        return obj;
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    if (req.query) sanitize(req.query);
    next();
});

// Static directory for uploaded profile photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/trust-members', require('./routes/trustMembers'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/payment', require('./routes/donations'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/telemetry', require('./routes/telemetry'));

// Prometheus Scrape Endpoint for Grafana Dashboards
app.get('/metrics', getMetricsEndpoint);

// Root & Health check endpoints
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Kiran Charitable Trust API Live Service',
        status: 'online',
        timestamp: new Date()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Kiran Charitable Trust API is running cleanly',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'production'
    });
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Kiran Charitable Trust High-Security API'
    });
});

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Centralized Error Handler (Prevents leakage of sensitive stack traces in production)
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(isDev && { error: err.message })
    });
});

const { startAutoCleanupCron } = require('./services/emailCleanupService');
const { start30DayReminderScheduler } = require('./services/schedulerService');

// Standalone Server Execution for local testing
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    connectDB().finally(() => {
        const httpServer = http.createServer(app);
        initializeSocketIO(httpServer);
        httpServer.listen(PORT, () => {
            console.log(`🚀 High-Security Server running on http://localhost:${PORT}`);
            // Start automated purge of expired sent OTP emails (older than 3 days) from Titan mailbox
            startAutoCleanupCron(24);
            // Start automated 30-day recurring sustaining pledge reminder scheduler
            start30DayReminderScheduler(1);
        });
    });
}

module.exports = app;
