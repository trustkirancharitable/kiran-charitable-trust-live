# Kiran Charitable Trust — Official Web Platform

A production-grade, full-stack philanthropic web platform for **Kiran Charitable Trust**, built with React 19, Vite, Node.js/Express, MongoDB Atlas, Cloudflare R2, and Vercel Serverless Architecture.

---

## 🌟 Platform Highlights

- **Donor Recognition & Leaderboards**: Dynamic real-time donor leaderboards with time-filtered rankings (*Overall, Day, Week, Month, Year*), digital certificates of honor, and Giving Society tiers.
- **Trust Members Directory & Governance**: Interactive directory displaying all executive and active trust members with Cloudflare R2-backed photo hosting and real-time governance status.
- **Secure Donation Processing**: SabPaisa payment gateway integration with 80G tax exemption receipts, automated PDF receipt dispatch, and email notifications.
- **Titan Mail Integration**: Automated transaction receipts, OTP verifications, and automated 24-hour cleanup cron for expired verification records.
- **Dedicated Administrative Suite**: Comprehensive admin control center for managing donations, trust members, email notifications, audit logs, and donor records.
- **Google Cloud OAuth 2.0 & Cloudflare Turnstile**: Zero-friction Google Sign-In and automated bot prevention for public forms.

---

## 📁 Repository Structure

```
kiran-charitable-trust-live/
├── backend/
│   ├── api/                 # Serverless entrypoint for Vercel
│   ├── assets/              # Email templates & visual assets
│   ├── middleware/          # JWT, CORS, helmet, and rate limiting
│   ├── models/              # Mongoose schemas (Donation, User, TrustMember)
│   ├── public/              # Static public assets
│   ├── routes/              # Express API routers (auth, donors, donations, admin, trustMembers)
│   ├── scripts/             # Data seeding and maintenance utilities
│   ├── services/            # Cloudflare R2, Titan SMTP, Ranking, and Schedulers
│   ├── tests/               # Service verification suites
│   ├── package.json
│   ├── server.js            # Express application setup
│   └── vercel.json          # Backend serverless configuration
├── frontend/
│   ├── public/              # Favicons, webmanifest, sitemap, robots.txt, documents
│   ├── src/
│   │   ├── assets/          # Static logos and photography
│   │   ├── components/      # Header, Footer, AuthModal, LeaderboardSection
│   │   ├── context/         # AuthContext provider
│   │   ├── pages/           # Home, About, FounderDesk, DonorsLeaderboard, TrustMembers, Admin, etc.
│   │   ├── config.js        # Dynamic API configuration
│   │   └── App.jsx          # Route definitions
│   ├── package.json
│   ├── vite.config.js       # Vite build & proxy configuration
│   └── vercel.json          # Frontend SPA routing configuration
├── api/                     # Root serverless proxy
├── vercel.json              # Monorepo fallback routing configuration
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Clone the Repository
```bash
git clone https://github.com/trustkirancharitable/kiran-charitable-trust-live.git
cd kiran-charitable-trust-live
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas & service credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env to set VITE_API_BASE_URL (defaults to /api or http://localhost:5000/api)
npm run dev
```

The frontend will run at `http://localhost:5173` and proxy API calls to the backend on `http://localhost:5000`.

---

## 🌐 Production Deployments

- **Frontend Production URL**: [https://kiran-trust-frontend-live.vercel.app](https://kiran-trust-frontend-live.vercel.app)
- **Backend API Production URL**: [https://kiran-trust-backend-live.vercel.app](https://kiran-trust-backend-live.vercel.app)

---

## 🔒 Security & Compliance
- Rate limiting on sensitive authentication and payment endpoints
- Helmet HTTP security headers
- Strict MongoDB operator sanitization
- CORS origin whitelisting for official domain and Vercel environments
- Section 80G tax compliance receipt generation
