import { Link } from 'react-router-dom'
import { FaXTwitter } from 'react-icons/fa6'
import {
    FaHeart, FaFacebook, FaInstagram, FaLinkedin,
    FaYoutube, FaWhatsapp, FaMapMarkerAlt, FaPhone,
    FaEnvelope, FaClock
} from 'react-icons/fa'
import KLogo from '../assets/Klogo.jpeg'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-top">
                <div className="container footer-grid">
                    {/* About */}
                    <div className="footer-col">
                        <div className="footer-logo">
                            <div className="footer-logo-img-wrap">
                                <img src={KLogo} alt="Kiran Charitable Trust Logo" className="footer-logo-img" />
                            </div>
                            <div>
                                <span className="footer-logo-name">Kiran</span>
                                <span className="footer-logo-sub">Charitable Trust</span>
                            </div>
                        </div>
                        <p className="footer-desc">
                            Making a difference in lives through education, healthcare, food distribution,
                            and women empowerment since 2026. Registered under 80G & 12A.
                        </p>
                        <div className="footer-socials">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook /></a>
                            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)"><FaXTwitter /></a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><FaYoutube /></a>
                            <a href="https://wa.me/917702468889" target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/founder-desk">Founder Desk</Link></li>
                            <li><Link to="/activities">Our Activities</Link></li>
                            <li><Link to="/gallery">Gallery</Link></li>
                                                        <li><Link to="/donate">Donate</Link></li>
                            <li><Link to="/donors">Top Donors &amp; Honor Roll</Link></li>
                            <li><a href="/portal/login" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontWeight: 600 }}>Member Portal Login ↗</a></li>
                            <li><a href="/login?tab=register" target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', fontWeight: 600 }}>Join as Member ↗</a></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="footer-col">
                        <h4>Support Us</h4>
                        <ul className="footer-links">
                            <li><Link to="/donate">Make a Donation</Link></li>
                            <li><Link to="/about">Trust Documents & Approvals</Link></li>
                            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                            <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
                        </ul>
                        <h4 style={{ marginTop: '24px' }}>Legal Info</h4>
                        <ul className="footer-legal-list">
                            <li>Trust Deed No: 462/2004</li>
                            <li>PAN: AAGTK5575Q</li>
                            <li>12A URN: AAGTK5575QE20261</li>
                            <li>80G URN: AAGTK5575QF20261</li>
                            <li>Validity: AY 2026-27 to 2028-29</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-col">
                        <h4>Contact Us</h4>
                        <ul className="footer-contact-list">
                            <li>
                                <FaMapMarkerAlt />
                                <span>Mandepudi, Nemalikallu, Amaravathi, Palnaadu, Guntur - 522018</span>
                            </li>
                            <li>
                                <FaPhone />
                                <span>+91 77024 68889</span>
                            </li>
                            <li>
                                <FaWhatsapp />
                                <a href="https://wa.me/917702468889">+91 77024 68889</a>
                            </li>
                            <li>
                                <FaEnvelope />
                                <span>contact@kirancharitabletrust.org</span>
                            </li>
                            <li>
                                <FaClock />
                                <span>Monâ€“Sat: 9:00 AM â€“ 6:00 PM</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p>Â© {new Date().getFullYear()} Kiran Charitable Trust. All rights reserved. Made with <FaHeart className="heart-icon" /> for humanity.</p>
                    <div className="footer-bottom-links">
                        <Link to="/privacy-policy">Privacy Policy</Link>
                        <Link to="/terms-conditions">Terms & Conditions</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
