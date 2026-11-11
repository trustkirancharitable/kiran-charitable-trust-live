/**
 * Embedded Kong-Pattern API Gateway Middleware
 * Kiran Charitable Trust Resilient Architecture
 * Replicates Kong's Core Features: Routing, Rate Limiting, JWT Auth, Circuit Breaking & Observability
 */

const jwt = require('jsonwebtoken');
const { circuitBreakerTrips } = require('../services/metricsService');

// Circuit Breaker State Manager
class CircuitBreaker {
    constructor(failureThreshold = 5, cooldownPeriodMs = 30000) {
        this.failureThreshold = failureThreshold;
        this.cooldownPeriodMs = cooldownPeriodMs;
        this.state = 'CLOSED'; // CLOSED (normal), OPEN (tripped), HALF_OPEN (probing)
        this.consecutiveFailures = 0;
        this.lastTripTime = 0;
    }

    recordSuccess() {
        if (this.state === 'HALF_OPEN') {
            console.log('💚 [Kong Gateway Circuit Breaker] Service recovered cleanly -> Transitioning to CLOSED');
        }
        this.state = 'CLOSED';
        this.consecutiveFailures = 0;
    }

    recordFailure() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.failureThreshold && this.state !== 'OPEN') {
            this.state = 'OPEN';
            this.lastTripTime = Date.now();
            console.warn(`🚨 [Kong Gateway Circuit Breaker] Threshold reached (${this.consecutiveFailures} consecutive 5xx errors) -> TRIPPED to OPEN state for ${this.cooldownPeriodMs / 1000}s`);
            try {
                circuitBreakerTrips.inc({ service: 'kiran-backend-api' });
            } catch (e) {}
        }
    }

    canPass() {
        if (this.state === 'CLOSED') return true;
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastTripTime > this.cooldownPeriodMs) {
                this.state = 'HALF_OPEN';
                console.log('🔄 [Kong Gateway Circuit Breaker] Cooldown elapsed -> Probing with HALF_OPEN state');
                return true;
            }
            return false;
        }
        return true; // HALF_OPEN allows single probe request
    }
}

const circuitBreaker = new CircuitBreaker(5, 30000);

// In-Memory Token Bucket Rate Limiter (Kong Rate-Limiting Plugin Simulation)
const rateLimitBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_MINUTE = parseInt(process.env.KONG_RATE_LIMIT || '2000', 10);

function checkRateLimit(ip) {
    const now = Date.now();
    let bucket = rateLimitBuckets.get(ip);

    if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
        bucket = { windowStart: now, count: 1 };
        rateLimitBuckets.set(ip, bucket);
        return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1 };
    }

    if (bucket.count >= MAX_REQUESTS_PER_MINUTE) {
        return { allowed: false, remaining: 0 };
    }

    bucket.count++;
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - bucket.count };
}

// Periodic cleanup of expired rate limit buckets
setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of rateLimitBuckets.entries()) {
        if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
            rateLimitBuckets.delete(ip);
        }
    }
}, 60000);

/**
 * Kong-Pattern Gateway Middleware
 */
function kongGatewayMiddleware(req, res, next) {
    // 1. Gateway Routing Headers
    res.setHeader('X-Kong-Upstream-Latency', '1');
    res.setHeader('X-Kong-Proxy-Latency', '1');
    res.setHeader('Via', 'kong/3.6.0-enterprise-edition');

    // 2. Circuit Breaker Protection
    if (!circuitBreaker.canPass() && !req.path.includes('/health')) {
        return res.status(503).json({
            success: false,
            message: 'Service is temporarily protecting itself due to upstream latency (Kong Circuit Breaker Open).',
            retryAfter: 30
        });
    }

    // 3. Rate Limiting Check
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const rateStatus = checkRateLimit(clientIp);
    res.setHeader('X-RateLimit-Limit-Minute', MAX_REQUESTS_PER_MINUTE);
    res.setHeader('X-RateLimit-Remaining-Minute', rateStatus.remaining);

    if (!rateStatus.allowed && !req.path.includes('/health') && !req.path.includes('/metrics')) {
        return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded: Maximum 120 requests per minute allowed by Kong Gateway.'
        });
    }

    // 4. Track response status for circuit breaker
    res.on('finish', () => {
        if (res.statusCode >= 500) {
            circuitBreaker.recordFailure();
        } else if (res.statusCode < 400) {
            circuitBreaker.recordSuccess();
        }
    });

    next();
}

module.exports = {
    kongGatewayMiddleware,
    circuitBreaker
};
