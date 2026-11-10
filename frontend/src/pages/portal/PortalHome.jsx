import { Link } from 'react-router-dom';
import './Portal.css';

export default function PortalHome() {
  return (
    <div>
      {/* ── Banner ── */}
      <section className="pt-page-banner">
        <span className="pt-page-tag">✦ Official Trust Portal</span>
        <h1 className="pt-page-heading">
          Welcome to the <span>Kiran Charitable Trust</span> Portal
        </h1>
        <p className="pt-page-sub">
          A dedicated portal for official Trust Members, benefactors, and supporters.
          Explore member directories, our top donor leaderboard, and transparent real-time impact metrics.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
          <Link to="/portal/join" className="pt-btn-cta" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            🏛️ Become a Trust Member
          </Link>
          <Link
            to="/portal/members"
            style={{
              padding: '0.85rem 2rem',
              fontSize: '1rem',
              fontWeight: 700,
              background: '#FFFFFF',
              border: '1.5px solid var(--pt-border-strong)',
              borderRadius: 50,
              color: 'var(--pt-secondary)',
              textDecoration: 'none'
            }}
          >
            👥 View Trust Members
          </Link>
        </div>
      </section>

      {/* ── 4 Dedicated Sections Grid ── */}
      <div className="pt-container">
        {/* Quick Highlights Strip */}
        <div className="pt-quick-stats">
          <div className="pt-quick-stat">
            <span className="pt-quick-val">480<span>+</span></span>
            <span className="pt-quick-label">Active Members</span>
          </div>
          <div className="pt-quick-stat">
            <span className="pt-quick-val">₹4.85<span>L</span></span>
            <span className="pt-quick-label">Funds Mobilized</span>
          </div>
          <div className="pt-quick-stat">
            <span className="pt-quick-val">100<span>%</span></span>
            <span className="pt-quick-label">Direct Welfare Transfer</span>
          </div>
          <div className="pt-quick-stat">
            <span className="pt-quick-val">80G</span>
            <span className="pt-quick-label">Tax Exemption Certified</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="pt-page-tag">Portal Sections</span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--pt-secondary)', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
            Dedicated Portal Hub
          </h2>
          <p style={{ color: 'var(--pt-text-gray)', fontSize: '1.05rem', maxWidth: 620, margin: '0.5rem auto 0' }}>
            Select an area below to manage your membership standing, browse certified members, view rankings, or monitor live philanthropy velocity.
          </p>
        </div>

        <div className="pt-overview-grid">
          {/* Card 1: Become a Member */}
          <Link to="/portal/join" className="pt-overview-card">
            <div>
              <div className="pt-card-icon">🏛️</div>
              <h3 className="pt-card-title">Become a Member</h3>
              <p className="pt-card-desc">
                Register as an official Trust Member with Aadhaar and optional PAN details.
                Select your membership tier (from ₹500/mo) and activate with direct contribution online.
              </p>
            </div>
            <span className="pt-card-action">Register & Join Now →</span>
          </Link>

          {/* Card 2: Trust Members Grid */}
          <Link to="/portal/members" className="pt-overview-card">
            <div>
              <div className="pt-card-icon">👥</div>
              <h3 className="pt-card-title">Trust Members</h3>
              <p className="pt-card-desc">
                Browse the complete public directory of certified Trust Members with official Member IDs,
                membership tiers, joined dates, and profile photos.
              </p>
            </div>
            <span className="pt-card-action">Explore Member Grid →</span>
          </Link>

          {/* Card 3: Top Donors Leaderboard */}
          <Link to="/portal/donors" className="pt-overview-card">
            <div>
              <div className="pt-card-icon">🏆</div>
              <h3 className="pt-card-title">Top Donors Leaderboard</h3>
              <p className="pt-card-desc">
                Hall of fame ranking top 10 contributors ordered from highest to lowest with an honored
                podium for the top 3 and monthly/all-time views.
              </p>
            </div>
            <span className="pt-card-action">View Top Donors →</span>
          </Link>

          {/* Card 4: Monthly Contribution */}
          <Link to="/portal/monthly-donor" className="pt-overview-card">
            <div>
              <div className="pt-card-icon">💖</div>
              <h3 className="pt-card-title">Monthly Contribution</h3>
              <p className="pt-card-desc">
                Subscribe directly to monthly child nutrition, elder healthcare, or rural education pillars.
                Direct online contribution with no login required.
              </p>
            </div>
            <span className="pt-card-action">Contribute Monthly →</span>
          </Link>

          {/* Card 5: Impact Stats Dashboard */}
          <Link to="/portal/stats" className="pt-overview-card">
            <div>
              <div className="pt-card-icon">📊</div>
              <h3 className="pt-card-title">Donor & Impact Stats</h3>
              <p className="pt-card-desc">
                Real-time dashboard tracking daily, weekly, monthly, yearly, and overall donor counts,
                contribution averages, and goal progress.
              </p>
            </div>
            <span className="pt-card-action">Open Live Dashboard →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
