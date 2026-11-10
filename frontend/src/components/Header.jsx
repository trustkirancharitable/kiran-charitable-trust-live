import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
    FaBars, FaTimes, FaHeart, FaChevronDown, 
    FaUserPlus, FaTrophy
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

                {/* Header Actions: Top Donors + Donate Now */}
                <div className="header-actions">
                    <Link to="/donors" className="btn-signin-nav" title="View Official Top Donors Leaderboard">
                        <FaTrophy style={{ color: '#d97706' }} /> Top Donors
                    </Link>

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

                <Link to="/portal/join" className="btn btn-secondary mobile-donate-btn" style={{ marginTop: 10, borderColor: '#86efac', background: '#f0fdf4', color: '#166534' }} onClick={() => setMenuOpen(false)}>
                    <FaUserPlus style={{ color: '#16a34a' }} /> Join as Member (Registration)
                </Link>

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
