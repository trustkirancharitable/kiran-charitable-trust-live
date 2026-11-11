# 🏛️ Kiran Charitable Trust - Complete Production & Vercel Deployment Guide

This repository is fully configured for production deployment across **Vercel Serverless Monorepo**, **Containerized NGINX / Kong Load Balancer**, and **High-Availability Multi-Instance Node.js Cluster**.

---

## 🚀 1. Vercel 1-Click Monorepo Deployment (Recommended)

When you connect your GitHub repository to Vercel, Vercel will automatically detect `vercel.json` and deploy both the **React 18 / Vite Frontend** and the **Express 5 Serverless API** under a unified high-speed Anycast CDN domain.

### Deployment Steps:
1. Push this project repository to **GitHub**.
2. Navigate to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New" ➔ "Project"**.
3. Import your GitHub repository (`kiran-charitable-trust`).
4. **Framework Preset**: Auto-detected as **Vite** (Root Directory: `./`).
5. **Build & Development Settings**:
   - Build Command: `cd frontend && npm install && npm run build` (configured automatically via `vercel.json`)
   - Output Directory: `frontend/dist`
6. **Environment Variables**:
   Copy and paste the variables from `.env.example`:
   - `MONGO_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Random 256-bit cryptographically secure string
   - `ADMIN_EMAIL`: `trustkirancharitable@gmail.com`
   - `ADMIN_PASSWORD`: Your production admin password
   - `SABPAISA_CLIENT_CODE`: `KIRA99`
   - `SABPAISA_API_KEY`: Production SabPaisa API key
   - `SABPAISA_SECRET_KEY`: Production SabPaisa Secret key
   - `SABPAISA_BASE_URL`: `https://merchant-api.sabpaisa.in`
   - `SMTP_HOST`: `smtpout.secureserver.net`
   - `SMTP_PORT`: `465`
   - `SMTP_SECURE`: `true`
   - `EMAIL_USER`: `contact@kirancharitabletrust.org`
   - `EMAIL_PASS`: GoDaddy / Titan email account password
   - `SUPABASE_URL`: `https://goolhqjtldolfbvrkqxh.supabase.co`
   - `SUPABASE_ANON_KEY`: Supabase anon public key
   - `CLOUDFLARE_R2_BUCKET_NAME`: `trustholdersimages`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`: R2 access key ID
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: R2 secret access key
   - `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY`: Turnstile site key
   - `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
7. Click **Deploy**. Both the Frontend and the Backend Serverless API (`/api/*`) are live immediately.

---

## ⚡ 2. Multi-Instance Backend & Load Balancing (Enterprise Self-Hosted / VPS)

For Dedicated Cloud VMs (AWS EC2, DigitalOcean, Hetzner, GCP Compute Engine), Kiran Charitable Trust includes two native production clustering solutions:

### A. Native Node.js Kernel Cluster (Zero External Dependencies)
Uses the Node.js `cluster` module with round-robin (`SCHED_RR`) socket scheduling across CPU cores with auto-respawn:
```bash
# Starts 4 worker instances load balanced across cores:
npm run start:cluster
```
- Master PID monitors all child workers.
- If any worker process crashes, the primary master instantly forks an auto-healed replacement.

### B. PM2 Enterprise Process Manager
For auto-restarting services with memory thresholds:
```bash
# Start cluster using ecosystem.config.js:
npm run start:pm2

# Check real-time load distribution:
npx pm2 status
npx pm2 monit
```

### C. NGINX Reverse Proxy & SSL Load Balancer
Configured in `nginx/conf.d/kiran_trust.conf` with `least_conn` load balancing, Gzip compression, rate limiting (`30 req/sec`), and automated WebSocket upgrades for Socket.IO.

---

## 📧 3. Email System Architecture & Verification
- **Outbound Service**: GoDaddy Secureserver / Titan SMTP on Port `465` with SSL (`smtpout.secureserver.net`).
- **Authentication**: `contact@kirancharitabletrust.org`.
- **Templates**:
  - 6-Digit Verification OTP (automated 3-day cleanup).
  - 80G Tax Exemption Donation Receipt (Form 10BE compliant with auto-generated receipt number and amount in words).
  - Payment Pending / Bank Settlement Status notification.
  - Payment Failed alert with self-healing retry guidance.
  - 30-Day Recurring Sustaining Pledge Reminder.
- **Compliance Footers**: All emails include direct WhatsApp link (`+91 77024 68889`), email support, and official registered address:
  `Registered Office: Mandepudi Village, Amaravathi Mandal, Palnadu District, Andhra Pradesh - 522018`.

---

## 🛡️ 4. Security Architecture & Headers
- **Reverse Proxy Trust**: `app.set('trust proxy', 1)` configured for Vercel and Cloudflare.
- **Headers**:
  - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `SAMEORIGIN` (exempted specifically on SabPaisa callback iframe)
  - `X-XSS-Protection`: `1; mode=block`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
- **Rate Limiters**: Built-in IP rate limiters on payment endpoints and authentication routes.
- **Sensitive Stack Traces**: Suppressed in production error handling.
