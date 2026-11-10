import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
    FaBars, FaTimes, FaHeart, FaChevronDown, 
    FaUserPlus, FaTrophy, FaSignInAlt
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
            <div className="container header-inner">
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

                {/* Header Actions: Top Donors + Member Login + Join Member + Donate Now */}
                <div className="header-actions">
                    <Link to="/donors" className="btn-signin-nav" title="View Official Top Donors Leaderboard">
                        <FaTrophy style={{ color: '#d97706' }} /> Top Donors
                    </Link>

                    <a
                        href="/portal/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-portal-login-nav"
                        title="Member Portal Login (Opens in New Tab)"
                    >
                        <FaSignInAlt style={{ color: '#0F52BA' }} /> Member Login
                    </a>

                    <a
                        href="/portal/join"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-join-nav"
                        title="Join as Official Trust Member (Opens in New Tab)"
                    >
                        <FaUserPlus /> Join Member
                    </a>

                    <Link to="/donate" className="btn btn-primary donate-btn">
                        <FaHeart /> Donate Now
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

                <a
                    href="/portal/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary mobile-donate-btn"
                    style={{ marginTop: 10, borderColor: '#bfdbfe', background: '#eff6ff', color: '#1e40af' }}
                    onClick={() => setMenuOpen(false)}
                >
                    <FaSignInAlt style={{ color: '#0F52BA' }} /> Member Login (New Tab)
                </a>

                <a
                    href="/portal/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary mobile-donate-btn"
                    style={{ marginTop: 6, borderColor: '#86efac', background: '#f0fdf4', color: '#166534' }}
                    onClick={() => setMenuOpen(false)}
                >
                    <FaUserPlus style={{ color: '#16a34a' }} /> Join as Member (Registration)
                </a>

                <Link to="/donors" className="btn btn-secondary mobile-donate-btn" style={{ marginTop: 6 }} onClick={() => setMenuOpen(false)}>
                    <FaTrophy style={{ color: '#d97706' }} /> Top Donors Leaderboard
                </Link>

                <Link to="/donate" className="btn btn-primary mobile-donate-btn">
                    <FaHeart /> Donate Now
                </Link>
            </div>
        </header>
    );
}
