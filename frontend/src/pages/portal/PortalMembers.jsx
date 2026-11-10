import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import {
    FaUsers,
    FaUser,
    FaSearch,
    FaMapMarkerAlt,
    FaAward,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaHeart,
    FaCrown,
    FaStar,
    FaIdCard,
    FaCheckCircle,
    FaReceipt,
    FaSignInAlt,
    FaShareAlt,
    FaWhatsapp,
    FaCopy
} from 'react-icons/fa';
import '../TrustMembers.css';

export default function PortalMembers() {
    const { user, isAuthenticated } = useAuth();
    const [boardOfTrustees, setBoardOfTrustees] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedInvite, setCopiedInvite] = useState(false);

    // Search, Filter, Sort & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [sortOption, setSortOption] = useState('az'); // 'az' | 'za' | 'newest' | 'role'
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 16; // 4x4 clean grid of 16 members per page

    const userName = user?.name || user?.fullName || 'Trust Member';
    const userMemberId = user?.memberId || user?.trustMemberId || user?.trustMember?.memberId || '';
    const userInitial = (userName.charAt(0) || 'M').toUpperCase();
    const avatarUrl = user?.avatar || user?.profilePhoto || user?.trustMember?.profilePhoto || null;
    const userTier = (user?.subscriptionTier || user?.trustMember?.subscriptionTier || 'Member Tier').replace(/Patron/gi, 'Member');

    const handleShareInvite = () => {
        const publicUrl = `${window.location.origin}/trust-members`;
        const shareText = `Join Kiran Charitable Trust as an official Trust Member! Explore the leadership and verified Member Wall here: ${publicUrl}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(publicUrl).then(() => {
                setCopiedInvite(true);
                toast.success('Public Member Wall link copied! Share it with friends & family.');
                setTimeout(() => setCopiedInvite(false), 3000);
            }).catch(() => {
                toast.info(`Public Member Link: ${publicUrl}`);
            });
        } else {
            toast.info(`Public Member Link: ${publicUrl}`);
        }

        if (navigator.share) {
            navigator.share({
                title: 'Join Kiran Charitable Trust',
                text: shareText,
                url: publicUrl
            }).catch(() => {});
        }
    };

    const handleWhatsAppShare = () => {
        const publicUrl = `${window.location.origin}/trust-members`;
        const text = encodeURIComponent(`Namaste! I invite you to join Kiran Charitable Trust as an official Trust Member. Explore our Board of Trustees and registered member directory here: ${publicUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    useEffect(() => {
        async function fetchTrustMembers() {
            try {
                const res = await axios.get(`${API_BASE_URL}/trust-members/public-list`);
                if (res.data?.success) {
                    if (res.data.boardOfTrustees) {
                        setBoardOfTrustees(res.data.boardOfTrustees);
                    }
                    if (res.data.members) {
                        setAllMembers(res.data.members);
                    }
                }
            } catch (err) {
                console.warn('Portal trust members fetch notice:', err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTrustMembers();
    }, []);

    // Filtered & Sorted Members
    const filteredMembers = useMemo(() => {
        let list = [...allMembers];

        // 1. Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(m =>
                (m.name && m.name.toLowerCase().includes(q)) ||
                (m.role && m.role.toLowerCase().includes(q)) ||
                (m.city && m.city.toLowerCase().includes(q)) ||
                (m.state && m.state.toLowerCase().includes(q))
            );
        }

        // 2. Role Filter
        if (selectedRole !== 'ALL') {
            list = list.filter(m => (m.role || '').toLowerCase() === selectedRole.toLowerCase());
        }

        // 3. Sorting
        list.sort((a, b) => {
            if (sortOption === 'az') return (a.name || '').localeCompare(b.name || '');
            if (sortOption === 'za') return (b.name || '').localeCompare(a.name || '');
            if (sortOption === 'newest') return new Date(b.joinDate || 0) - new Date(a.joinDate || 0);
            if (sortOption === 'role') return (a.role || '').localeCompare(b.role || '');
            return 0;
        });

        return list;
    }, [allMembers, searchQuery, selectedRole, sortOption]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRole, sortOption]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
    const paginatedMembers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredMembers.slice(start, start + pageSize);
    }, [filteredMembers, currentPage, pageSize]);

    // Default board of 5 trustees if API is still loading
    const displayBoard = boardOfTrustees.length > 0 ? boardOfTrustees : [
        { roleLabel: 'President', name: 'Sri P. Subba Rao', highlight: false },
        { roleLabel: 'Vice Chairperson', name: 'Konda Ravi Teja', highlight: false },
        { roleLabel: 'Chairperson', name: 'Pallepogu Kiranbabu', highlight: true },
        { roleLabel: 'Secretary', name: 'Smt. P. Lakshmi Devi', highlight: false },
        { roleLabel: 'Treasurer', name: 'Srungarapati Rakesh', highlight: false },
    ];

    return (
        <div className="tm-template-container" style={{ maxWidth: '100%', padding: '0 4px' }}>
            {/* ════════════════════════════════════════════════════════════
                HERO BANNER: MEMBER APPRECIATION & GOVERNANCE VIEW
               ════════════════════════════════════════════════════════════ */}
            <div className="tm-top-join-banner" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', border: '1.5px solid #2563EB' }}>
                <div className="tm-top-join-left">
                    <span className="tm-top-join-tag" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                        <FaCrown style={{ color: '#FBBF24' }} /> {isAuthenticated ? 'Honored Trust Member' : 'Official Trust Membership'}
                    </span>
                    <h1 className="tm-top-join-title">
                        {isAuthenticated ? `Welcome to the Member Directory, ${userName.split(' ')[0]}!` : 'Kiran Charitable Trust Directory & Governance'}
                    </h1>
                    <p className="tm-top-join-desc">
                        {isAuthenticated ? (
                            <>
                                Thank you for your leadership and sustained dedication! Your membership ({userTier}) directly drives our community healthcare camps, daily food relief, and child education initiatives across Palnadu and Amaravathi.
                            </>
                        ) : (
                            <>
                                Explore our esteemed Board of Trustees and registered members. Join us as an official Trust Member to receive your verified digital ID card, participate in social welfare drives, and be permanently recognized on our member directory.
                            </>
                        )}
                    </p>
                </div>
                <div className="tm-top-join-right" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                        type="button"
                        onClick={handleShareInvite}
                        className="tm-banner-join-btn"
                        style={{ background: '#2563EB', borderColor: '#3B82F6', cursor: 'pointer', justifyContent: 'center' }}
                    >
                        <FaShareAlt /> {copiedInvite ? 'Link Copied! ✓' : 'Join Others'}
                    </button>
                    <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="tm-banner-join-btn"
                        style={{ background: '#25D366', borderColor: '#22c55e', cursor: 'pointer', justifyContent: 'center' }}
                    >
                        <FaWhatsapp /> Share on WhatsApp
                    </button>
                    {isAuthenticated && (
                        <Link to="/portal/profile?tab=dashboard" className="tm-banner-join-btn" style={{ background: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center' }}>
                            <FaIdCard /> View Your Member ID →
                        </Link>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                MEMBER APPRECIATION CALLOUT: "YOU ARE RECOGNIZED HERE"
               ════════════════════════════════════════════════════════════ */}
            {isAuthenticated && user && (
                <div style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
                    border: '2px solid #3B82F6',
                    borderRadius: 14,
                    padding: '16px 22px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            fontWeight: 800,
                            overflow: 'hidden',
                            border: '2.5px solid #FBBF24',
                            flexShrink: 0
                        }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{userName}</span>
                                <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: 20, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <FaCheckCircle style={{ fontSize: 10 }} /> Verified Trust Member
                                </span>
                            </div>
                            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>
                                Membership ID: <strong style={{ color: '#2563EB', letterSpacing: 0.5 }}>{userMemberId || 'KCT-MEM-1015'}</strong> • Standing: <strong style={{ color: '#D97706' }}>{userTier}</strong> • Recognized on Official Member Wall
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link to="/portal/profile?tab=dashboard" style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            padding: '8px 14px',
                            borderRadius: 8,
                            background: '#FFFFFF',
                            border: '1.5px solid #CBD5E1',
                            color: '#1E293B',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                        }}>
                            <FaIdCard style={{ color: '#2563EB' }} /> View Digital ID
                        </Link>
                        <Link to="/portal/profile?tab=profile" style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            padding: '8px 14px',
                            borderRadius: 8,
                            background: '#2563EB',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            <FaUser /> Manage Profile
                        </Link>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TOP SECTION: BOARD OF TRUSTEES
               ════════════════════════════════════════════════════════════ */}
            <div className="tm-board-enclosure">
                {/* Center Title Pill with Gold Flanking Lines */}
                <div className="tm-board-title-row">
                    <div className="tm-gold-divider"></div>
                    <div className="tm-board-pill">
                        Board of Trustees
                    </div>
                    <div className="tm-gold-divider"></div>
                </div>

                {/* 5 Leadership Cards Grid */}
                <div className="tm-board-grid">
                    {displayBoard.map((trustee, idx) => {
                        const isChairperson = trustee.highlight || trustee.roleLabel === 'Chairperson';

                        return (
                            <div
                                key={idx}
                                className={`tm-trustee-card ${isChairperson ? 'tm-card-chairperson' : ''}`}
                            >
                                {/* Circular Avatar with Laurel Wreath */}
                                <div className={`tm-wreath-wrap ${isChairperson ? 'tm-wreath-chair' : ''}`}>
                                    <div className="tm-laurel-branch left">
                                        <FaAward className="tm-laurel-icon" />
                                    </div>
                                    <div className="tm-trustee-avatar">
                                        <FaUser />
                                    </div>
                                    <div className="tm-laurel-branch right">
                                        <FaAward className="tm-laurel-icon" />
                                    </div>
                                </div>

                                {/* Ribbon Title Badge */}
                                <div className={`tm-ribbon-badge ${isChairperson ? 'tm-ribbon-gold' : 'tm-ribbon-navy'}`}>
                                    <span className="tm-ribbon-point left"></span>
                                    <span className="tm-ribbon-text">{trustee.roleLabel}</span>
                                    <span className="tm-ribbon-point right"></span>
                                </div>

                                {/* Member Name */}
                                <div className={`tm-trustee-name ${isChairperson ? 'tm-name-chair' : ''}`}>
                                    {trustee.name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                BOTTOM SECTION: ALL TRUST MEMBERS
               ════════════════════════════════════════════════════════════ */}
            <div className="tm-all-members-section">
                {/* Header & Controls Row */}
                <div className="tm-members-header-row">
                    <div className="tm-members-title-group">
                        <FaUsers className="tm-users-header-icon" />
                        <h2>All Trust Members</h2>
                    </div>

                    <div className="tm-controls-group">
                        {/* Search Input */}
                        <div className="tm-search-box">
                            <FaSearch className="tm-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by member name or role"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="tm-search-input"
                            />
                            {searchQuery && (
                                <button className="tm-clear-search-btn" onClick={() => setSearchQuery('')}>
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Role Filter Dropdown */}
                        <div className="tm-dropdown-wrapper">
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="tm-select-dropdown"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="Trustee">Trustee</option>
                                <option value="Member">Member</option>
                                <option value="Advisor">Advisor</option>
                                <option value="Executive Member">Executive Member</option>
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="tm-dropdown-wrapper">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="tm-select-dropdown"
                            >
                                <option value="az">Sort: A to Z</option>
                                <option value="za">Sort: Z to A</option>
                                <option value="newest">Newest First</option>
                                <option value="role">Sort by Role</option>
                            </select>
                        </div>

                        {/* Action Button: Join Others */}
                        <button
                            type="button"
                            onClick={handleShareInvite}
                            className="tm-quick-join-btn"
                            style={{ background: '#059669', border: '1.5px solid #059669', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            title="Share trust member registration link to join others"
                        >
                            <FaShareAlt /> {copiedInvite ? 'Link Copied! ✓' : 'Join Others'}
                        </button>
                    </div>
                </div>

                {/* 4-Columns Grid of Member Cards */}
                <div className="tm-members-grid-4col">
                    {isLoading ? (
                        <div className="tm-loading-state">
                            Loading verified trust members...
                        </div>
                    ) : paginatedMembers.length === 0 ? (
                        <div className="tm-loading-state">
                            No trust members found matching your search.
                        </div>
                    ) : (
                        paginatedMembers.map((member, idx) => {
                            const photo = member.profilePhoto || member.profile_photo || member.avatar;
                            const initials = (member.name || 'Member').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                            const isCurrentUser = Boolean(
                                isAuthenticated && user && (
                                    (member.email && user.email && member.email.toLowerCase() === user.email.toLowerCase()) ||
                                    (member.memberId && userMemberId && member.memberId === userMemberId) ||
                                    (member.name && user.name && member.name.toLowerCase().trim() === user.name.toLowerCase().trim())
                                )
                            );

                            return (
                                <div
                                    key={member.memberId || idx}
                                    className="tm-member-card"
                                    style={isCurrentUser ? {
                                        border: '2px solid #2563EB',
                                        background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
                                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.16)',
                                        position: 'relative'
                                    } : {}}
                                >
                                    {isCurrentUser && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -9,
                                            right: 12,
                                            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                            color: '#FFFFFF',
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
                                            letterSpacing: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            zIndex: 2
                                        }}>
                                            <FaStar style={{ color: '#FBBF24', fontSize: 10 }} /> You (Active Member)
                                        </div>
                                    )}

                                    {/* Left: Circular Avatar with Gold Ring Border */}
                                    <div className="tm-member-avatar-gold-ring" style={{ overflow: 'hidden', border: isCurrentUser ? '2px solid #2563EB' : '2px solid #d97706' }}>
                                        {photo ? (
                                            <img
                                                src={photo}
                                                alt={member.name || 'Member'}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e3a8a' }}>
                                                {initials || <FaUser />}
                                            </span>
                                        )}
                                    </div>

                                    {/* Right: Info */}
                                    <div className="tm-member-info">
                                        <div className="tm-member-name" title={member.name} style={isCurrentUser ? { color: '#1D4ED8', fontWeight: 800 } : {}}>
                                            {member.name}
                                        </div>
                                        <div className="tm-member-role">
                                            <FaUser className="tm-role-icon" />
                                            <span>{member.role || 'Member'}</span>
                                        </div>
                                        <div className="tm-member-divider"></div>
                                        <div className="tm-member-location">
                                            <FaMapMarkerAlt className="tm-pin-icon" />
                                            <span>{member.city || 'Guntur'}, {member.state || 'AP'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="tm-pagination-bar">
                        <div className="tm-pag-info">
                            Showing <strong>{(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, filteredMembers.length)}</strong> of <strong>{filteredMembers.length}</strong> members
                        </div>

                        <div className="tm-pag-buttons">
                            <button
                                className="tm-pag-btn"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <FaChevronLeft /> Previous
                            </button>

                            <span className="tm-pag-current">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                className="tm-pag-btn"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}

                {/* Bottom Appreciation Card for Members */}
                <div className="tm-bottom-join-card" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 100%)', border: '1.5px solid #3B82F6' }}>
                    <div className="tm-bottom-join-text">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FBBF24', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                            <FaAward /> Pillar of Community Upliftment
                        </div>
                        <h3 style={{ color: '#FFFFFF' }}>Thank You for Being a Respected Trust Member!</h3>
                        <p style={{ color: '#CBD5E1' }}>
                            Your dedication, counsel, and sustained membership support make every grain of food, medical camp, and school kit possible. Invite your peers and family to join our noble cause as verified Trust Members.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={handleShareInvite}
                            className="tm-bottom-join-btn"
                            style={{ background: '#2563EB', border: '1.5px solid #60A5FA', color: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <FaShareAlt /> {copiedInvite ? 'Link Copied! ✓' : 'Join Others'}
                        </button>
                        <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="tm-bottom-join-btn"
                            style={{ background: '#25D366', border: '1.5px solid #22c55e', color: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <FaWhatsapp /> Share on WhatsApp
                        </button>
                        <Link to="/portal/profile?tab=payments&action=contribute#contribute" className="tm-bottom-join-btn" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                            <FaHeart /> Contribute to Welfare
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
