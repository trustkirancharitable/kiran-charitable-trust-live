import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
    FaBars, FaTimes, FaHeart, FaChevronDown, FaTrophy, FaHandshake
} from 'react-icons/fa';
import KLogo from '../assets/Klogo.jpeg';
import './Header.css';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    return (
        <header className={`header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-inner">
                {/* Logo */}
                <Link to="/" className="logo" title="Kiran Charitable Trust">
                    <div className="logo-img-wrap">
                        <img src={KLogo} alt="Kiran Charitable Trust Logo" className="logo-img" />
                    </div>
                </Link>

                {/* Desktop Nav - Matching Blueprint Navigation Spec */}
                <nav className="nav-desktop">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                        Home
                    </NavLink>
                    <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        About Us
                    </NavLink>
                    <NavLink to="/activities" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Our Programs
                    </NavLink>
                    <NavLink to="/founder-desk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Founder's Message
                    </NavLink>
                    <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Field Gallery
                    </NavLink>
                    <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Contact Us
                    </NavLink>
                    <NavLink to="/trust-members" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Trust Members
                    </NavLink>
                </nav>

                {/* Header Actions (Top Donors, Join as Trust Member, Donate Now) */}
                <div className="header-actions">
                    <Link to="/donors" className="btn-signin-nav" title="View Official Top Donors Leaderboard">
                        <FaTrophy style={{ color: '#d97706' }} /> <span className="nav-btn-label">Top Donors</span>
                    </Link>

                    <Link to="/login?tab=register" className="btn-join-nav" title="Join as Trust Member">
                        <FaHandshake style={{ color: '#2563eb' }} /> <span className="nav-btn-label">Join Member</span>
                    </Link>

                    <Link to="/donate" className="btn btn-primary donate-btn">
                        <FaHeart /> <span className="nav-btn-label">Donate Now</span>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Dedicated Quick-Action Bar (Directly accessible on mobile outside the menu) */}
            <div className="header-quick-bar mobile-only">
                <Link to="/donors" className="quick-bar-btn quick-donors" title="Top Donors Leaderboard">
                    <FaTrophy className="qb-icon" style={{ color: '#d97706' }} />
                    <span className="qb-label">Top Donors</span>
                </Link>

                <Link to="/login?tab=register" className="quick-bar-btn quick-join" title="Join as Trust Member">
                    <FaHandshake className="qb-icon" style={{ color: '#2563eb' }} />
                    <span className="qb-label">Join Member</span>
                </Link>

                <Link to="/donate" className="quick-bar-btn quick-donate" title="Donate Now">
                    <FaHeart className="qb-icon" />
                    <span className="qb-label">Donate Now</span>
                </Link>
            </div>

            {/* Mobile Nav */}
            <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
                <NavLink to="/" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} end>
                    Home
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
                    About Us
                </NavLink>
                <NavLink to="/activities" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
                    Our Programs
                </NavLink>
                <NavLink to="/founder-desk" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
                    Founder's Message
                </NavLink>
                <NavLink to="/gallery" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
                    Field Gallery
                </NavLink>
                <NavLink to="/contact" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
                    Contact Us
                </NavLink>
                <NavLink to="/trust-members" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    Trust Members
                </NavLink>

                <Link to="/donors" className="btn btn-secondary mobile-donate-btn" style={{ marginTop: 10 }} onClick={() => setMenuOpen(false)}>
                    <FaTrophy style={{ color: '#d97706' }} /> Top Donors Leaderboard
                </Link>

                <Link to="/login?tab=register" className="btn btn-secondary mobile-donate-btn" style={{ marginTop: 8, background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }} onClick={() => setMenuOpen(false)}>
                    <FaHandshake style={{ color: '#2563eb' }} /> Join as Trust Member
                </Link>

                <Link to="/donate" className="btn btn-primary mobile-donate-btn" style={{ marginTop: 8 }} onClick={() => setMenuOpen(false)}>
                    <FaHeart /> Donate Now
                </Link>
            </div>
        </header>
    );
}
