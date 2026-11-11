/**
 * Prometheus & Grafana Metrics Service
 * Collects system, HTTP, payment, real-time socket, and Kafka metrics
 */

const client = require('prom-client');

// Create custom Prometheus Registry
const register = new client.Registry();

// Enable default runtime metrics (heap, cpu, gc, event loop)
client.collectDefaultMetrics({
    register,
    prefix: 'kiran_'
});

// Custom Metric 1: HTTP Request Counter
const httpRequestCounter = new client.Counter({
    name: 'kiran_http_requests_total',
    help: 'Total number of HTTP requests processed by Kiran Trust backend',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// Custom Metric 2: HTTP Duration Histogram
const httpRequestDuration = new client.Histogram({
    name: 'kiran_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register]
});

// Custom Metric 3: Donation Events Counter
const donationCounter = new client.Counter({
    name: 'kiran_donations_total',
    help: 'Total count of donation transactions across lifecycle',
    labelNames: ['status', 'payment_method', 'purpose'],
    registers: [register]
});

// Custom Metric 4: Total Donated Revenue Counter
const donationAmountCounter = new client.Counter({
    name: 'kiran_donation_amount_inr_total',
    help: 'Cumulative INR donation amount processed successfully',
    labelNames: ['purpose', 'donor_category'],
    registers: [register]
});

// Custom Metric 5: Active Socket.IO Real-Time Connections Gauge
const activeSocketConnections = new client.Gauge({
    name: 'kiran_socket_active_connections',
    help: 'Number of active Socket.IO clients currently connected',
    labelNames: ['room'],
    registers: [register]
});

// Custom Metric 6: Kafka Events Published Counter
const kafkaEventsPublished = new client.Counter({
    name: 'kiran_kafka_events_published_total',
    help: 'Total events streamed through Kafka message topics',
    labelNames: ['topic', 'status'],
    registers: [register]
});

// Custom Metric 7: Trust Member Push Notifications Counter
const memberNotificationsPushed = new client.Counter({
    name: 'kiran_notifications_pushed_total',
    help: 'Total push notifications dispatched to trust members',
    labelNames: ['category', 'target_tier', 'delivery_channel'],
    registers: [register]
});

// Custom Metric 8: Gateway Circuit Breaker Trips Counter
const circuitBreakerTrips = new client.Counter({
    name: 'kiran_circuit_breaker_tripped_total',
    help: 'Total number of times Kong/in-process circuit breaker tripped to protect services',
    labelNames: ['service'],
    registers: [register]
});

// Express middleware to measure HTTP request rate and latency
function metricsMiddleware(req, res, next) {
    const start = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationSec = diff[0] + diff[1] / 1e9;
        
        // Normalize route for clean Prometheus labels (avoid cardinality explosion)
        const normalizedRoute = req.baseUrl || req.path.replace(/\/[0-9a-fA-F-]{10,}/g, '/:id');
        const statusCode = res.statusCode ? res.statusCode.toString() : '500';

        httpRequestCounter.inc({
            method: req.method,
            route: normalizedRoute,
            status_code: statusCode
        });

        httpRequestDuration.observe({
            method: req.method,
            route: normalizedRoute,
            status_code: statusCode
        }, durationSec);
    });

    next();
}

// Metrics exporter for Prometheus scraping (/metrics)
async function getMetricsEndpoint(req, res) {
    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (err) {
        res.status(500).end(err.message);
    }
}

module.exports = {
    register,
    metricsMiddleware,
    getMetricsEndpoint,
    donationCounter,
    donationAmountCounter,
    activeSocketConnections,
    kafkaEventsPublished,
    memberNotificationsPushed,
    circuitBreakerTrips
};
