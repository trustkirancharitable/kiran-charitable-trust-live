import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    FaUser, FaHeart, FaIdCard, FaCalendarAlt, FaCheckCircle,
    FaSignOutAlt, FaPrint, FaStar, FaHandHoldingHeart, FaUsers
} from 'react-icons/fa';
import './Dashboard.css';

export default function Dashboard() {
    const { user, isAuthenticated, logout, openAuthModal } = useAuth();
    const navigate = useNavigate();

    const [memberData, setMemberData] = useState(null);
    const [volunteerData, setVolunteerData] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;

        const loadProfile = async () => {
            setIsLoading(true);
            try {
                // Fetch Trust Member profile
                if (user?.trustMemberId || user?.email) {
                    try {
                        const mRes = await axios.get(`${API_BASE_URL}/trust-members/profile/${user.trustMemberId || user.email}`);
                        if (mRes.data?.success) {
                            setMemberData(mRes.data.member);
                            setSchedules(mRes.data.schedules || []);
                        }
                    } catch (e) {}
                }

                // Fetch Volunteer profile
                if (user?.volunteerId || user?.email) {
                    try {
                        const vRes = await axios.get(`${API_BASE_URL}/volunteers/${user.volunteerId || user.email}`);
                        if (vRes.data?.success) {
                            setVolunteerData(vRes.data.volunteer);
                        }
                    } catch (e) {}
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [isAuthenticated, user]);

    if (!isAuthenticated) {
        return (
            <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="dash-card" style={{ maxWidth: 460, textAlign: 'center', padding: '40px 30px' }}>
                    <FaIdCard style={{ fontSize: 50, color: '#2563eb', marginBottom: 16 }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px' }}>Member Portal Sign-In</h2>
                    <p style={{ color: '#64748b', fontSize: 14.5, marginBottom: 24 }}>
                        Sign in with your Email OTP or Google account to access your digital ID card, monthly schedules, and donation receipts.
                    </p>
                    <button onClick={() => openAuthModal('otp')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Sign In with Email OTP
                    </button>
                    <button
                        onClick={() => openAuthModal('google')}
                        className="btn btn-outline"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                    >
                        Sign In with Google
                    </button>
                </div>
            </div>
        );
    }

    const pledgeAmount = memberData?.donationAmount || 500;
    const directDonateUrl = `/donate?amount=${pledgeAmount}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&purpose=Direct+Member+Profile+Donation`;

    const handlePrintId = () => {
        window.print();
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                {/* Header Profile Card */}
                <div className="dash-header-card">
                    <div className="dash-user-meta">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="dash-avatar" referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                            <div className="dash-avatar">
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                        )}
                        <div className="dash-user-info">
                            <h2>{user.name}</h2>
                            <p style={{ margin: '0 0 10px', fontSize: 14, opacity: 0.9 }}>{user.email}</p>
                            <div className="dash-badges">
                                {volunteerData && (
                                    <span className="dash-badge">
                                        <FaCheckCircle style={{ color: '#10b981' }} /> Volunteer ({volunteerData.uniqueId})
                                    </span>
                                )}
                                {memberData && (
                                    <span className="dash-badge gold">
                                        <FaStar /> Trust Member ({memberData.memberId})
                                    </span>
                                )}
                                <span className="dash-badge">
                                    Role: {user.role?.toUpperCase() || 'MEMBER'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* DIRECT DONATE BUTTON IN PROFILE */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Link to={directDonateUrl} className="dash-direct-donate-btn">
                            <FaHeart /> Donate Now / Pay Pledge
                        </Link>
                        <button
                            onClick={logout}
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '12px 18px' }}
                            title="Sign Out"
                        >
                            <FaSignOutAlt /> Sign Out
                        </button>
                    </div>
                </div>

                <div className="dash-grid">
                    {/* Left Column */}
                    <div>
                        {/* Trust Membership Subscription Status */}
                        {memberData ? (
                            <div className="dash-card">
                                <h3><FaStar style={{ color: '#f59e0b' }} /> Trust Member Subscription</h3>

                                <div className="dash-sub-box">
                                    <div className="dash-sub-row">
                                        <span style={{ color: '#64748b' }}>Subscription Plan:</span>
                                        <strong style={{ color: '#1e3a8a' }}>{memberData.subscriptionTier || 'Member'}</strong>
                                    </div>
                                    <div className="dash-sub-row">
                                        <span style={{ color: '#64748b' }}>Monthly Pledge Amount:</span>
                                        <strong style={{ fontSize: 18, color: '#059669' }}>₹{memberData.donationAmount} / month</strong>
                                    </div>
                                    <div className="dash-sub-row">
                                        <span style={{ color: '#64748b' }}>Next Payment Due Date:</span>
                                        <strong style={{ color: '#dc2626' }}>
                                            {new Date(memberData.nextPaymentDueDate || Date.now() + 30 * 86400000).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })} (After 1 Month)
                                        </strong>
                                    </div>
                                    <div className="dash-sub-row">
                                        <span style={{ color: '#64748b' }}>Aadhaar on Record:</span>
                                        <strong>ending in ...{String(memberData.aadharNumber || '').slice(-4)}</strong>
                                    </div>
                                    {memberData.panNumber && (
                                        <div className="dash-sub-row">
                                            <span style={{ color: '#64748b' }}>PAN on Record:</span>
                                            <strong>{memberData.panNumber} (80G Eligible)</strong>
                                        </div>
                                    )}
                                    <div className="dash-sub-row" style={{ marginBottom: 0 }}>
                                        <span style={{ color: '#64748b' }}>Live Donor Marquee:</span>
                                        <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Display Active</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <Link to={directDonateUrl} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                        <FaHeart /> Pay Monthly Pledge (₹{memberData.donationAmount})
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="dash-card" style={{ borderLeft: '4px solid #6366f1' }}>
                                <h3><FaStar style={{ color: '#6366f1' }} /> Become an Honored Trust Member</h3>
                                <p style={{ color: '#64748b', fontSize: 14 }}>
                                    Support regular programs with monthly giving starting from ₹500/month. First payment scheduled after 1 month.
                                </p>
                                <Link to="/register/trust-member" className="btn btn-primary" style={{ background: '#4f46e5' }}>
                                    Enroll as Trust Member →
                                </Link>
                            </div>
                        )}

                        {/* Volunteer Program */}
                        {volunteerData ? (
                            <div className="dash-card">
                                <h3><FaCheckCircle style={{ color: '#10b981' }} /> Volunteer Registration Details</h3>
                                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, marginBottom: 16 }}>
                                    <p style={{ margin: '0 0 6px', fontSize: 14 }}><strong>Assigned ID:</strong> {volunteerData.uniqueId}</p>
                                    <p style={{ margin: '0 0 6px', fontSize: 14 }}><strong>Membership Fee:</strong> ₹{volunteerData.membershipFee} (Confirmed)</p>
                                    <p style={{ margin: '0 0 6px', fontSize: 14 }}><strong>Contact:</strong> {volunteerData.phone}</p>
                                    <p style={{ margin: 0, fontSize: 14 }}><strong>Address:</strong> {volunteerData.address}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="dash-card" style={{ borderLeft: '4px solid #10b981' }}>
                                <h3><FaUsers style={{ color: '#10b981' }} /> Register as an Official Volunteer</h3>
                                <p style={{ color: '#64748b', fontSize: 14 }}>
                                    Get official certification, field leadership training, and your Official Digital ID Card. Membership fee: ₹2,500.
                                </p>
                                <Link to="/volunteers" className="btn btn-primary" style={{ background: '#10b981' }}>
                                    Register as Volunteer (₹2,500) →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Digital ID Card Preview */}
                    <div>
                        <div className="dash-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ margin: 0 }}><FaIdCard /> Official Digital ID</h3>
                                <button
                                    onClick={handlePrintId}
                                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                >
                                    <FaPrint /> Print
                                </button>
                            </div>

                            <div className="digital-id-card">
                                <div className="digital-id-header">
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Kiran Charitable Trust
                                        </div>
                                        <div style={{ fontSize: 10.5, opacity: 0.8 }}>Guntur & Palnadu • Regd: 2026/GNT</div>
                                    </div>
                                    <span style={{ background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                                        {volunteerData ? 'VOLUNTEER' : memberData ? 'TRUST MEMBER' : 'MEMBER'}
                                    </span>
                                </div>

                                <div className="digital-id-body">
                                    {user.avatar || volunteerData?.profilePhoto || memberData?.profilePhoto ? (
                                        <img
                                            src={user.avatar || volunteerData?.profilePhoto || memberData?.profilePhoto}
                                            alt={user.name}
                                            className="digital-id-photo"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="digital-id-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white' }}>
                                            {user.name ? user.name[0] : 'K'}
                                        </div>
                                    )}

                                    <div className="digital-id-details">
                                        <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{user.name}</div>
                                        <p><strong>Mobile:</strong> {user.phone || volunteerData?.phone || memberData?.phone || 'On Record'}</p>
                                        <div className="digital-id-number">
                                            {volunteerData?.uniqueId || memberData?.memberId || 'KCT-MEM-1001'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Link if role is admin */}
                        {(user.role === 'admin' || user.email?.toLowerCase().includes('trustkirancharitable@gmail.com')) && (
                            <div className="dash-card" style={{ background: '#0f172a', color: 'white' }}>
                                <h3 style={{ color: 'white' }}>⚡ Admin Management</h3>
                                <p style={{ fontSize: 13, color: '#94a3b8' }}>
                                    Access website performance velocity dashboard, payment records, member approvals, and monthly email reminders.
                                </p>
                                <Link to="/admin" className="btn" style={{ background: '#2563eb', color: 'white', width: '100%', justifyContent: 'center' }}>
                                    Open Admin Panel →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
