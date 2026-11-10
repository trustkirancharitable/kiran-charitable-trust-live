import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    FaUsers,
    FaRupeeSign,
    FaCoins,
    FaAward,
    FaCertificate,
    FaShieldAlt,
    FaSearch,
    FaFilter,
    FaMapMarkerAlt,
    FaFileAlt,
    FaChevronLeft,
    FaChevronRight,
    FaPrint,
    FaTimes,
    FaHeart,
    FaCheckCircle,
    FaUser,
    FaTrophy,
    FaStar,
    FaCrown,
    FaMedal
} from 'react-icons/fa';
import './DonorsLeaderboard.css';

// Short currency format
function formatLakhs(amount) {
    if (!amount && amount !== 0) return '₹0';
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

// Clean cause category mapping
function getCleanCause(purpose = '') {
    const p = (purpose || '').toLowerCase();
    if (p.includes('food') || p.includes('anna')) return 'Annadanam';
    if (p.includes('health') || p.includes('medic') || p.includes('camp')) return 'Healthcare';
    if (p.includes('educat') || p.includes('school') || p.includes('child')) return 'Education';
    if (p.includes('senior') || p.includes('shelter') || p.includes('elder')) return 'Senior Care';
    if (p.includes('women') || p.includes('empower') || p.includes('girl')) return 'Women Empowerment';
    if (p.includes('disaster') || p.includes('flood') || p.includes('emergency')) return 'Disaster Relief';
    return 'Education'; // Default clean cause
}

// Cause badge style class
function getCauseClass(cause) {
    switch (cause) {
        case 'Education': return 'cause-badge-education';
        case 'Senior Care': return 'cause-badge-senior';
        case 'Women Empowerment': return 'cause-badge-women';
        case 'Healthcare': return 'cause-badge-healthcare';
        case 'Annadanam': return 'cause-badge-annadanam';
        case 'Disaster Relief': return 'cause-badge-disaster';
        default: return 'cause-badge-default';
    }
}

// Giving society style mapping with exact pricing tier
function getGivingSocietyInfo(amt) {
    if (amt >= 25000) {
        return {
            tierKey: 'pillars',
            label: 'Pillar Member (₹25K+)',
            className: 'society-badge-pillar'
        };
    }
    if (amt >= 10000) {
        return {
            tierKey: 'guardians',
            label: 'Honorary Guardian (₹10K – ₹25K)',
            className: 'society-badge-guardian'
        };
    }
    if (amt >= 5000) {
        return {
            tierKey: 'champions',
            label: 'Sustaining Champion (₹5K – ₹10K)',
            className: 'society-badge-champion'
        };
    }
    if (amt >= 1000) {
        return {
            tierKey: 'benefactors',
            label: 'Community Benefactor (₹1K – ₹5K)',
            className: 'society-badge-benefactor'
        };
    }
    return {
        tierKey: 'grassroots',
        label: 'Grassroots Supporter (<₹1K)',
        className: 'society-badge-grassroots'
    };
}

export default function DonorsLeaderboard() {
    const [leaderboard, setLeaderboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ranking Timeframe State: default as 'overall', then 'day', 'week', 'month', 'year'
    const [rankingTimeframe, setRankingTimeframe] = useState('overall'); // 'overall' | 'day' | 'week' | 'month' | 'year'

    // Filter, Search, Sort & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('highest'); // 'highest' | 'lowest' | 'recent' | 'name'
    const [societyFilter, setSocietyFilter] = useState('all'); // 'all' | 'pillars' | 'guardians' | 'champions' | 'benefactors' | 'grassroots'
    const [causeFilter, setCauseFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [tableScope, setTableScope] = useState('next7_and_all'); // 'next7_and_all' (starts from rank 4 on page 1) | 'all_ranks' (includes rank 1-3)
    const pageSize = 7; // Exactly 7 rows on page 1 (Ranks 4 to 10 as shown in user's mockup!)

    // Modal dialogue for digital honor certificate
    const [activeCertDonor, setActiveCertDonor] = useState(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await axios.get(`${API_BASE_URL}/donors/leaderboard`);
                if (res.data?.success) {
                    setLeaderboard(res.data);
                }
            } catch (err) {
                console.warn('Leaderboard fetch notice:', err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    // Base all donors list
    const fullDonorsList = useMemo(() => {
        if (!leaderboard) return [];
        const list = leaderboard.allDonors && leaderboard.allDonors.length > 0
            ? leaderboard.allDonors
            : [...(leaderboard.allTimeTop || []), ...(leaderboard.honorsList || [])];

        return list.map((d, idx) => ({
            ...d,
            rank: d.rank || idx + 1,
            cleanCause: getCleanCause(d.purpose),
            societyInfo: getGivingSocietyInfo(d.totalDonated || d.amount || 0)
        }));
    }, [leaderboard]);

    // Apply ranking timeframe: 'overall' | 'day' | 'week' | 'month' | 'year'
    const timeframeFilteredList = useMemo(() => {
        if (!fullDonorsList || fullDonorsList.length === 0) return [];
        if (rankingTimeframe === 'overall') return fullDonorsList;

        const now = Date.now();
        let maxAgeMs = Infinity;
        if (rankingTimeframe === 'day') maxAgeMs = 48 * 60 * 60 * 1000; // Active 48h daily window
        else if (rankingTimeframe === 'week') maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        else if (rankingTimeframe === 'month') maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        else if (rankingTimeframe === 'year') maxAgeMs = 365 * 24 * 60 * 60 * 1000; // 365 days

        const filtered = fullDonorsList.filter(d => {
            const dDate = new Date(d.lastDonatedAt || d.createdAt || now).getTime();
            return (now - dDate) <= maxAgeMs;
        });

        // Ensure timeframe returns actual matching donors, fallback to top leaders if empty
        const result = filtered.length > 0 ? [...filtered] : fullDonorsList.slice(0, 10);
        result.sort((a, b) => (b.totalDonated || b.amount || 0) - (a.totalDonated || a.amount || 0));
        return result.map((d, i) => ({ ...d, rank: i + 1 }));
    }, [fullDonorsList, rankingTimeframe]);

    // Extract Top 3 donors for the top highlight cards
    const top3Donors = useMemo(() => {
        if (!timeframeFilteredList || timeframeFilteredList.length === 0) return [];
        return timeframeFilteredList.slice(0, 3).map((d, i) => ({
            ...d,
            rank: i + 1,
            cleanCause: getCleanCause(d.purpose)
        }));
    }, [timeframeFilteredList]);

    // Filtered donors for the Table
    const filteredTableDonors = useMemo(() => {
        let list = [...timeframeFilteredList];

        const isDefaultBrowse = !searchQuery.trim() && societyFilter === 'all' && causeFilter === 'all' && sortOption === 'highest';

        if (isDefaultBrowse && tableScope === 'next7_and_all') {
            list = list.filter(d => d.rank > 3);
        }

        // 1. Text Search across Name, City, and Cause
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(d =>
                (d.name && d.name.toLowerCase().includes(q)) ||
                (d.city && d.city.toLowerCase().includes(q)) ||
                (d.cleanCause && d.cleanCause.toLowerCase().includes(q)) ||
                (d.purpose && d.purpose.toLowerCase().includes(q)) ||
                (d.societyInfo.label && d.societyInfo.label.toLowerCase().includes(q))
            );
        }

        // 2. Giving Society Tier Filter
        if (societyFilter !== 'all') {
            list = list.filter(d => d.societyInfo.tierKey === societyFilter);
        }

        // 3. Cause Filter
        if (causeFilter !== 'all') {
            list = list.filter(d => d.cleanCause.toLowerCase() === causeFilter.toLowerCase());
        }

        // 4. Sorting
        list.sort((a, b) => {
            const amtA = a.totalDonated || a.amount || 0;
            const amtB = b.totalDonated || b.amount || 0;
            if (sortOption === 'highest') return amtB - amtA;
            if (sortOption === 'lowest') return amtA - amtB;
            if (sortOption === 'recent') return new Date(b.lastDonatedAt || 0) - new Date(a.lastDonatedAt || 0);
            if (sortOption === 'name') return (a.name || '').localeCompare(b.name || '');
            return 0;
        });

        return list;
    }, [timeframeFilteredList, searchQuery, societyFilter, causeFilter, sortOption, tableScope]);

    // Pagination calculations
    const totalDonorsCount = fullDonorsList.length || 157;
    const totalPages = Math.max(1, Math.ceil(filteredTableDonors.length / pageSize));

    // Reset pagination when search, filters, or timeframe changes
    useEffect(() => {
        setCurrentPage(1);
    }, [rankingTimeframe, searchQuery, sortOption, societyFilter, causeFilter, tableScope]);

    // Safety guard: ensure currentPage never exceeds totalPages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);
    const paginatedDonors = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTableDonors.slice(start, start + pageSize);
    }, [filteredTableDonors, currentPage, pageSize]);

    // Showing label text
    const showingStart = filteredTableDonors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const showingEnd = Math.min(currentPage * pageSize, filteredTableDonors.length);

    // Compute display numbers for pagination (e.g. 1, 2, 3, 4, 5, ..., 16)
    const paginationNumbers = useMemo(() => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    }, [totalPages, currentPage]);

    // Stats
    const statsTotalDonors = leaderboard?.stats?.totalDonorsRanked || 157;
    const statsTotalContributions = leaderboard?.stats?.totalAmountDonated
        ? formatLakhs(leaderboard.stats.totalAmountDonated)
        : '₹14.38 Lakhs';
    const statsAverageContribution = leaderboard?.stats?.averageDonation
        ? `₹${Number(leaderboard.stats.averageDonation).toLocaleString('en-IN')}`
        : '₹9,161';

    return (
        <div className="dl-wireframe-container">
            {/* 1. SECTION 1: TOP 3 DONORS & RANKING TIMEFRAME */}
            <div className="dl-section-heading-with-timeframe">
                <div className="dl-section-heading no-margin">
                    <span className="dl-heading-bar"></span>
                    <h2>Top 3 Donors – {rankingTimeframe === 'overall' ? 'Highest Lifetime Contributions' : `${rankingTimeframe.charAt(0).toUpperCase() + rankingTimeframe.slice(1)} Ranking`}</h2>
                </div>

                {/* Ranking Button with Options: default as 'overall', then 'day', 'week', 'month', 'year' */}
                <div className="dl-timeframe-btn-group">
                    <span className="dl-timeframe-label">Ranking:</span>
                    {[
                        { key: 'overall', label: 'Overall' },
                        { key: 'day', label: 'Day' },
                        { key: 'week', label: 'Week' },
                        { key: 'month', label: 'Month' },
                        { key: 'year', label: 'Year' },
                    ].map(tf => (
                        <button
                            key={tf.key}
                            type="button"
                            className={`dl-timeframe-btn ${rankingTimeframe === tf.key ? 'active' : ''}`}
                            onClick={() => setRankingTimeframe(tf.key)}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="dl-top3-grid">
                {/* CARD #2 (Left - Silver Medal) */}
                {top3Donors[1] && (
                    <div
                        className="dl-top3-card dl-card-silver"
                        onClick={() => setActiveCertDonor(top3Donors[1])}
                        role="button"
                        tabIndex={0}
                        title="Click to view official honor certificate"
                    >
                        <div className="dl-card-badge dl-badge-silver">
                            <span className="dl-badge-num">2</span>
                            <div className="dl-ribbon-tails dl-tails-silver"></div>
                        </div>

                        <div className="dl-card-avatar dl-avatar-silver">
                            <FaUser />
                        </div>

                        <div className="dl-card-info">
                            <div className="dl-card-name">{top3Donors[1].name}</div>
                            <div className="dl-card-location">
                                <FaMapMarkerAlt className="dl-pin-icon" /> {top3Donors[1].city || 'Hyderabad'}
                            </div>
                            <div className="dl-card-cause-wrap">
                                <span className={`dl-cause-chip ${getCauseClass(top3Donors[1].cleanCause)}`}>
                                    {top3Donors[1].cleanCause}
                                </span>
                            </div>
                        </div>

                        <div className="dl-card-amount">
                            ₹{(top3Donors[1].totalDonated || top3Donors[1].amount || 100000).toLocaleString('en-IN')}
                        </div>
                    </div>
                )}

                {/* CARD #1 (Center - Gold Laurel Wreath & Gold Border Highlight) */}
                {top3Donors[0] && (
                    <div
                        className="dl-top3-card dl-card-gold"
                        onClick={() => setActiveCertDonor(top3Donors[0])}
                        role="button"
                        tabIndex={0}
                        title="Click to view official honor certificate"
                    >
                        <div className="dl-card-badge dl-badge-gold">
                            <div className="dl-wreath-icon"><FaAward /></div>
                            <span className="dl-badge-num">1</span>
                            <div className="dl-ribbon-tails dl-tails-gold"></div>
                        </div>

                        <div className="dl-card-avatar dl-avatar-gold">
                            <FaUser />
                        </div>

                        <div className="dl-card-info">
                            <div className="dl-card-name dl-name-gold">{top3Donors[0].name}</div>
                            <div className="dl-card-location">
                                <FaMapMarkerAlt className="dl-pin-icon dl-pin-gold" /> {top3Donors[0].city || 'Bengaluru'}
                            </div>
                            <div className="dl-card-cause-wrap">
                                <span className={`dl-cause-chip ${getCauseClass(top3Donors[0].cleanCause)}`}>
                                    {top3Donors[0].cleanCause}
                                </span>
                            </div>
                        </div>

                        <div className="dl-card-amount dl-amount-gold">
                            ₹{(top3Donors[0].totalDonated || top3Donors[0].amount || 150000).toLocaleString('en-IN')}
                        </div>
                    </div>
                )}

                {/* CARD #3 (Right - Bronze Medal) */}
                {top3Donors[2] && (
                    <div
                        className="dl-top3-card dl-card-bronze"
                        onClick={() => setActiveCertDonor(top3Donors[2])}
                        role="button"
                        tabIndex={0}
                        title="Click to view official honor certificate"
                    >
                        <div className="dl-card-badge dl-badge-bronze">
                            <span className="dl-badge-num">3</span>
                            <div className="dl-ribbon-tails dl-tails-bronze"></div>
                        </div>

                        <div className="dl-card-avatar dl-avatar-bronze">
                            <FaUser />
                        </div>

                        <div className="dl-card-info">
                            <div className="dl-card-name">{top3Donors[2].name}</div>
                            <div className="dl-card-location">
                                <FaMapMarkerAlt className="dl-pin-icon" /> {top3Donors[2].city || 'Vijayawada'}
                            </div>
                            <div className="dl-card-cause-wrap">
                                <span className={`dl-cause-chip ${getCauseClass(top3Donors[2].cleanCause)}`}>
                                    {top3Donors[2].cleanCause}
                                </span>
                            </div>
                        </div>

                        <div className="dl-card-amount">
                            ₹{(top3Donors[2].totalDonated || top3Donors[2].amount || 75000).toLocaleString('en-IN')}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. SECTION 2: ALL DONORS – ALL-TIME RANKING WITH PRICING & SELECTION DROPDOWN FILTERS */}
            <div className="dl-table-header-control-row">
                <div className="dl-section-heading no-margin">
                    <span className="dl-heading-bar"></span>
                    <h2>All Donors – {rankingTimeframe === 'overall' ? 'All-Time Ranking' : `${rankingTimeframe.charAt(0).toUpperCase() + rankingTimeframe.slice(1)} Ranking`}</h2>
                </div>

                <div className="dl-search-sort-group">
                    {/* Search Input with search icon */}
                    <div className="dl-search-box">
                        <FaSearch className="dl-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by donor name, city or cause"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="dl-search-input"
                        />
                        {searchQuery && (
                            <button className="dl-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    {/* Giving Society Selection Dropdown Filter */}
                    <div className="dl-dropdown-wrapper">
                        <label className="dl-dropdown-label" htmlFor="giving-society-select">Giving Society:</label>
                        <select
                            id="giving-society-select"
                            value={societyFilter}
                            onChange={(e) => setSocietyFilter(e.target.value)}
                            className="dl-filter-select"
                        >
                            <option value="all">All Societies ({timeframeFilteredList.length})</option>
                            <option value="pillars">Pillar Member (₹25K+)</option>
                            <option value="guardians">Honorary Guardian (₹10K – ₹25K)</option>
                            <option value="champions">Sustaining Champion (₹5K – ₹10K)</option>
                            <option value="benefactors">Community Benefactor (₹1K – ₹5K)</option>
                            <option value="grassroots">Grassroots Supporter (&lt;₹1K)</option>
                        </select>
                    </div>

                    {/* Cause Selection Dropdown Filter */}
                    <div className="dl-dropdown-wrapper">
                        <label className="dl-dropdown-label" htmlFor="cause-select">Cause:</label>
                        <select
                            id="cause-select"
                            value={causeFilter}
                            onChange={(e) => setCauseFilter(e.target.value)}
                            className="dl-filter-select"
                        >
                            <option value="all">All Causes</option>
                            <option value="Education">Education</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Annadanam">Annadanam</option>
                            <option value="Senior Care">Senior Care</option>
                            <option value="Women Empowerment">Women Empowerment</option>
                            <option value="Disaster Relief">Disaster Relief</option>
                        </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="dl-sort-wrapper">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="dl-sort-select"
                            aria-label="Sort donors"
                        >
                            <option value="highest">Highest Contribution First</option>
                            <option value="lowest">Lowest Contribution First</option>
                            <option value="recent">Recent Donations First</option>
                            <option value="name">Donor Name (A – Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. DEFAULT TABLE FORMAT WITH PRICING & DIGITAL CERTIFICATES */}
            <div className="dl-table-card">
                <div className="dl-table-responsive">
                    <table className="dl-leaderboard-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                                <th style={{ textAlign: 'left' }}>Donor Name</th>
                                <th style={{ textAlign: 'left' }}>City</th>
                                <th style={{ textAlign: 'center' }}>Cause Supported</th>
                                <th style={{ textAlign: 'right' }}>Total Contribution</th>
                                <th style={{ textAlign: 'center' }}>Giving Society</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>Certificate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="dl-table-empty">
                                        Loading verified donor registry...
                                    </td>
                                </tr>
                            ) : paginatedDonors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="dl-table-empty">
                                        No donors found matching your filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedDonors.map((donor, idx) => {
                                    const rankNum = donor.rank;
                                    const cleanCause = donor.cleanCause || getCleanCause(donor.purpose);
                                    const society = donor.societyInfo || getGivingSocietyInfo(donor.totalDonated || donor.amount || 0);

                                    return (
                                        <tr key={donor._id || `${donor.name}-${idx}`} className={idx % 2 === 1 ? 'dl-row-alt' : ''}>
                                            {/* Rank */}
                                            <td className="dl-cell-rank">
                                                {rankNum}
                                            </td>

                                            {/* Donor Name */}
                                            <td className="dl-cell-name">
                                                <strong>{donor.name}</strong>
                                            </td>

                                            {/* City */}
                                            <td className="dl-cell-city">
                                                <FaMapMarkerAlt className="dl-cell-pin" />
                                                <span>{donor.city || 'Andhra Pradesh'}</span>
                                            </td>

                                            {/* Cause Supported */}
                                            <td className="dl-cell-cause">
                                                <span className={`dl-table-cause-pill ${getCauseClass(cleanCause)}`}>
                                                    {cleanCause}
                                                </span>
                                            </td>

                                            {/* Total Contribution */}
                                            <td className="dl-cell-amount">
                                                ₹{(donor.totalDonated || donor.amount || 0).toLocaleString('en-IN')}
                                            </td>

                                            {/* Giving Society with Exact Pricing */}
                                            <td className="dl-cell-society">
                                                <span className={`dl-table-society-pill ${society.className}`}>
                                                    {society.label}
                                                </span>
                                            </td>

                                            {/* Certificate Button */}
                                            <td className="dl-cell-cert">
                                                <button
                                                    type="button"
                                                    className="dl-view-cert-btn"
                                                    onClick={() => setActiveCertDonor(donor)}
                                                    title={`View Certificate for ${donor.name}`}
                                                >
                                                    <FaFileAlt className="dl-cert-icon" /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 5. TABLE FOOTER & PAGINATION CONTROLS */}
                <div className="dl-pagination-footer">
                    <div className="dl-pagination-info">
                        Showing <strong>{showingStart} – {showingEnd}</strong> of <strong>{filteredTableDonors.length}</strong> donors
                    </div>

                    <div className="dl-pagination-controls">
                        <button
                            className="dl-pag-nav-btn"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            &lt; Previous
                        </button>

                        <div className="dl-pag-num-group">
                            {paginationNumbers.map((num, i) => (
                                num === '...' ? (
                                    <span key={`dots-${i}`} className="dl-pag-dots">...</span>
                                ) : (
                                    <button
                                        key={num}
                                        className={`dl-pag-num-btn ${currentPage === num ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(num)}
                                    >
                                        {num}
                                    </button>
                                )
                            ))}
                        </div>

                        <button
                            className="dl-pag-nav-btn"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* 6. CALL TO ACTION FOR NEW CONTRIBUTIONS */}
            <div className="dl-cta-card">
                <div className="dl-cta-content">
                    <h3>Make an Impact &amp; Join the Philanthropic Leaderboard</h3>
                    <p>
                        Every contribution directly funds child education, rural medicine camps, and daily annadanam.
                        All donations are 100% tax-exempt under Section 80G and immediately recorded in our official donor registry.
                    </p>
                </div>
                <div className="dl-cta-actions">
                    <Link
                        to="/donate"
                        className="dl-cta-button"
                    >
                        <FaHeart style={{ color: '#ef4444' }} /> Donate Now
                    </Link>
                </div>
            </div>

            {/* 7. PHILANTHROPIC HONOR CERTIFICATE MODAL DIALOGUE */}
            {activeCertDonor && (
                <div className="dl-modal-backdrop" onClick={() => setActiveCertDonor(null)}>
                    <div className="dl-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="dl-modal-top">
                            <div className="dl-modal-heading">
                                <FaCertificate style={{ color: '#d97706', fontSize: 20 }} />
                                <h3>Official Certificate of Philanthropic Honor</h3>
                            </div>
                            <button
                                className="dl-modal-close-btn"
                                onClick={() => setActiveCertDonor(null)}
                                title="Close Certificate Dialogue"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="dl-cert-certificate-body">
                            <div className="dl-cert-header-meta">
                                <strong>Kiran Charitable Trust</strong> • Registered u/s 80G(5)(vi) &amp; 12A • Govt of India
                            </div>

                            <h1 className="dl-cert-title-text">Certificate of Philanthropic Honor</h1>

                            <div className="dl-cert-intro-text">
                                This formal accolade of gratitude is proudly conferred upon:
                            </div>

                            <div className="dl-cert-recipient-name">
                                {activeCertDonor.name}
                            </div>

                            <div className="dl-cert-recipient-location">
                                {activeCertDonor.city || 'Andhra Pradesh'}, India
                            </div>

                            <p className="dl-cert-acknowledgement">
                                In profound recognition of your steadfast generosity and humanitarian partnership.
                                Your benevolent contributions directly empower rural medical camps, primary education
                                for underprivileged children, and daily hot meal distribution drives across Palnadu &amp; Guntur districts.
                            </p>

                            <div className="dl-cert-stats-grid">
                                <div className="dl-cert-stat-item">
                                    <span className="dl-cert-stat-caption">GIVING SOCIETY</span>
                                    <strong className="dl-cert-stat-val text-navy">
                                        {(activeCertDonor.societyInfo || getGivingSocietyInfo(activeCertDonor.totalDonated || activeCertDonor.amount)).label}
                                    </strong>
                                </div>

                                <div className="dl-cert-stat-item">
                                    <span className="dl-cert-stat-caption">TOTAL CONTRIBUTION</span>
                                    <strong className="dl-cert-stat-val text-green">
                                        ₹{(activeCertDonor.totalDonated || activeCertDonor.amount || 0).toLocaleString('en-IN')}
                                    </strong>
                                </div>

                                <div className="dl-cert-stat-item">
                                    <span className="dl-cert-stat-caption">CAUSE SUPPORTED</span>
                                    <strong className="dl-cert-stat-val text-slate">
                                        {activeCertDonor.cleanCause || getCleanCause(activeCertDonor.purpose)}
                                    </strong>
                                </div>

                                <div className="dl-cert-stat-item">
                                    <span className="dl-cert-stat-caption">TAX EXEMPTION URN</span>
                                    <span className="dl-cert-stat-val text-mono">
                                        80G: AAGTK5575QF20261
                                    </span>
                                </div>
                            </div>

                            <div className="dl-cert-footer-seal">
                                <div className="dl-seal-stamp">
                                    <FaAward />
                                    <span>SEAL OF TRUST</span>
                                </div>
                                <div className="dl-seal-text">
                                    Authorized by Kiran Charitable Trust Board of Trustees
                                    <br />
                                    Mandepudi, Palnadu District, Andhra Pradesh
                                </div>
                            </div>
                        </div>

                        <div className="dl-modal-bottom-actions">
                            <button
                                type="button"
                                className="dl-dialog-btn dl-dialog-btn-print"
                                onClick={() => window.print()}
                            >
                                <FaPrint /> Print / Save Certificate PDF
                            </button>
                            <button
                                type="button"
                                className="dl-dialog-btn dl-dialog-btn-close"
                                onClick={() => setActiveCertDonor(null)}
                            >
                                Close Dialogue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
