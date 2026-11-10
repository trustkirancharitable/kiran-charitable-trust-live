import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    FaUsers,
    FaUser,
    FaSearch,
    FaMapMarkerAlt,
    FaAward,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaUserPlus
} from 'react-icons/fa';
import './TrustMembers.css';

export default function TrustMembers() {
    const [boardOfTrustees, setBoardOfTrustees] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Search, Filter, Sort & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [sortOption, setSortOption] = useState('az'); // 'az' | 'za' | 'newest' | 'role'
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 16; // 4x4 clean grid of 16 members per page

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
                console.warn('Trust members fetch notice:', err.message);
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
        <div className="tm-template-container">
            {/* ════════════════════════════════════════════════════════════
                HERO BANNER: BECOME A MEMBER / JOIN CALL TO ACTION
               ════════════════════════════════════════════════════════════ */}
            <div className="tm-top-join-banner">
                <div className="tm-top-join-left">
                    <span className="tm-top-join-tag">
                        <FaAward style={{ color: '#d97706' }} /> Official Trust Membership
                    </span>
                    <h1 className="tm-top-join-title">Kiran Charitable Trust Directory &amp; Governance</h1>
                    <p className="tm-top-join-desc">
                        Explore our esteemed Board of Trustees and registered members. Join us as an official Trust Member to receive your verified digital ID card, participate in social welfare drives, and be permanently recognized on our member directory.
                    </p>
                </div>
                <div className="tm-top-join-right">
                    <Link to="/portal/join" className="tm-banner-join-btn">
                        <FaUserPlus /> Join as a Member →
                    </Link>
                </div>
            </div>

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

                        {/* Quick Join Button */}
                        <Link to="/portal/join" className="tm-quick-join-btn">
                            <FaUserPlus /> Join as Member
                        </Link>
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

                        return (
                            <div key={member.memberId || idx} className="tm-member-card">
                                {/* Left: Circular Avatar with Gold Ring Border */}
                                <div className="tm-member-avatar-gold-ring" style={{ overflow: 'hidden' }}>
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
                                    <div className="tm-member-name" title={member.name}>
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

                {/* Bottom Call to Action Card */}
                <div className="tm-bottom-join-card">
                    <div className="tm-bottom-join-text">
                        <h3>Ready to Join Kiran Charitable Trust?</h3>
                        <p>Complete a quick 4-step registration: verify your email, submit member details, complete your membership contribution, and instantly receive your verified Trust Member ID Card.</p>
                    </div>
                    <Link to="/portal/join" className="tm-bottom-join-btn">
                        <FaUserPlus /> Join as Trust Member Now →
                    </Link>
                </div>
            </div>
        </div>
    );
}
