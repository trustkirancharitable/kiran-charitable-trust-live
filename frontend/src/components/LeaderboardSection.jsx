import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaCrown, FaStar, FaAward, FaHeart, FaUserCheck, FaArrowRight, FaUsers } from 'react-icons/fa';
import './LeaderboardSection.css';

export default function LeaderboardSection() {
    const [tab, setTab] = useState('monthly'); // 'monthly' | 'alltime' | 'members'
    const [data, setData] = useState({
        month: 'Current Month',
        monthlyTop: [],
        allTimeTop: [],
        trustMembers: []
    });

    useEffect(() => {
        let isMounted = true;
        axios.get(`${API_BASE_URL}/donors/leaderboard`)
            .then(res => {
                if (isMounted && res.data?.success) {
                    setData(res.data);
                }
            })
            .catch(e => console.warn('Leaderboard notice:', e.message));

        return () => { isMounted = false; };
    }, []);

    const activeList = tab === 'monthly'
        ? data.monthlyTop
        : tab === 'alltime'
            ? data.allTimeTop
            : data.trustMembers.map((m, idx) => ({
                rank: idx + 1,
                name: m.name,
                photo: m.profilePhoto || m.profile_photo || '',
                totalDonated: m.donationAmount || m.donation_amount || 500,
                tag: 'Trust Member'
            }));

    return (
        <section className="leaderboard-sec">
            <div className="container">
                <div className="section-title">
                    <p className="tagline">Community Hall of Fame</p>
                    <h2>Our Generous Pillars & Ranked Donors</h2>
                    <p>Recognizing the kind-hearted souls who empower regular meals, education, and elder support</p>
                    <div className="title-underline"><span /><span /><span /></div>
                </div>

                <div className="leaderboard-tabs">
                    <button
                        className={`lb-tab-btn ${tab === 'monthly' ? 'active' : ''}`}
                        onClick={() => setTab('monthly')}
                    >
                        <FaCrown style={{ color: '#f59e0b' }} /> {data.month} Top Donors
                    </button>
                    <button
                        className={`lb-tab-btn ${tab === 'alltime' ? 'active' : ''}`}
                        onClick={() => setTab('alltime')}
                    >
                        <FaAward style={{ color: '#3b82f6' }} /> All-Time Contributors
                    </button>
                    <button
                        className={`lb-tab-btn ${tab === 'members' ? 'active' : ''}`}
                        onClick={() => setTab('members')}
                    >
                        <FaStar style={{ color: '#10b981' }} /> Trust Member Pillars
                    </button>
                </div>

                <div className="lb-grid">
                    {activeList.map((donor, idx) => {
                        const rankClass = donor.rank === 1 ? 'rank-1' : donor.rank === 2 ? 'rank-2' : donor.rank === 3 ? 'rank-3' : '';
                        const initials = donor.name ? donor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'K';

                        return (
                            <div key={idx} className={`lb-card ${rankClass}`}>
                                <div className="lb-rank-badge">#{donor.rank}</div>

                                {donor.photo ? (
                                    <img
                                        src={donor.photo}
                                        alt={donor.name}
                                        className="lb-avatar"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="lb-avatar"
                                    style={{ display: donor.photo ? 'none' : 'flex' }}
                                >
                                    {initials}
                                </div>

                                <div className="lb-info">
                                    <h4>{donor.name}</h4>
                                    <p>{donor.tag || (tab === 'monthly' ? 'Monthly Contributor' : 'Valued Member')}</p>
                                    <div className="lb-amount">
                                        ₹{Number(donor.totalDonated).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Membership CTA Strip */}
                <div className="lb-cta-strip">
                    <div className="lb-cta-text">
                        <h3>Join Our Monthly Trust Membership</h3>
                        <p>
                            Starting from just ₹500/month (first payment starts after 1 month). Your photo and name are featured on our Live Marquee!
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Link
                            to="/register/trust-member"
                            className="btn"
                            style={{ background: '#f59e0b', color: '#000', fontWeight: 800, padding: '12px 24px' }}
                        >
                            <FaUserCheck /> Enroll as Trust Member
                        </Link>
                        
                    </div>
                </div>
            </div>
        </section>
    );
}
