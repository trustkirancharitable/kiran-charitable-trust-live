const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 8080;
const PROD_API = 'https://www.kirancharitabletrust.org/api/telemetry/live-health';

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error loading dashboard page');
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
    } else if (req.url === '/api/telemetry/live-health') {
        // Forward/Proxy telemetry request to live production backend or return internal live telemetry
        https.get(PROD_API, (apiRes) => {
            let rawData = '';
            apiRes.on('data', chunk => rawData += chunk);
            apiRes.on('end', () => {
                res.writeHead(apiRes.statusCode || 200, { 'Content-Type': 'application/json' });
                res.end(rawData);
            });
        }).on('error', (err) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                status: 'LOCAL_STANDALONE',
                message: 'Operating in local standalone mode',
                error: err.message
            }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n============================================================`);
    console.log(`📡 Kiran Trust Standalone Telemetry Website is LIVE`);
    console.log(`🔗 Local Address: http://localhost:${PORT}`);
    console.log(`============================================================\n`);
});
