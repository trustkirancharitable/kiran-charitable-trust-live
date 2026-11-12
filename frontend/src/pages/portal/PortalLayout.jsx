import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  FaThLarge,
  FaUser,
  FaReceipt,
  FaBell,
  FaHeart,
  FaUsers,
  FaTrophy,
  FaChartLine,
  FaExternalLinkAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaSignInAlt,
  FaUserPlus
} from 'react-icons/fa';
import KLogo from '../../assets/Klogo.jpeg';
import './Portal.css';

export default function PortalLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync unread notification count from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kct_user_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        const unread = Array.isArray(parsed) ? parsed.filter(n => !n.read).length : 0;
        setUnreadCount(unread);
      }
    } catch (e) {}
  }, [location]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  const handleSignOut = () => {
    logout(false);
    localStorage.removeItem('kct_user');
    localStorage.removeItem('kct_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login?tab=login';
  };

  const isAuthPage = ['/portal/join', '/portal/login', '/portal/signup', '/portal/forgot-password', '/portal/signin', '/portal/register', '/portal/become-a-member'].some(p => location.pathname.startsWith(p));

  // Determine current active section for sidebar highlighting
  const currentTab = searchParams.get('tab') || (location.pathname.includes('/dashboard') ? 'dashboard' : 'dashboard');
  const isProfileRoute = location.pathname.includes('/portal/profile') || location.pathname.includes('/portal/dashboard');

  const userName = user?.name || user?.fullName || 'Trust Member';
  const memberId = user?.memberId || user?.trustMemberId || user?.trustMember?.memberId || 'KCT-MEM-1007';
  const userInitial = (userName.charAt(0) || 'M').toUpperCase();
  const avatarUrl = user?.avatar || user?.profilePhoto || user?.trustMember?.profilePhoto || null;

  // ─────────────────────────────────────────────────────────────
  // 1. DEDICATED CLEAN AUTH LAYOUT (For Registration & Login)
  // ─────────────────────────────────────────────────────────────
  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFD' }}>
        {/* Minimal Auth Topbar */}
        <header style={{
          height: '70px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Kiran Charitable Trust">
                <div style={{ height: 44, width: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 2 }}>
                  <img src={KLogo} alt="Kiran Trust" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#1E3A8A', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Member Portal
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  Kiran Charitable Trust
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!location.pathname.includes('/login') && !location.pathname.includes('/signin') && (
                <Link
                  to="/login?tab=login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    padding: '8px 16px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    background: '#0F52BA',
                    boxShadow: '0 2px 8px rgba(15, 82, 186, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FaSignInAlt style={{ fontSize: 12 }} /> Member Login
                </Link>
              )}
              {location.pathname.includes('/login') && (
                <Link
                  to="/login?tab=register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0F52BA',
                    padding: '8px 16px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FaUserPlus style={{ fontSize: 12 }} /> Join as Member
                </Link>
              )}
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#475569',
                  padding: '7px 14px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  transition: 'all 0.15s ease'
                }}
              >
                <FaArrowLeft style={{ fontSize: 11 }} /> Return to Main Website
              </a>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Outlet />
        </main>

        {/* Minimal Footer */}
        <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '20px 16px', textAlign: 'center', fontSize: 12 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span>© {new Date().getFullYear()} Kiran Charitable Trust • Regd. No. 3/2026</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Terms</a>
              <span style={{ color: '#10B981' }}>🔒 100% Safe &amp; Verified</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STRICT AUTH GUARD FOR ALL MEMBER PORTAL PAGES
  // If not logged in, any route under /portal/ MUST redirect to /portal/login
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login?tab=login" replace state={{ from: location.pathname }} />;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ENTERPRISE SIDE MENU BAR (SIDEBAR) PORTAL LAYOUT
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="portal-app-layout">
      {/* ── LEFT SIDEBAR NAVIGATION ── */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="portal-sidebar-top">
          {/* Brand header */}
          <Link to="/portal/profile" className="portal-sidebar-brand" title="Kiran Charitable Trust Member Portal">
            <img src={KLogo} alt="Logo" className="portal-sidebar-logo" />
            <div className="portal-sidebar-brand-text">
              <span className="portal-brand-main">Kiran Trust</span>
              <span className="portal-brand-sub">Member Portal</span>
            </div>
          </Link>

          {/* Navigation Menu Items */}
          <nav className="portal-sidebar-menu">
            <Link
              to="/portal/profile?tab=dashboard"
              className={`portal-sidebar-item ${isProfileRoute && currentTab === 'dashboard' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaThLarge className="portal-sidebar-icon" />
                <span>Member Dashboard</span>
              </div>
            </Link>

            <Link
              to="/portal/profile?tab=profile"
              className={`portal-sidebar-item ${isProfileRoute && currentTab === 'profile' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaUser className="portal-sidebar-icon" />
                <span>Profile &amp; ID Card</span>
              </div>
            </Link>

            <Link
              to="/portal/profile?tab=payments"
              className={`portal-sidebar-item ${isProfileRoute && currentTab === 'payments' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaReceipt className="portal-sidebar-icon" />
                <span>Payment History &amp; 80G</span>
              </div>
            </Link>

            <Link
              to="/portal/profile?tab=notifications"
              className={`portal-sidebar-item ${isProfileRoute && currentTab === 'notifications' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaBell className="portal-sidebar-icon" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span style={{ fontSize: 11, background: '#2563EB', color: '#ffffff', borderRadius: 20, padding: '1px 7px', fontWeight: 800 }}>
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/portal/profile?tab=payments&action=contribute#contribute"
              className="portal-sidebar-item"
              style={{ color: '#34D399' }}
            >
              <div className="portal-sidebar-item-left">
                <FaHeart className="portal-sidebar-icon" style={{ color: '#10B981' }} />
                <span>Make Contribution</span>
              </div>
            </Link>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '8px 4px' }} />

            {/* Public Community Views inside Portal */}
            <Link
              to="/portal/members"
              className={`portal-sidebar-item ${location.pathname === '/portal/members' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaUsers className="portal-sidebar-icon" />
                <span>Trust Members Wall</span>
              </div>
            </Link>

            <Link
              to="/portal/donors"
              className={`portal-sidebar-item ${location.pathname === '/portal/donors' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaTrophy className="portal-sidebar-icon" />
                <span>Top Donors Leaderboard</span>
              </div>
            </Link>

            <Link
              to="/portal/stats"
              className={`portal-sidebar-item ${location.pathname === '/portal/stats' ? 'active' : ''}`}
            >
              <div className="portal-sidebar-item-left">
                <FaChartLine className="portal-sidebar-icon" />
                <span>Impact Dashboard</span>
              </div>
            </Link>
          </nav>
        </div>

        {/* ── SIDEBAR BOTTOM: USER IDENTITY & ACTIONS ── */}
        <div className="portal-sidebar-bottom">
          {isAuthenticated && user ? (
            <>
              <div className="portal-sidebar-user">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="portal-sidebar-avatar" />
                ) : (
                  <div className="portal-sidebar-avatar">{userInitial}</div>
                )}
                <div className="portal-sidebar-user-info">
                  <div className="portal-sidebar-user-name" title={userName}>{userName}</div>
                  <div className="portal-sidebar-user-role">{memberId}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.14)',
                    color: '#F87171',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaSignOutAlt style={{ fontSize: 12 }} />
                  <span>Sign Out of Portal</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>
                Guest Visitor Session
              </div>
              <Link
                to="/login?tab=login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: '#2563EB',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                <FaSignInAlt /> Sign In to Portal
              </Link>
              <Link
                to="/login?tab=register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#93C5FD',
                  border: '1px solid rgba(147, 197, 253, 0.25)',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                <FaUserPlus /> Join as Member
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT MAIN WORKSPACE ── */}
      <div className="portal-main-wrapper">
        {/* Slim Topbar Header */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
                fontSize: 18,
                cursor: 'pointer',
                padding: 6,
                display: 'inline-flex',
                alignItems: 'center'
              }}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>

            <h1 className="portal-topbar-title">
              {location.pathname === '/portal/members' ? 'Trust Members Directory' :
               location.pathname === '/portal/donors' ? 'Top Donors Leaderboard' :
               location.pathname === '/portal/stats' ? 'Trust Impact Dashboard' :
               currentTab === 'profile' ? 'Profile & Settings' :
               currentTab === 'payments' ? 'Payment History & Tax Exemption' :
               currentTab === 'notifications' ? 'Notifications & Updates' :
               'Member Console & Dashboard'}
            </h1>
          </div>

          <div className="portal-topbar-right">
            {/* Notification Bell Icon */}
            <Link
              to="/portal/profile?tab=notifications"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: currentTab === 'notifications' ? '#EFF6FF' : '#F1F5F9',
                color: currentTab === 'notifications' ? '#2563EB' : '#475569',
                border: currentTab === 'notifications' ? '1.5px solid #93C5FD' : '1px solid #CBD5E1',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              title="Notifications & Updates"
            >
              <FaBell style={{ fontSize: 15 }} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 10,
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Direct Contribution Trigger next to Profile */}
            <Link
              to="/portal/profile?tab=payments&action=contribute#contribute"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #059669, #10B981)',
                padding: '7px 14px',
                borderRadius: 6,
                border: 'none',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Make an instant tax-deductible contribution to Kiran Charitable Trust"
            >
              <FaHeart style={{ fontSize: 11 }} />
              <span>Contribute</span>
            </Link>

            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid #E2E8F0' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563EB', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    {userInitial}
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName.split(' ')[0]}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid #E2E8F0' }}>
                <Link
                  to="/login?tab=login"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#2563EB',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #BFDBFE',
                    background: '#EFF6FF'
                  }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Content Body (Independent Vertical Scroll Area) */}
        <div className="portal-content-body">
          <Outlet />
        </div>

        {/* Fixed Pinned Bottom Footer */}
        <footer className="portal-fixed-footer">
          <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span>© {new Date().getFullYear()} Kiran Charitable Trust • Official Member &amp; Donor Portal (Regd. No. 3/2026)</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Terms of Service</a>
              <span style={{ color: '#10B981' }}>🔒 100% Safe &amp; Verified</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
