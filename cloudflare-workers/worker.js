/**
 * Cloudflare Worker for Kiran Charitable Trust
 * Handles: Edge Caching, Security Headers (WAF), R2 Image Serving, and API Reverse-Proxying
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. R2 Direct Media Serving (/media/* or /profile_photos/*)
        if (url.pathname.startsWith('/profile_photos/') || url.pathname.startsWith('/media/')) {
            const objectKey = url.pathname.replace(/^\//, '');
            if (env.TRUST_STORAGE) {
                const object = await env.TRUST_STORAGE.get(objectKey);
                if (object) {
                    const headers = new Headers();
                    object.writeHttpMetadata(headers);
                    headers.set('etag', object.httpEtag);
                    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
                    headers.set('Access-Control-Allow-Origin', '*');
                    return new Response(object.body, { headers });
                }
            }

            // Fallback to public R2 domain
            if (env.R2_PUBLIC_DOMAIN) {
                return Response.redirect(`${env.R2_PUBLIC_DOMAIN}/${objectKey}`, 302);
            }
        }

        // 2. API Reverse Proxy to Backend
        if (url.pathname.startsWith('/api/')) {
            const backendOrigin = env.ORIGIN_BACKEND || 'https://kiran-trust-backend-live.vercel.app';
            const targetUrl = new URL(url.pathname + url.search, backendOrigin);
            
            // Forward visitor IP and Geolocation
            const forwardHeaders = new Headers(request.headers);
            forwardHeaders.set('x-forwarded-host', url.host);
            forwardHeaders.set('cf-connecting-ip', request.headers.get('cf-connecting-ip') || '');
            forwardHeaders.set('cf-ipcountry', request.cf?.country || 'IN');

            const modifiedRequest = new Request(targetUrl, {
                method: request.method,
                headers: forwardHeaders,
                body: request.body,
                redirect: 'follow'
            });

            const apiResponse = await fetch(modifiedRequest);
            const responseHeaders = new Headers(apiResponse.headers);
            
            // WAF Security Headers
            responseHeaders.set('X-Content-Type-Options', 'nosniff');
            responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');
            responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

            return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders
            });
        }

        // 3. Static Web Application Delivery with Edge Security & Caching
        const frontendOrigin = env.ORIGIN_FRONTEND || 'https://kiran-trust-frontend-live.vercel.app';
        const targetUrl = new URL(url.pathname + url.search, frontendOrigin);

        const response = await fetch(targetUrl, {
            method: request.method,
            headers: request.headers
        });

        const newHeaders = new Headers(response.headers);

        // Security & Hardening Headers
        newHeaders.set('X-Content-Type-Options', 'nosniff');
        newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
        newHeaders.set('X-XSS-Protection', '1; mode=block');
        newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        // Edge Caching Strategy
        if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|avif|ico|woff2)$/)) {
            newHeaders.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    }
};
