import { Link } from 'react-router-dom';
import {
    FaShieldAlt, FaEnvelope, FaLock, FaUserCheck, FaFileInvoice,
    FaGoogle, FaExclamationCircle, FaCheckCircle, FaPhoneAlt, FaMapMarkerAlt
} from 'react-icons/fa';
import './Legal.css';

export default function PrivacyPolicy() {
    return (
        <div className="legal-page">
            <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p className="breadcrumb">
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Privacy Policy
                    </p>
                </div>
            </div>

            <section className="section-padding">
                <div className="container legal-container">
                    <div className="legal-card">
                        {/* Legal Hero Banner */}
                        <div className="legal-hero">
                            <FaShieldAlt className="legal-hero-icon" />
                            <div>
                                <h2>Our Privacy &amp; Data Protection Commitment</h2>
                                <p>Last Updated: November 2026 | Effective Date: November 2026</p>
                                <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11.5, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 12, color: '#e0f2fe' }}>
                                        Regd. No. 3/2026
                                    </span>
                                    <span style={{ fontSize: 11.5, background: 'rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: 12, color: '#a7f3d0' }}>
                                        12A &amp; 80G Certified NGO
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Introduction */}
                        <div className="legal-intro">
                            <p>
                                <strong>Kiran Charitable Trust</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or the &quot;Trust&quot;) is a registered non-profit public charitable trust under the Indian Trusts Act, 1882 (Registration No. 3/2026), holding statutory approvals under Section 12A (URN: AAGTK5575QE20261) and Section 80G (URN: AAGTK5575QF20261) of the Income Tax Act, 1961, with PAN <strong>AAGTK5575Q</strong> and NITI Aayog NGO Darpan ID <strong>AP/2023/0361245</strong>.
                            </p>
                            <p style={{ marginTop: 12 }}>
                                We are deeply committed to respecting and protecting the personal privacy of our donors, trust members, volunteers, beneficiaries, and website visitors. This Privacy Policy governs our collection, use, retention, disclosure, and protection of information in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>, the <strong>Information Technology Act, 2000</strong>, and global data privacy standards.
                            </p>
                        </div>

                        {/* Table of Contents */}
                        <div className="legal-toc">
                            <h4>Table of Contents</h4>
                            <ol>
                                {[
                                    'Scope & Application',
                                    'Information We Collect',
                                    'Google OAuth & Third-Party Sign-In Policy',
                                    'How We Use Your Information',
                                    '80G Tax Certificates & CBDT Form 10BD/10BE',
                                    'Data Protection, Storage & Security',
                                    'Information Sharing & Disclosure',
                                    'Cookies & Tracking Technologies',
                                    'Your Statutory Privacy Rights',
                                    'Data Retention & Account Erasure',
                                    'Grievance Redressal & Contact Info'
                                ].map((item, i) => (
                                    <li key={i}><a href={`#pp-${i + 1}`}>{item}</a></li>
                                ))}
                            </ol>
                        </div>

                        {/* Detailed Policy Sections */}
                        <div className="legal-sections">
                            {/* Section 1 */}
                            <div id="pp-1" className="legal-section">
                                <h3>1. Scope &amp; Application</h3>
                                <p>
                                    This policy applies to all personal data collected through our primary website (<code>https://kirancharitabletrust.org</code> and related local/hosted domains), our Supporter Account &amp; Member Console (<code>/portal/profile</code>), our Trust Member Registration portals, and any related digital communication channels managed by Kiran Charitable Trust.
                                </p>
                            </div>

                            {/* Section 2 */}
                            <div id="pp-2" className="legal-section">
                                <h3>2. Information We Collect</h3>
                                <p>We only collect information that is strictly necessary to fulfill our charitable mission, maintain public trust records, and comply with Indian statutory requirements:</p>
                                <ul>
                                    <li>
                                        <strong>Account &amp; Identification Data:</strong> Full legal name, registered email address, mobile contact number, residential/postal address, and securely hashed passwords (processed with one-way salted bcrypt algorithms).
                                    </li>
                                    <li>
                                        <strong>Statutory Tax Deduction Data (For 80G Exemption):</strong> Permanent Account Number (PAN Card). Under Income Tax Department (CBDT) regulations, a valid PAN is legally mandatory to upload Form 10BD and issue Form 10BE certificates to Indian taxpayers.
                                    </li>
                                    <li>
                                        <strong>Trust Member Verification Data:</strong> Profile photo (for digital Member ID cards), Aadhaar last 4 digits (optional masked verification), subscription frequency, and voluntary monthly pledge preferences.
                                    </li>
                                    <li>
                                        <strong>Donation Transaction Records:</strong> Transaction reference IDs (UTR / Client Txn ID), payment dates, contributed amounts, and designated welfare campaigns (e.g. orphan nutrition, school supplies, healthcare camps).
                                    </li>
                                    <li>
                                        <strong>Zero Financial Storage:</strong> We <em>never</em> collect, capture, or store credit/debit card numbers, CVVs, net-banking credentials, or UPI PINs. All financial checkout processes are handled directly through certified, PCI-DSS Level 1 compliant, RBI-authorized payment gateways.
                                    </li>
                                </ul>
                            </div>

                            {/* Section 3 — Google OAuth Specific (Essential for Google Verification) */}
                            <div id="pp-3" className="legal-section">
                                <h3>3. Google OAuth &amp; Third-Party Sign-In Policy</h3>
                                <p>
                                    To provide a secure and frictionless experience, our platform offers <strong>Sign in with Google</strong> (Google OAuth 2.0).
                                </p>
                                <div className="legal-highlight" style={{ background: '#f0fdf4', borderColor: '#10b981', color: '#065f46' }}>
                                    <FaGoogle style={{ fontSize: 22, color: '#ea4335', flexShrink: 0 }} />
                                    <div>
                                        <strong>Limited Use Disclosure:</strong> Our application accesses only the basic profile scope provided by Google: your primary email address, your verified display name, and your public Google avatar.
                                    </div>
                                </div>
                                <ul style={{ marginTop: 12 }}>
                                    <li>
                                        <strong>Purpose of Google Data:</strong> We use your Google credentials exclusively to authenticate your identity, prevent unauthorized access, and create or link your supporter account.
                                    </li>
                                    <li>
                                        <strong>No Password Creation Required:</strong> When signing in through Google OAuth, your account password remains null; you may optionally configure an independent password inside the Security Settings tab if you wish.
                                    </li>
                                    <li>
                                        <strong>Zero Access to Private Google Files:</strong> We do not request, access, read, or store your Google Drive, Gmail messages, contact lists, calendar, or location data.
                                    </li>
                                    <li>
                                        <strong>Compliance with Google API Services User Data Policy:</strong> Kiran Charitable Trust&apos;s use and transfer to any other app of information received from Google APIs adheres to the <em>Google API Services User Data Policy</em>, including the Limited Use requirements.
                                    </li>
                                </ul>
                            </div>

                            {/* Section 4 */}
                            <div id="pp-4" className="legal-section">
                                <h3>4. How We Use Your Information</h3>
                                <p>We use personal information exclusively for legitimate non-profit and humanitarian objectives:</p>
                                <ul>
                                    <li>Generating official, digitally verified 80G tax receipts (Form 10BE) with unique certificate numbers.</li>
                                    <li>Issuing and renewing official Trust Member ID credentials.</li>
                                    <li>Dispatching transactional updates, contribution confirmations, and two-factor authentication (OTP) codes to your email.</li>
                                    <li>Providing monthly membership pledge status and voluntary renewal reminders.</li>
                                    <li>Publishing approved donor names on the public Member Wall (only when explicit consent is provided).</li>
                                    <li>Preventing fraudulent payments, bot abuse, and maintaining compliance with audit requirements under the Indian Trusts Act.</li>
                                </ul>
                            </div>

                            {/* Section 5 */}
                            <div id="pp-5" className="legal-section">
                                <h3>5. 80G Tax Certificates &amp; CBDT Form 10BD/10BE</h3>
                                <p>
                                    In accordance with Notification No. 19/2021 of the Central Board of Direct Taxes (CBDT), Ministry of Finance, Government of India, all non-profit trusts are required to submit an annual Statement of Donations in <strong>Form No. 10BD</strong>.
                                </p>
                                <p>
                                    To ensure our donors receive the 50% income tax deduction under Section 80G(5)(vi), your legal name, donation amount, and PAN card number are uploaded to the Income Tax Department e-Filing portal. Donors can download their official <strong>Form 10BE Certificate</strong> directly from their Supporter Account Console at any time.
                                </p>
                            </div>

                            {/* Section 6 */}
                            <div id="pp-6" className="legal-section">
                                <h3>6. Data Protection, Storage &amp; Security</h3>
                                <p>
                                    We employ robust, defense-in-depth technical and organizational measures to safeguard your personal data:
                                </p>
                                <ul>
                                    <li><strong>Safe &amp; Verified Security:</strong> All data transmitted between your browser and our servers is secured with industry-standard web protection.</li>
                                    <li><strong>Secure Document Storage:</strong> User profile photos and official documents are preserved safely in protected cloud storage with strict privacy controls.</li>
                                    <li><strong>Bcrypt Password Hashing:</strong> Passwords are never stored in plaintext and cannot be retrieved or decrypted by trust administrators.</li>
                                    <li><strong>Two-Factor Authentication (2FA):</strong> Email verification OTPs ensure unauthorized parties cannot access your personal profile.</li>
                                </ul>
                            </div>

                            {/* Section 7 */}
                            <div id="pp-7" className="legal-section">
                                <h3>7. Information Sharing &amp; Disclosure</h3>
                                <div className="legal-highlight" style={{ background: '#f8fafc', borderColor: '#2563eb' }}>
                                    <FaLock style={{ color: '#2563eb', flexShrink: 0 }} />
                                    <span>
                                        <strong>Absolute Non-Commercial Stance:</strong> Kiran Charitable Trust does not sell, rent, lease, trade, or monetize your personal information to third-party marketing companies, brokers, or external advertisers.
                                    </span>
                                </div>
                                <p style={{ marginTop: 12 }}>We disclose personal data strictly in the following limited circumstances:</p>
                                <ul>
                                    <li><strong>Authorized Payment Gateways:</strong> Sharing minimal transaction parameters with certified processors (e.g. UPI, Razorpay) to complete your donation.</li>
                                    <li><strong>Statutory Authorities:</strong> Disclosing donor schedules to the Income Tax Department of India or state regulatory bodies when mandated by law.</li>
                                    <li><strong>Direct Service Infrastructure:</strong> Trusted cloud and email delivery partners (e.g., automated transactional email dispatchers) bound by strict confidentiality obligations.</li>
                                </ul>
                            </div>

                            {/* Section 8 */}
                            <div id="pp-8" className="legal-section">
                                <h3>8. Cookies &amp; Local Storage</h3>
                                <p>
                                    Our website uses lightweight session cookies and browser LocalStorage solely to maintain your authentication state, retain theme preferences, and remember notification read statuses. We do not use third-party invasive behavioral tracking cookies.
                                </p>
                            </div>

                            {/* Section 9 */}
                            <div id="pp-9" className="legal-section">
                                <h3>9. Your Statutory Privacy Rights</h3>
                                <p>Under the DPDP Act, 2023 and applicable privacy laws, you possess the right to:</p>
                                <ul>
                                    <li><strong>Access &amp; Review:</strong> View all personal data, donation records, and membership statuses stored under your account.</li>
                                    <li><strong>Rectification:</strong> Edit or correct your name, phone number, residential address, PAN number, or profile photo at any time via your account settings.</li>
                                    <li><strong>Withdraw Consent:</strong> Opt out of non-essential email updates and newsletters.</li>
                                    <li><strong>Data Portability:</strong> Print or download your Form 10BE tax receipts and donation ledgers.</li>
                                </ul>
                            </div>

                            {/* Section 10 */}
                            <div id="pp-10" className="legal-section">
                                <h3>10. Data Retention &amp; Account Erasure</h3>
                                <p>
                                    We retain active user accounts as long as you remain a supporter of Kiran Charitable Trust. If you wish to permanently delete your account or request data erasure, you may submit a request to our Data Protection Officer.
                                </p>
                                <p>
                                    <em>Note:</em> Financial donation records and statutory Form 10BD filings must be preserved for a statutory minimum of 7 years in compliance with Section 139 of the Income Tax Act, 1961.
                                </p>
                            </div>

                            {/* Section 11 */}
                            <div id="pp-11" className="legal-section">
                                <h3>11. Grievance Redressal &amp; Contact Info</h3>
                                <p>
                                    In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the contact details for our Grievance Officer and Trust Administration are provided below:
                                </p>
                                <div className="legal-contact-info">
                                    <p><strong>Kiran Charitable Trust</strong></p>
                                    <p><strong>Designation:</strong> Data Protection &amp; Grievance Redressal Officer</p>
                                    <p><FaMapMarkerAlt /> D.No: 1-124, Mandepudi Village, Amaravathi Mandal, Palnadu District, Andhra Pradesh - 522018, India</p>
                                    <p><FaEnvelope /> trustkirancharitable@gmail.com / contact@kirancharitabletrust.org</p>
                                    <p><FaPhoneAlt /> +91 9392785230 / +91 99894 51432</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div className="legal-footer-nav">
                            <Link to="/terms-of-service" className="btn btn-outline">Terms of Service →</Link>
                            <Link to="/contact" className="btn btn-primary">Contact Trust Office</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
