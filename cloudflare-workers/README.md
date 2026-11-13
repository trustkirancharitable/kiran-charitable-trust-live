# Cloudflare Worker Deployment Guide

This worker runs at Cloudflare edge locations globally, providing:
1. **R2 Asset Streaming**: Direct high-speed streaming of profile photos from `trustholdersimages` bucket.
2. **Reverse Proxying**: Unifies frontend and backend domains under your custom domain (e.g. `kirancharitabletrust.org`).
3. **WAF & Security**: Injects HSTS, nosniff, frame protection, and forwards real client IPs (`CF-Connecting-IP`).
4. **Edge Caching**: Caches static assets, CSS, images, and fonts with automatic stale-while-revalidate.

## Quick Deployment

```bash
# 1. Install Wrangler CLI (if not already installed)
npm install -g wrangler

# 2. Login to Cloudflare Account (b0d2ee1b8e6fd8162c62ff84d1386fa8)
npx wrangler login

# 3. Deploy Worker
npx wrangler deploy
```
