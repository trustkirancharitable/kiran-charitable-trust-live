/**
 * Jaeger Distributed Tracing Middleware
 * Kiran Charitable Trust High-Security Enterprise Architecture
 * Compatible with OpenTelemetry / Jaeger OpenTracing & W3C TraceContext
 */

const crypto = require('crypto');

// In-memory trace buffer for local inspection & export
const traceBuffer = [];
const MAX_BUFFER_SIZE = 500;

class JaegerSpan {
    constructor(traceId, parentSpanId, name, tags = {}) {
        this.traceId = traceId;
        this.spanId = crypto.randomBytes(8).toString('hex');
        this.parentSpanId = parentSpanId || null;
        this.name = name;
        this.startTime = Date.now();
        this.endTime = null;
        this.duration = null;
        this.tags = {
            'service.name': 'kiran-charitable-trust-backend',
            'span.kind': 'server',
            ...tags
        };
        this.logs = [];
        this.status = 'OK';
    }

    setTag(key, value) {
        this.tags[key] = value;
        return this;
    }

    log(event, payload = {}) {
        this.logs.push({
            timestamp: Date.now(),
            event,
            ...payload
        });
        return this;
    }

    finish(status = 'OK') {
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        this.status = status;

        if (traceBuffer.length >= MAX_BUFFER_SIZE) {
            traceBuffer.shift();
        }
        traceBuffer.push(this.toJSON());

        // Attempt non-blocking UDP/HTTP export to local Jaeger collector if available
        if (process.env.JAEGER_ENDPOINT) {
            exportToJaeger(this.toJSON()).catch(() => {});
        }
    }

    toJSON() {
        return {
            traceId: this.traceId,
            spanId: this.spanId,
            parentSpanId: this.parentSpanId,
            name: this.name,
            startTime: this.startTime,
            endTime: this.endTime,
            durationMs: this.duration,
            status: this.status,
            tags: this.tags,
            logs: this.logs
        };
    }
}

async function exportToJaeger(span) {
    try {
        const endpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(span)
        });
    } catch (e) {
        // Silent fail-open for tracing
    }
}

function jaegerTracingMiddleware(req, res, next) {
    // Extract incoming W3C traceparent or Jaeger uber-trace-id, or generate new
    const incomingTrace = req.headers['x-trace-id'] || 
                          req.headers['uber-trace-id']?.split(':')[0] || 
                          `kct-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    const incomingParentSpan = req.headers['x-span-id'] || null;

    const rootSpan = new JaegerSpan(incomingTrace, incomingParentSpan, `${req.method} ${req.path}`, {
        'http.method': req.method,
        'http.url': req.originalUrl || req.url,
        'http.user_agent': req.headers['user-agent'] || 'unknown',
        'http.client_ip': req.ip || req.connection.remoteAddress || '127.0.0.1'
    });

    req.traceId = incomingTrace;
    req.jaegerSpan = rootSpan;

    // Attach tracing headers to response for end-to-end client observability
    res.setHeader('X-Trace-ID', incomingTrace);
    res.setHeader('X-Span-ID', rootSpan.spanId);

    // Track request completion
    const startTime = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        
        rootSpan.setTag('http.status_code', res.statusCode);
        rootSpan.setTag('http.duration_ms', parseFloat(durationMs));

        if (res.statusCode >= 500) {
            rootSpan.finish('ERROR');
        } else {
            rootSpan.finish('OK');
        }
    });

    next();
}

function getRecentTraces(limit = 50) {
    return traceBuffer.slice(-limit).reverse();
}

module.exports = {
    jaegerTracingMiddleware,
    JaegerSpan,
    getRecentTraces
};
