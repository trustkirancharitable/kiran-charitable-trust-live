import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
    FaSignOutAlt, 
    FaExternalLinkAlt, 
    FaUser, 
    FaChevronDown,
    FaThLarge,
    FaReceipt,
    FaShieldAlt
} from 'react-icons/fa';
import KLogo from '../assets/Klogo.jpeg';
import './Header.css';

export default function PortalHeader() {
    const { user, isAuthenticated, logout } = useAuth();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [avatarImgError, setAvatarImgError] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Close dropdown on route change or outside click
    useEffect(() => {
        setProfileDropdownOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = () => {
        setProfileDropdownOpen(false);
        logout(false);
        localStorage.removeItem('kct_user');
        localStorage.removeItem('kct_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login?tab=login';
    };

    const userName = user?.name || user?.fullName || 'Trust Member';
    const userRole = user?.role === 'admin' ? 'Administrator' : 'Official Trust Member';
    const memberId = user?.memberId || user?.trustMemberId || user?.trustMember?.memberId || 'KCT-MEM-1007';
    const userInitial = (userName.charAt(0) || 'M').toUpperCase();
    const avatarUrl = user?.avatar || user?.profilePhoto || user?.trustMember?.profilePhoto || null;

    return (
        <header className="header" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
            height: '72px',
            display: 'flex',
            alignItems: 'center'
        }}>
            <div style={{
                maxWidth: 1440,
                width: '100%',
                margin: '0 auto',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Left: Kiran Logo & Official Portal Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Link to={isAuthenticated ? "/portal/profile" : "/login?tab=register"} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Kiran Charitable Trust">
                        <div style={{
                            height: '46px',
                            width: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            padding: '2px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <img src={KLogo} alt="Kiran Charitable Trust" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        </div>
                    </Link>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                background: '#1E3A8A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '4px',
                                letterSpacing: '0.6px',
                                textTransform: 'uppercase'
                            }}>
                                Member Portal
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                                Regd. No. 3/2026
                            </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                            Kiran Charitable Trust
                        </span>
                    </div>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Link back to Main Website */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#334155',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                        title="Open Kiran Charitable Trust Public Website in a new tab"
                    >
                        <span>Main Website</span>
                        <FaExternalLinkAlt style={{ fontSize: '11px', color: '#64748B' }} />
                    </a>

                    {isAuthenticated ? (
                        /* Authenticated Member Pill & Dropdown */
                        <div className="profile-menu-container" ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: profileDropdownOpen ? '#EFF6FF' : '#FFFFFF',
                                    border: '1.5px solid #3B82F6',
                                    borderRadius: '50px',
                                    padding: '4px 14px 4px 5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {avatarUrl && !avatarImgError ? (
                                    <img
                                        src={avatarUrl}
                                        alt={userName}
                                        referrerPolicy="no-referrer"
                                        onError={() => setAvatarImgError(true)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '1.5px solid #2563EB'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: 14,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {userInitial}
                                    </div>
                                )}
                                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {userName}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: 700 }}>
                                        {userRole}
                                    </div>
                                </div>
                                <FaChevronDown style={{ fontSize: '10px', color: '#64748B', transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            {/* Dropdown Menu */}
                            {profileDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: 250,
                                    background: '#FFFFFF',
                                    borderRadius: 12,
                                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                                    border: '1px solid #E2E8F0',
                                    zIndex: 1100,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Membership Account</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{userName}</div>
                                        <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, marginTop: 1 }}>{memberId}</div>
                                    </div>
                                    <div style={{ padding: '6px' }}>
                                        <Link
                                            to="/portal/profile?tab=dashboard"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: '#1E293B', textDecoration: 'none', borderRadius: 6 }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FaThLarge style={{ color: '#2563EB' }} /> Member Dashboard
                                        </Link>
                                        <Link
                                            to="/portal/profile?tab=profile"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: '#1E293B', textDecoration: 'none', borderRadius: 6 }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FaUser style={{ color: '#2563EB' }} /> Profile &amp; Settings
                                        </Link>
                                        <Link
                                            to="/portal/profile?tab=payments"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: '#1E293B', textDecoration: 'none', borderRadius: 6 }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FaReceipt style={{ color: '#059669' }} /> Payment History &amp; 80G
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setProfileDropdownOpen(false)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: '13px', fontWeight: 700, color: '#1D4ED8', textDecoration: 'none', borderRadius: 6, background: '#EFF6FF' }}
                                            >
                                                <FaShieldAlt style={{ color: '#1D4ED8' }} /> Admin Panel
                                            </Link>
                                        )}
                                    </div>
                                    <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
                                    <div style={{ padding: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={handleSignOut}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '9px 12px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: '#DC2626',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FaSignOutAlt /> Sign Out of Portal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* If not logged in and not on login page, offer Sign In or Join */
                        location.pathname !== '/portal/login' && location.pathname !== '/portal/signin' ? (
                            <Link
                                to="/login?tab=login"
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    background: '#2563EB',
                                    padding: '7px 16px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                Member Login
                            </Link>
                        ) : (
                            <Link
                                to="/login?tab=register"
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    background: '#16A34A',
                                    padding: '7px 16px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                Register as Member
                            </Link>
                        )
                    )}
                </div>
            </div>
        </header>
    );
}
