import { Link } from 'react-router-dom';
import {
    FaFileContract, FaEnvelope, FaBalanceScale, FaHandHoldingHeart,
    FaRupeeSign, FaShieldAlt, FaPhoneAlt, FaMapMarkerAlt, FaCheckCircle
} from 'react-icons/fa';
import './Legal.css';

export default function TermsConditions() {
    return (
        <div className="legal-page">
            <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>Terms of Service</h1>
                    <p className="breadcrumb">
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Terms of Service
                    </p>
                </div>
            </div>

            <section className="section-padding">
                <div className="container legal-container">
                    <div className="legal-card">
                        {/* Legal Hero Banner */}
                        <div className="legal-hero">
                            <FaFileContract className="legal-hero-icon" />
                            <div>
                                <h2>Terms of Service &amp; User Agreement</h2>
                                <p>Last Updated: November 2026 | Effective Date: November 2026</p>
                                <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11.5, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 12, color: '#e0f2fe' }}>
                                        Regd. No. 462/2004
                                    </span>
                                    <span style={{ fontSize: 11.5, background: 'rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: 12, color: '#a7f3d0' }}>
                                        Under Indian Trusts Act, 1882
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Introduction */}
                        <div className="legal-intro">
                            <p>
                                Welcome to <strong>Kiran Charitable Trust</strong> (&quot;Trust&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) constitute a legally binding electronic agreement between you (&quot;User&quot;, &quot;Donor&quot;, &quot;Member&quot;, or &quot;Visitor&quot;) and Kiran Charitable Trust, an Indian public charitable trust registered under the Indian Trusts Act, 1882 (Regd. No. 462/2004, Amaravathi, Andhra Pradesh).
                            </p>
                            <p style={{ marginTop: 12 }}>
                                By accessing our website, donating, registering as a Trust Member, creating an account, or interacting with any of our community drives, you unconditionally agree to comply with and be bound by these Terms and our companion Privacy Policy.
                            </p>
                        </div>

                        {/* Table of Contents */}
                        <div className="legal-toc">
                            <h4>Table of Contents</h4>
                            <ol>
                                {[
                                    'Eligibility & Acceptance of Terms',
                                    'Donations & Section 80G Tax Exemption',
                                    'Trust Membership Program',
                                    'Payment Processing & Security',
                                    'Refund, Dispute & Cancellation Policy',
                                    'User Account Responsibilities & 2FA',
                                    'Permissible Use & Code of Conduct',
                                    'Intellectual Property & Trademarks',
                                    'Limitation of Liability & Indemnity',
                                    'Governing Law & Dispute Jurisdiction',
                                    'Modifications & Official Grievance Officer'
                                ].map((item, i) => (
                                    <li key={i}><a href={`#tos-${i + 1}`}>{item}</a></li>
                                ))}
                            </ol>
                        </div>

                        {/* Detailed Policy Sections */}
                        <div className="legal-sections">
                            {/* Section 1 */}
                            <div id="tos-1" className="legal-section">
                                <h3>1. Eligibility &amp; Acceptance of Terms</h3>
                                <p>
                                    By using this platform or executing financial transactions, you represent and warrant that:
                                </p>
                                <ul>
                                    <li>You are at least 18 years of age or possess legal parental/guardian consent under applicable Indian laws.</li>
                                    <li>You are competent to enter into a legally binding contract under the Indian Contract Act, 1872.</li>
                                    <li>You are not barred from making donations or accessing charitable platforms under the laws of India or any foreign jurisdiction.</li>
                                </ul>
                            </div>

                            {/* Section 2 */}
                            <div id="tos-2" className="legal-section">
                                <h3>2. Donations &amp; Section 80G Tax Exemption</h3>
                                <div className="legal-highlight" style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>
                                    <FaHandHoldingHeart style={{ fontSize: 20, color: '#059669', flexShrink: 0 }} />
                                    <span>
                                        <strong>100% Non-Profit Philanthropy:</strong> All contributions made to Kiran Charitable Trust are purely voluntary, non-commercial gifts utilized exclusively for charitable objectives, including orphan education, rural healthcare camps, food distribution, and emergency community relief.
                                    </span>
                                </div>
                                <ul style={{ marginTop: 14 }}>
                                    <li>
                                        <strong>Income Tax Exemption:</strong> Kiran Charitable Trust is recognized under Section 80G(5)(vi) of the Income Tax Act, 1961 (URN: <strong>AAGTK5575QF20261</strong>) and Section 12A (URN: <strong>AAGTK5575QE20261</strong>). Qualifying Indian donors are entitled to a 50% tax deduction on eligible contributions.
                                    </li>
                                    <li>
                                        <strong>Mandatory PAN Requirement:</strong> In strict compliance with CBDT guidelines (Form 10BD regulations), Indian donors seeking tax exemption must furnish their valid Permanent Account Number (PAN) at checkout or via their Supporter Account settings.
                                    </li>
                                    <li>
                                        <strong>Form 10BE Digital Tax Certificates:</strong> Official annual tax certificates containing unique transaction reference hashes are generated and available for instant download in the Payment History section of your account.
                                    </li>
                                    <li>
                                        <strong>Foreign Donations:</strong> Donations from non-Indian bank accounts or cards are subject to Foreign Contribution Regulation Act (FCRA) rules and applicable central bank clearances.
                                    </li>
                                </ul>
                            </div>

                            {/* Section 3 */}
                            <div id="tos-3" className="legal-section">
                                <h3>3. Trust Membership Program</h3>
                                <p>
                                    Supporters may join as verified Trust Members through our dedicated portal:
                                </p>
                                <ul>
                                    <li>
                                        <strong>Voluntary Monthly Pledges:</strong> Members may commit to monthly or annual recurring contribution tiers (including test member verifications starting at ₹1, ₹500, ₹1,000, or custom amounts).
                                    </li>
                                    <li>
                                        <strong>Official Membership ID:</strong> Upon verification of credentials and initial contribution confirmation, an official Membership ID (e.g., <code>KCT-MEM-1032</code>) is issued under Regd. No. 462/2004.
                                    </li>
                                    <li>
                                        <strong>Public Member Wall:</strong> Members can opt in to be featured on our public Member Wall in recognition of their sustained community support. You may toggle public display on or off at any time via your account settings.
                                    </li>
                                    <li>
                                        <strong>Voluntary Suspension / Cancellation:</strong> You maintain complete autonomy over your pledge. You may pause, adjust, or cancel recurring pledge reminders at any time with no lock-in fees or penalties.
                                    </li>
                                </ul>
                            </div>

                            {/* Section 4 */}
                            <div id="tos-4" className="legal-section">
                                <h3>4. Payment Processing &amp; Security</h3>
                                <p>
                                    All monetary transactions are processed through RBI-regulated, bank-grade payment gateways (including UPI, Net Banking, and Credit/Debit Card processors).
                                </p>
                                <ul>
                                    <li>Transactions are safeguarded using certified, authorized banking security standards.</li>
                                    <li>Kiran Charitable Trust does not store, process, or view sensitive payment card numbers, CVVs, or bank security PINs.</li>
                                    <li>The Trust is not liable for transaction failures caused by donor bank server downtime, insufficient donor funds, or third-party telecom timeouts.</li>
                                </ul>
                            </div>

                            {/* Section 5 */}
                            <div id="tos-5" className="legal-section">
                                <h3>5. Refund, Dispute &amp; Cancellation Policy</h3>
                                <div className="legal-highlight" style={{ background: '#f8fafc', borderColor: '#2563eb' }}>
                                    <FaBalanceScale style={{ color: '#2563eb', flexShrink: 0 }} />
                                    <span>
                                        <strong>Charitable Trust Refund Protocol:</strong> Because donations are immediately allocated to active ground relief operations and beneficiary supplies, donations are generally non-refundable once receipted.
                                    </span>
                                </div>
                                <p style={{ marginTop: 12 }}>However, we recognize that unintentional technical glitches may arise:</p>
                                <ul>
                                    <li>
                                        <strong>Technical Duplicate Payments:</strong> If a technical error or network retry results in multiple duplicate debits for a single intended donation, notify us at <code>trustkirancharitable@gmail.com</code> within <strong>7 calendar days</strong> of the transaction date.
                                    </li>
                                    <li>
                                        <strong>Documentation Required:</strong> Refund requests must include the Donor Full Name, Email, Contact Number, Payment Gateway Transaction ID (UTR), and Proof of Bank Debit.
                                    </li>
                                    <li>
                                        <strong>Dispute Resolution:</strong> Validated duplicate transactions will be refunded to the original source payment account within <strong>7 to 10 working days</strong>, subject to payment gateway clearing timelines.
                                    </li>
                                </ul>
                            </div>

                            {/* Section 6 */}
                            <div id="tos-6" className="legal-section">
                                <h3>6. User Account Responsibilities &amp; 2FA</h3>
                                <p>When creating a Supporter Account or logging in via Email OTP, Password, or Google OAuth:</p>
                                <ul>
                                    <li>You are solely responsible for maintaining the confidentiality of your account credentials.</li>
                                    <li>You agree to notify the Trust immediately if you detect any unauthorized access or security breach.</li>
                                    <li>Our security gateway employs multi-factor authentication (OTP verification) to ensure only verified owners of the registered email address can access personal profiles and 80G tax receipts.</li>
                                    <li>Creating deceptive, bot-generated, or fraudulent accounts will result in immediate termination and reporting to cyber authorities.</li>
                                </ul>
                            </div>

                            {/* Section 7 */}
                            <div id="tos-7" className="legal-section">
                                <h3>7. Permissible Use &amp; Code of Conduct</h3>
                                <p>You agree not to engage in any of the following prohibited activities:</p>
                                <ul>
                                    <li>Using the platform for money laundering, terror financing, or any activity prohibited under the Prevention of Money Laundering Act, 2002 (PMLA).</li>
                                    <li>Attempting to probe, scan, breach, or tamper with website security, APIs, or database records.</li>
                                    <li>Impersonating Kiran Charitable Trust, its trustees, staff, or field volunteers.</li>
                                    <li>Uploading malicious scripts, ransomware, or disruptive computer code.</li>
                                </ul>
                            </div>

                            {/* Section 8 */}
                            <div id="tos-8" className="legal-section">
                                <h3>8. Intellectual Property &amp; Trademarks</h3>
                                <p>
                                    All contents on this website—including the official Kiran Charitable Trust emblem, logos, photographs of ground distribution drives, text, software, and domain assets—are the exclusive intellectual property of Kiran Charitable Trust.
                                </p>
                                <p>
                                    No material may be reproduced, distributed, deep-linked for commercial gain, or modified without the express prior written consent of the Board of Trustees.
                                </p>
                            </div>

                            {/* Section 9 */}
                            <div id="tos-9" className="legal-section">
                                <h3>9. Limitation of Liability &amp; Indemnity</h3>
                                <p>
                                    To the maximum extent permitted under applicable Indian law, Kiran Charitable Trust, its Trustees, officers, and volunteers shall not be liable for any indirect, punitive, or consequential damages resulting from your use of the website or inability to complete a contribution.
                                </p>
                                <p>
                                    You agree to indemnify and hold harmless Kiran Charitable Trust and its representatives against any claims, losses, or legal costs arising from your violation of these Terms or infringement of third-party rights.
                                </p>
                            </div>

                            {/* Section 10 */}
                            <div id="tos-10" className="legal-section">
                                <h3>10. Governing Law &amp; Dispute Jurisdiction</h3>
                                <p>
                                    These Terms shall be interpreted and governed in accordance with the laws of the Republic of India. Any legal action, dispute, or proceeding arising out of or related to these Terms or the services of Kiran Charitable Trust shall be subject to the exclusive jurisdiction of the competent courts in <strong>Guntur / Palnadu District, Andhra Pradesh, India</strong>.
                                </p>
                            </div>

                            {/* Section 11 */}
                            <div id="tos-11" className="legal-section">
                                <h3>11. Modifications &amp; Official Grievance Officer</h3>
                                <p>
                                    We reserve the right to revise or update these Terms periodically to reflect legislative modifications, Income Tax Department directives, or platform enhancements. Revisions become effective immediately upon posting.
                                </p>
                                <div className="legal-contact-info">
                                    <p><strong>Kiran Charitable Trust — Administration &amp; Grievance Redressal</strong></p>
                                    <p><FaMapMarkerAlt /> D.No: 1-124, Mandepudi Village, Amaravathi Mandal, Palnadu District, Andhra Pradesh - 522018, India</p>
                                    <p><FaEnvelope /> trustkirancharitable@gmail.com / contact@kirancharitabletrust.org</p>
                                    <p><FaPhoneAlt /> +91 9392785230 / +91 99894 51432</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div className="legal-footer-nav">
                            <Link to="/privacy-policy" className="btn btn-outline">Privacy Policy →</Link>
                            <Link to="/donate" className="btn btn-primary">Support Our Mission</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
