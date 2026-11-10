import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import {
    FaUsers,
    FaRupeeSign,
    FaSearch,
    FaMapMarkerAlt,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaHeart,
    FaCheckCircle,
    FaUser,
    FaTrophy,
    FaMedal,
    FaCrown
} from 'react-icons/fa';
import '../DonorsLeaderboard.css';

// Short currency format
function formatLakhs(amount) {
    if (!amount && amount !== 0) return '₹0';
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function PortalDonors() {
    const { user, isAuthenticated } = useAuth();
    const [donors, setDonors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTier, setSelectedTier] = useState('ALL');
    const [sortOption, setSortOption] = useState('rank'); // 'rank' | 'amount_desc' | 'name_asc'
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await axios.get(`${API_BASE_URL}/donors/leaderboard`);
                if (res.data?.success) {
                    const raw = (res.data.allDonors && res.data.allDonors.length > 0)
                        ? res.data.allDonors
                        : [...(res.data.allTimeTop || []), ...(res.data.honorsList || [])];

                    const normalized = raw.map((d, i) => ({
                        ...d,
                        rank: d.rank || i + 1,
                        name: d.name || 'Anonymous Donor',
                        city: d.city || 'Guntur',
                        state: d.state || 'Andhra Pradesh',
                        totalDonated: d.totalDonated || d.amount || 0,
                        tier: (d.tierName || d.tierBadge || d.tier || 'Member').replace(/Patron/gi, 'Member'),
                        avatar: d.photo || d.avatar || '',
                        purpose: d.purpose || 'General Community Welfare'
                    }));

                    setDonors(normalized);
                }
            } catch (err) {
                console.warn('Portal donors leaderboard fetch notice:', err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    // Filter & Sort
    const filteredDonors = useMemo(() => {
        let list = [...donors];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(d =>
                (d.name && d.name.toLowerCase().includes(q)) ||
                (d.city && d.city.toLowerCase().includes(q)) ||
                (d.state && d.state.toLowerCase().includes(q)) ||
                (d.tier && d.tier.toLowerCase().includes(q)) ||
                (d.purpose && d.purpose.toLowerCase().includes(q))
            );
        }

        if (selectedTier !== 'ALL') {
            const st = selectedTier.toLowerCase();
            list = list.filter(d => (d.tier || '').toLowerCase().includes(st));
        }

        list.sort((a, b) => {
            if (sortOption === 'amount_desc') return (b.totalDonated || 0) - (a.totalDonated || 0);
            if (sortOption === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            return (a.rank || 9999) - (b.rank || 9999);
        });

        return list;
    }, [donors, searchQuery, selectedTier, sortOption]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedTier, sortOption]);

    const top3 = useMemo(() => {
        return donors.slice(0, 3);
    }, [donors]);

    const totalPages = Math.max(1, Math.ceil(filteredDonors.length / pageSize));
    const paginatedDonors = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDonors.slice(start, start + pageSize);
    }, [filteredDonors, currentPage, pageSize]);

    return (
        <div className="lb-template-container" style={{ maxWidth: '100%', padding: '0 4px' }}>
            {/* Top Banner */}
            <div className="tm-top-join-banner" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', border: '1.5px solid #2563EB' }}>
                <div className="tm-top-join-left">
                    <span className="tm-top-join-tag" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                        <FaTrophy style={{ color: '#FBBF24' }} /> Official Donors Leaderboard
                    </span>
                    <h1 className="tm-top-join-title">Kiran Charitable Trust Philanthropy Roster</h1>
                    <p className="tm-top-join-desc">
                        Honoring our sustained members and dedicated donors who power community healthcare, food relief, and child education drives across Palnadu and Amaravathi.
                    </p>
                </div>
                <div className="tm-top-join-right" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link to="/portal/profile?tab=payments&action=contribute#contribute" className="tm-banner-join-btn" style={{ background: 'linear-gradient(135deg, #059669, #10B981)', borderColor: '#059669', justifyContent: 'center' }}>
                        <FaHeart /> Make a Contribution →
                    </Link>
                </div>
            </div>

            {/* Top 3 Podium Highlights */}
            {top3.length >= 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {/* Rank 2 (Silver) */}
                    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #CBD5E1', padding: '18px 20px', position: 'relative', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                        <div style={{ position: 'absolute', top: 12, right: 14, background: '#F1F5F9', color: '#64748B', fontWeight: 800, fontSize: 11, padding: '3px 9px', borderRadius: 20 }}>
                            🥈 Rank 2 • Silver
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                                <FaMedal />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0F172A' }}>{top3[1].name}</h3>
                                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{top3[1].city}, {top3[1].state}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Impact</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>₹{Number(top3[1].totalDonated).toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Rank 1 (Gold Champion) */}
                    <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)', borderRadius: 14, border: '2px solid #F59E0B', padding: '18px 20px', position: 'relative', boxShadow: '0 6px 18px rgba(245,158,11,0.15)' }}>
                        <div style={{ position: 'absolute', top: 12, right: 14, background: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid #FDE68A' }}>
                            👑 Rank 1 • Grand Champion
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>
                                <FaCrown />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0F172A' }}>{top3[0].name}</h3>
                                <p style={{ fontSize: 12, color: '#92400E', margin: '2px 0 0', fontWeight: 600 }}>{top3[0].city}, {top3[0].state}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>Total Sustained Impact</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#D97706' }}>₹{Number(top3[0].totalDonated).toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Rank 3 (Bronze) */}
                    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #CBD5E1', padding: '18px 20px', position: 'relative', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                        <div style={{ position: 'absolute', top: 12, right: 14, background: '#FFF7ED', color: '#C2410C', fontWeight: 800, fontSize: 11, padding: '3px 9px', borderRadius: 20, border: '1px solid #FFEDD5' }}>
                            🥉 Rank 3 • Bronze
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF7ED', color: '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                                <FaMedal />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0F172A' }}>{top3[2].name}</h3>
                                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{top3[2].city}, {top3[2].state}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Impact</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>₹{Number(top3[2].totalDonated).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter & Controls */}
            <div className="lb-controls-card" style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <FaSearch style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Search donors by name, city, or cause..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        <select
                            value={selectedTier}
                            onChange={e => setSelectedTier(e.target.value)}
                            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', fontWeight: 600 }}
                        >
                            <option value="ALL">All Member Tiers</option>
                            <option value="Member">Members</option>
                            <option value="Gold">Gold Members</option>
                            <option value="Silver">Silver Members</option>
                            <option value="Starter">Starter Donors</option>
                        </select>

                        <select
                            value={sortOption}
                            onChange={e => setSortOption(e.target.value)}
                            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', fontWeight: 600 }}
                        >
                            <option value="rank">Sort: Rank (High to Low)</option>
                            <option value="amount_desc">Sort: Highest Contribution</option>
                            <option value="name_asc">Sort: Donor Name (A-Z)</option>
                        </select>
                    </div>

                    <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                        Total Donors: <strong style={{ color: '#0F172A' }}>{filteredDonors.length}</strong>
                    </div>
                </div>
            </div>

            {/* Donor Table */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Rank</th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Donor Name</th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Giving Tier</th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Location</th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Total Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>Loading verified leaderboard data...</td>
                                </tr>
                            ) : paginatedDonors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>No donors found matching criteria.</td>
                                </tr>
                            ) : (
                                paginatedDonors.map((d, i) => {
                                    const rank = d.rank || (currentPage - 1) * pageSize + i + 1;
                                    const isTop3 = rank <= 3;
                                    const rankBadgeColor = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : rank === 3 ? '#B45309' : '#64748B';

                                    return (
                                        <tr key={d.id || d._id || i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                                            <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    background: isTop3 ? `${rankBadgeColor}20` : '#F1F5F9',
                                                    color: rankBadgeColor,
                                                    fontSize: 13
                                                }}>
                                                    {isTop3 ? <FaMedal /> : rank}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, overflow: 'hidden' }}>
                                                        {d.avatar ? (
                                                            <img src={d.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            (d.name || 'D').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{d.name || 'Anonymous Donor'}</div>
                                                        <div style={{ fontSize: 11, color: '#64748B' }}>{d.purpose || 'Verified Community Contributor'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <span style={{
                                                    fontSize: 11.5,
                                                    fontWeight: 700,
                                                    padding: '3px 9px',
                                                    borderRadius: 12,
                                                    background: '#EFF6FF',
                                                    color: '#1E40AF',
                                                    border: '1px solid #BFDBFE'
                                                }}>
                                                    {String(d.tier || 'Member').replace(/Patron/gi, 'Member')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 18px', color: '#475569', fontSize: 13 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <FaMapMarkerAlt style={{ color: '#94A3B8', fontSize: 11 }} />
                                                    {d.city || 'Guntur'}, {d.state || 'AP'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: 14 }}>
                                                {formatLakhs(d.totalDonated)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 12.5, color: '#64748B' }}>
                            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}
                            >
                                <FaChevronLeft /> Prev
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}
                            >
                                Next <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
