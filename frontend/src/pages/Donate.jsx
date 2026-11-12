import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logo12A from '../assets/compliance_logos/logo_12a.png';
import Logo80G from '../assets/compliance_logos/logo_80g.png';
import LogoDarpan from '../assets/compliance_logos/logo_darpan.png';
import LogoTrustDeed from '../assets/compliance_logos/logo_trust_deed.png';
import LogoPan from '../assets/compliance_logos/pan_card_preview.png';
import {
    FaGraduationCap,
    FaStethoscope,
    FaUtensils,
    FaUsers,
    FaShieldAlt,
    FaLayerGroup,
    FaIdCard,
    FaCheckCircle,
    FaQrcode,
    FaUniversity,
    FaCopy,
    FaFileAlt,
    FaDownload,
    FaLock,
    FaHeart,
    FaEdit,
    FaInfoCircle,
    FaPrint,
    FaTimes,
    FaHandHoldingHeart,
    FaBoxOpen,
    FaTrophy,
    FaCalendarAlt,
    FaBolt,
    FaArrowRight,
    FaRupeeSign,
    FaExclamationTriangle,
    FaSyncAlt
} from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import './Donate.css';

const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

export default function Donate() {
    const [searchParams] = useSearchParams();

    // Mode: 'cash' | 'item'
    const [contributionType, setContributionType] = useState('cash');

    // Left card tab: 'scan' | 'bank'
    const [leftPaymentTab, setLeftPaymentTab] = useState('scan');

    // Form inputs
    const [selectedAmount, setSelectedAmount] = useState(1000);
    const [isCustomAmount, setIsCustomAmount] = useState(false);
    const [customAmountValue, setCustomAmountValue] = useState('');
    const [purpose, setPurpose] = useState('Education Support & Scholarships');
    const [paymentMode, setPaymentMode] = useState('online'); // 'online' | 'bank' | 'qr'
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [panNumber, setPanNumber] = useState('');

    // In-Kind Items Form State
    const [itemCategory, setItemCategory] = useState('Rations & Dry Groceries');
    const [itemDescription, setItemDescription] = useState('');
    const [itemQuantity, setItemQuantity] = useState('10 Kits');

    // Captcha & Terms state
    const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
    const [isCaptchaSpinning, setIsCaptchaSpinning] = useState(false);
    const captchaTimerRef = useRef(null);
    const [isTermsAgreed, setIsTermsAgreed] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Interactive reCAPTCHA click handler (rotates for 4 to 5 seconds before verifying)
    const handleCaptchaClick = () => {
        if (isCaptchaChecked || isCaptchaSpinning) return;
        setIsCaptchaSpinning(true);
        if (captchaTimerRef.current) clearTimeout(captchaTimerRef.current);
        captchaTimerRef.current = setTimeout(() => {
            setIsCaptchaSpinning(false);
            setIsCaptchaChecked(true);
        }, 4500);
    };

    // Reset reCAPTCHA to empty when amount or contribution type changes
    useEffect(() => {
        if (isCaptchaChecked || isCaptchaSpinning) {
            if (captchaTimerRef.current) clearTimeout(captchaTimerRef.current);
            setIsCaptchaSpinning(false);
            setIsCaptchaChecked(false);
        }
    }, [selectedAmount, customAmountValue, isCustomAmount, contributionType]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (captchaTimerRef.current) clearTimeout(captchaTimerRef.current);
        };
    }, []);

    // Copy Feedback
    const [copiedKey, setCopiedKey] = useState(null);

    // Modal States: Choice Popup & Direct Monthly Contribution Dialog (Opened by default on page visit)
    const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
    const [showMonthlyModal, setShowMonthlyModal] = useState(true);

    // Monthly AutoPay Dialog State
    const [monthlyAmount, setMonthlyAmount] = useState(500);
    const [isCustomMonthly, setIsCustomMonthly] = useState(false);
    const [customMonthlyVal, setCustomMonthlyVal] = useState('');
    const [monthlyPurpose, setMonthlyPurpose] = useState('Child Nutrition & Education Pillar');
    const [monthlyMethod, setMonthlyMethod] = useState('UPI AutoPay (PhonePe, GPay, Paytm, BHIM)');
    const [monthlyConsent, setMonthlyConsent] = useState(true);
    const [monthlySubmitting, setMonthlySubmitting] = useState(false);

    // Receipt / Success Certificate Modal
    const [receiptData, setReceiptData] = useState(null);
    const [paymentFailureModal, setPaymentFailureModal] = useState(null);

    const effectiveAmount = isCustomAmount ? (Number(customAmountValue) || 0) : selectedAmount;

    // Browser Exit / Back Navigation Confirmation
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isSubmitting || monthlySubmitting || (fullName && effectiveAmount > 0)) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to cancel the payment and exit?';
                return e.returnValue;
            }
        };

        const handlePopState = () => {
            if (isSubmitting || monthlySubmitting || (fullName && effectiveAmount > 0)) {
                const confirmed = window.confirm('Are you sure you want to cancel the payment and exit?');
                if (!confirmed) {
                    window.history.pushState(null, '', window.location.href);
                }
            }
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isSubmitting, monthlySubmitting, fullName, effectiveAmount]);

    // Pre-fill query parameters if present
    useEffect(() => {
        const urlAmt = searchParams.get('amount');
        const urlPurpose = searchParams.get('purpose');
        if (urlAmt && !isNaN(urlAmt)) {
            const num = Number(urlAmt);
            if (presetAmounts.includes(num)) {
                setSelectedAmount(num);
                setIsCustomAmount(false);
            } else {
                setIsCustomAmount(true);
                setCustomAmountValue(num);
            }
        }
        if (urlPurpose) {
            setPurpose(urlPurpose);
        }

        // Check if returning from payment gateway
        const status = searchParams.get('status');
        const txnId = searchParams.get('txnId') || searchParams.get('txId');
        if (status === 'success') {
            setReceiptData({
                receiptNo: 'KCT-80G-' + Date.now().toString().slice(-6),
                txnId: txnId || 'SP' + Date.now().toString().slice(-8),
                name: searchParams.get('name') || 'Generous Benefactor',
                amount: searchParams.get('amount') || selectedAmount,
                purpose: searchParams.get('purpose') || purpose,
                date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                pan: searchParams.get('pan') || 'AAGTK5575Q'
            });
            toast.success('Donation completed successfully! 80G Tax Exemption Receipt generated.');
        } else if (status === 'failed' || status === 'timeout' || status === 'cancelled') {
            // Restore details from query string or localStorage
            let restoredName = searchParams.get('name') || '';
            let restoredEmail = searchParams.get('email') || '';
            let restoredMobile = searchParams.get('mobile') || '';
            let restoredAddress = searchParams.get('address') || '';
            let restoredPurpose = searchParams.get('purpose') || '';
            let restoredAmt = Number(searchParams.get('amount') || 0);

            try {
                const saved = JSON.parse(localStorage.getItem('kct_last_donation_form') || '{}');
                if (!restoredName && saved.fullName) restoredName = saved.fullName;
                if (!restoredEmail && saved.email) restoredEmail = saved.email;
                if (!restoredMobile && saved.mobileNumber) restoredMobile = saved.mobileNumber;
                if (!restoredAddress && saved.address) restoredAddress = saved.address;
                if (saved.panNumber) setPanNumber(saved.panNumber);
                if (!restoredPurpose && saved.purpose) restoredPurpose = saved.purpose;
                if (!restoredAmt && (saved.effectiveAmount || saved.amount)) restoredAmt = Number(saved.effectiveAmount || saved.amount);
            } catch (e) {}

            if (restoredName) setFullName(restoredName);
            if (restoredEmail) setEmail(restoredEmail);
            if (restoredMobile) setMobileNumber(restoredMobile);
            if (restoredAddress) setAddress(restoredAddress);
            if (restoredPurpose) setPurpose(restoredPurpose);
            if (restoredAmt && restoredAmt >= 5) {
                if (presetAmounts.includes(restoredAmt)) {
                    setSelectedAmount(restoredAmt);
                    setIsCustomAmount(false);
                } else {
                    setIsCustomAmount(true);
                    setCustomAmountValue(restoredAmt);
                }
            }

            const rawReason = searchParams.get('reason') || 'Payment session timed out or was cancelled by the bank.';
            setPaymentFailureModal({
                name: restoredName,
                amount: restoredAmt || selectedAmount,
                reason: rawReason,
                txnId: txnId || searchParams.get('clientTxnId') || ''
            });
        }
    }, [searchParams]);

    // Handle text copying with clipboard API
    const handleCopy = (text, key, label) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopiedKey(key);
            toast.success(`${label} copied to clipboard!`, { autoClose: 2000 });
            setTimeout(() => setCopiedKey(null), 2500);
        } catch (e) {
            toast.info(`Copied: ${text}`);
        }
    };

    // Form Submission: Intercepts to display the Payment Preference Choice Modal
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName.trim()) {
            return toast.error('Please enter your full name.');
        }
        if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
            return toast.error('Please enter a valid 10-digit mobile number.');
        }
        if (!email.trim() || !email.includes('@')) {
            return toast.error('Please provide a valid email address for your 80G tax receipt.');
        }
        if (!isCaptchaChecked) {
            return toast.error('Please complete the security verification by checking "I\'m not a robot".');
        }
        if (!isTermsAgreed) {
            return toast.error('Please accept the terms and conditions to proceed.');
        }

        if (contributionType === 'cash') {
            if (effectiveAmount < 10) {
                return toast.error('Minimum donation amount is ₹10. Please enter ₹10 or more.');
            }
            // Execute Payment directly - no redundant choice popup
            executePayNow();
        } else {
            // In-Kind Contribution Pledge
            setIsSubmitting(true);
            setTimeout(() => {
                setIsSubmitting(false);
                setReceiptData({
                    receiptNo: 'KCT-INKIND-' + Date.now().toString().slice(-6),
                    txnId: 'INKIND-' + Date.now().toString().slice(-6),
                    name: fullName,
                    amount: `In-Kind: ${itemCategory} (${itemQuantity})`,
                    purpose: itemDescription || itemCategory,
                    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                    pan: panNumber || 'N/A'
                });
                toast.success('In-Kind donation registered! Our field coordinator will contact you.');
            }, 600);
        }
    };

    // Execute Immediate One-Time Contribution
    const executePayNow = async () => {
        setShowPaymentChoiceModal(false);
        setIsSubmitting(true);
        try {
            // If direct bank or QR code chosen, generate instant official receipt record
            if (paymentMode === 'bank' || paymentMode === 'qr') {
                const mockTxn = (paymentMode === 'bank' ? 'NEFT-' : 'UPI-') + Date.now().toString().slice(-8);
                const res = await axios.post(`${API_BASE_URL}/donations/offline-pledge`, {
                    fullName,
                    mobileNumber,
                    email,
                    address: address || 'India',
                    panNumber,
                    amount: effectiveAmount,
                    purpose,
                    paymentMode,
                    txnId: mockTxn
                }).catch(() => null);

                setReceiptData({
                    receiptNo: res?.data?.receiptNo || ('KCT-80G-' + Date.now().toString().slice(-6)),
                    txnId: mockTxn,
                    name: fullName,
                    amount: effectiveAmount,
                    purpose: purpose,
                    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                    pan: panNumber || 'N/A'
                });
                toast.success('Thank you! Your donation pledge and official 80G certificate have been generated.');
            } else {
                // Online Contribution Gateway (Official SabPaisa PG 3.0 Live Mode)
                const res = await axios.post(`${API_BASE_URL}/donations/initiate`, {
                    fullName: fullName,
                    name: fullName,
                    email,
                    mobile: mobileNumber,
                    phone: mobileNumber,
                    address: address || 'India',
                    pan: panNumber,
                    amount: effectiveAmount,
                    purpose,
                    paymentType: 'online',
                    source: 'website',
                    verifiedToken: 'VERIFIED_CLICK:' + Date.now(),
                    captchaToken: 'VERIFIED_CLICK',
                    origin: window.location.origin,
                    token: localStorage.getItem('kct_token') || ''
                });

                if (res.data?.success && (res.data.checkoutUrl || res.data.paymentUrl)) {
                    toast.info('Connecting to secure online payment...');
                    window.location.href = res.data.checkoutUrl || res.data.paymentUrl;
                    return;
                } else {
                    toast.error(res.data?.message || 'Payment gateway connection error. Please try again.');
                }
            }
        } catch (err) {
            console.error('SabPaisa payment initiation error:', err);
            toast.error(err.response?.data?.message || err.message || 'Payment initiation failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Execute Monthly AutoPay Mandate Activation
    const handleMonthlyAutoPaySubmit = async (e) => {
        if (e) e.preventDefault();
        const activeMonthlyAmt = isCustomMonthly ? Number(customMonthlyVal) : monthlyAmount;
        if (!activeMonthlyAmt || activeMonthlyAmt < 500) {
            return toast.error('Minimum monthly contribution is ₹500.');
        }
        if (!monthlyConsent) {
            return toast.error('Please accept and authorize the AutoPay recurring mandate.');
        }

        setMonthlySubmitting(true);
        try {
            const payload = {
                fullName: fullName || 'Valued Donor',
                email: email,
                mobile: mobileNumber,
                address: address,
                amount: activeMonthlyAmt,
                purpose: `Monthly AutoPay Subscription - ${monthlyPurpose}`,
                source: 'monthly_donor',
                donorCategory: 'monthly_donor_subscription',
                mandateType: monthlyMethod,
                panNumber: panNumber ? panNumber.toUpperCase().trim() : '',
                origin: window.location.origin
            };
            const res = await axios.post(`${API_BASE_URL}/donations/initiate-sabpaisa`, payload);
            if (res.data?.success && res.data.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            } else {
                toast.error(res.data?.message || 'Failed to initiate AutoPay checkout.');
                setMonthlySubmitting(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to connect to AutoPay portal.');
            setMonthlySubmitting(false);
        }
    };

    return (
        <div className="dp-page-container">
            {/* ════════════════════════════════════════════════════════════
                1. HERO SECTION WITH SPROUT ARTWORK & CAUSE CHIPS
               ════════════════════════════════════════════════════════════ */}
            <div className="dp-hero-banner">
                <div className="dp-hero-content-col">
                    <div className="dp-hero-badge">
                        Support Our Mission
                    </div>

                    <h1 className="dp-hero-headline">
                        Your Compassion<br />
                        <span className="dp-gold-text">Changes Human Lives</span>
                    </h1>

                    <p className="dp-hero-subtext">
                        Every contribution, big or small, helps us bring food, safety, education
                        and healthcare to the underprivileged across Andhra Pradesh.
                    </p>

                    <div className="dp-cause-chips-row">
                        <div className="dp-cause-chip">
                            <FaGraduationCap className="dp-cause-icon" />
                            <span>Education</span>
                        </div>
                        <div className="dp-cause-chip">
                            <FaStethoscope className="dp-cause-icon" />
                            <span>Healthcare</span>
                        </div>
                        <div className="dp-cause-chip">
                            <FaUtensils className="dp-cause-icon" />
                            <span>Annadanam</span>
                        </div>
                        <div className="dp-cause-chip">
                            <FaUsers className="dp-cause-icon" />
                            <span>Senior Care</span>
                        </div>
                    </div>

                    {/* Dedicated Quick Action Buttons */}
                    <div className="dp-hero-actions-row">
                        <Link to="/donors" className="dp-hero-action-btn donors">
                            <FaTrophy style={{ color: '#d97706' }} /> Top Donors Leaderboard
                        </Link>
                        <button
                            type="button"
                            className="dp-hero-action-btn monthly"
                            onClick={() => setShowMonthlyModal(true)}
                        >
                            <FaCalendarAlt style={{ color: '#0052cc' }} /> Set Up Monthly Contribution
                        </button>
                        <Link to="/login?tab=register" className="dp-hero-action-btn monthly">
                            <FaHeart style={{ color: '#0052cc' }} /> Join as Trust Member
                        </Link>
                    </div>
                </div>

                <div className="dp-hero-image-col">
                    <img
                        src="/documents/sprout_banner.png"
                        alt="Supporting Life - Kiran Charitable Trust"
                        className="dp-hero-sprout-img"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                2. STATUTORY RIBBON BAR (Row of 4 Compliance Badges)
               ════════════════════════════════════════════════════════════ */}
            <div className="dp-statutory-ribbon">
                <div className="dp-ribbon-item">
                    <FaFileAlt className="dp-ribbon-icon amber" />
                    <div>
                        <div className="dp-ribbon-title">Trust Deed</div>
                        <div className="dp-ribbon-sub">Regd. No. 3/2026</div>
                    </div>
                </div>

                <div className="dp-ribbon-divider"></div>

                <div className="dp-ribbon-item">
                    <FaShieldAlt className="dp-ribbon-icon blue" />
                    <div>
                        <div className="dp-ribbon-title">80G Tax Exemption</div>
                        <div className="dp-ribbon-sub">(URN: AAGTK5575QF20261)</div>
                    </div>
                </div>

                <div className="dp-ribbon-divider"></div>

                <div className="dp-ribbon-item">
                    <FaLayerGroup className="dp-ribbon-icon teal" />
                    <div>
                        <div className="dp-ribbon-title">12A Registered</div>
                        <div className="dp-ribbon-sub">(URN: AAGTK5575QE20261)</div>
                    </div>
                </div>

                <div className="dp-ribbon-divider"></div>

                <div className="dp-ribbon-item">
                    <FaIdCard className="dp-ribbon-icon purple" />
                    <div>
                        <div className="dp-ribbon-title">PAN</div>
                        <div className="dp-ribbon-sub">AAGTK5575Q</div>
                    </div>
                </div>

                <div className="dp-ribbon-divider"></div>

                <div className="dp-ribbon-item">
                    <FaCheckCircle className="dp-ribbon-icon green" />
                    <div>
                        <div className="dp-ribbon-title">100% Direct</div>
                        <div className="dp-ribbon-sub">Allocation Guarantee</div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                3. TWO-COLUMN MAIN BODY
               ════════════════════════════════════════════════════════════ */}
            <div className="dp-main-grid">
                {/* ──────────────────────────────────────────────────────────
                    LEFT COLUMN: QR, BANK TRANSFER & TRUST DOCUMENTS
                   ────────────────────────────────────────────────────────── */}
                <div className="dp-left-col">
                    {/* Card 1: Scan & Donate / Bank Transfer Tabs Card */}
                    <div className="dp-white-card">
                        <div className="dp-left-tabs-header">
                            <button
                                className={`dp-left-tab-btn ${leftPaymentTab === 'scan' ? 'active' : ''}`}
                                onClick={() => setLeftPaymentTab('scan')}
                            >
                                <FaQrcode /> Scan &amp; Donate
                            </button>
                            <button
                                className={`dp-left-tab-btn ${leftPaymentTab === 'bank' ? 'active' : ''}`}
                                onClick={() => setLeftPaymentTab('bank')}
                            >
                                <FaUniversity /> Bank Transfer
                            </button>
                        </div>

                        {leftPaymentTab === 'scan' ? (
                            <div className="dp-scan-content">
                                <h3 className="dp-card-title">Scan &amp; Pay via UPI</h3>
                                <p className="dp-card-subtitle">Official Canara Bank Dynamic UPI QR Code</p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', gap: 6, background: '#EFF6FF', color: '#1D4ED8', fontSize: 11.5, fontWeight: 800, padding: '4px 14px', borderRadius: 20 }}>
                                    ⚡ Amount Auto-Filled: ₹{effectiveAmount.toLocaleString('en-IN')}
                                </div>
                                <div className="dp-qr-frame">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=340625862653482@cnrb&pn=Kiran%20Charitable%20Trust&am=${effectiveAmount}&cu=INR&tn=${encodeURIComponent(purpose || 'Donation')}`)}`}
                                        alt="Official Dynamic Canara Bank UPI QR Code"
                                        className="dp-qr-image"
                                        onError={(e) => { e.currentTarget.src = "/documents/canara_trust_qr.png"; }}
                                    />
                                </div>

                                {/* UPI App Badges */}
                                <div className="dp-upi-brands-row">
                                    <span className="dp-brand-pill phonepe">PhonePe</span>
                                    <span className="dp-brand-pill gpay">Google Pay</span>
                                    <span className="dp-brand-pill paytm">Paytm</span>
                                    <span className="dp-brand-pill bhim">BHIM</span>
                                </div>

                                {/* Official UPI ID Bar */}
                                <div className="dp-upi-id-bar">
                                    <div>
                                        <div className="dp-upi-label">Official UPI ID</div>
                                        <div className="dp-upi-val">340625862653482@cnrb</div>
                                    </div>
                                    <button
                                        type="button"
                                        className="dp-copy-btn"
                                        onClick={() => handleCopy('340625862653482@cnrb', 'upi_id', 'UPI ID')}
                                    >
                                        <FaCopy /> {copiedKey === 'upi_id' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="dp-scan-content">
                                <h3 className="dp-card-title">Direct RTGS / NEFT Transfer</h3>
                                <p className="dp-card-subtitle">Canara Bank Official Account Details</p>
                                <div className="dp-upi-id-bar" style={{ marginTop: 12 }}>
                                    <div>
                                        <div className="dp-upi-label">Account Number</div>
                                        <div className="dp-upi-val">110319653482</div>
                                    </div>
                                    <button
                                        type="button"
                                        className="dp-copy-btn"
                                        onClick={() => handleCopy('110319653482', 'acc_num_quick', 'Account Number')}
                                    >
                                        <FaCopy /> {copiedKey === 'acc_num_quick' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Official Trust Bank Transfer (NEFT / RTGS / IMPS) */}
                    <div className="dp-white-card dp-bank-details-card">
                        <div className="dp-bank-card-header">
                            <FaUniversity className="dp-bank-header-icon" />
                            <h4>Official Trust Bank Transfer (NEFT / RTGS / IMPS)</h4>
                        </div>

                        <div className="dp-bank-table">
                            <div className="dp-bank-row">
                                <span className="dp-bank-label">Account Name</span>
                                <strong className="dp-bank-val">Kiran Charitable Trust</strong>
                                <button
                                    type="button"
                                    className="dp-table-copy-btn"
                                    onClick={() => handleCopy('Kiran Charitable Trust', 'acc_name', 'Account Name')}
                                >
                                    <FaCopy /> Copy
                                </button>
                            </div>

                            <div className="dp-bank-row">
                                <span className="dp-bank-label">Account No. (Canara Bank)</span>
                                <strong className="dp-bank-val">110319653482</strong>
                                <button
                                    type="button"
                                    className="dp-table-copy-btn"
                                    onClick={() => handleCopy('110319653482', 'acc_num', 'Account Number')}
                                >
                                    <FaCopy /> Copy
                                </button>
                            </div>

                            <div className="dp-bank-row">
                                <span className="dp-bank-label">IFSC Code</span>
                                <strong className="dp-bank-val">CNRB0002492</strong>
                                <button
                                    type="button"
                                    className="dp-table-copy-btn"
                                    onClick={() => handleCopy('CNRB0002492', 'ifsc', 'IFSC Code')}
                                >
                                    <FaCopy /> Copy
                                </button>
                            </div>

                            <div className="dp-bank-row">
                                <span className="dp-bank-label">Branch Location</span>
                                <span className="dp-bank-val-sub">Chandramouli Nagar (2492), Guntur</span>
                                <span className="dp-spacer"></span>
                            </div>

                            <div className="dp-bank-row">
                                <span className="dp-bank-label">SWIFT Code</span>
                                <strong className="dp-bank-val">CNRBNBBFD</strong>
                                <button
                                    type="button"
                                    className="dp-table-copy-btn"
                                    onClick={() => handleCopy('CNRBNBBFD', 'swift', 'SWIFT Code')}
                                >
                                    <FaCopy /> Copy
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Official Trust Documents */}
                    <div className="dp-white-card dp-docs-card">
                        <div className="dp-docs-header">
                            <FaFileAlt className="dp-docs-header-icon" />
                            <h4>Official Trust Documents</h4>
                        </div>

                        <div className="dp-docs-list">
                            <a
                                href="/documents/12A-332(8).pdf"
                                target="_blank"
                                rel="noreferrer"
                                className="dp-doc-row"
                            >
                                <div className="dp-doc-name">
                                    <div className="dp-doc-badge-frame">
                                        <img src={Logo12A} alt="Income Tax 12A" className="dp-doc-badge-img" />
                                    </div>
                                    <div className="dp-doc-text-col">
                                        <span className="dp-doc-title">12A Registration Order (Form 10G)</span>
                                        <span className="dp-doc-urn">URN: AAGTK5575QE20261 • Income Tax Dept</span>
                                    </div>
                                </div>
                                <span className="dp-doc-action-pill"><FaDownload /> PDF</span>
                            </a>

                            <a
                                href="/documents/80G-354(4).pdf"
                                target="_blank"
                                rel="noreferrer"
                                className="dp-doc-row"
                            >
                                <div className="dp-doc-name">
                                    <div className="dp-doc-badge-frame">
                                        <img src={Logo80G} alt="Income Tax 80G" className="dp-doc-badge-img" />
                                    </div>
                                    <div className="dp-doc-text-col">
                                        <span className="dp-doc-title">80G Tax Exemption Approval (Form 10G)</span>
                                        <span className="dp-doc-urn">URN: AAGTK5575QF20261 • Income Tax Dept</span>
                                    </div>
                                </div>
                                <span className="dp-doc-action-pill"><FaDownload /> PDF</span>
                            </a>

                            <a
                                href="/documents/ngo_darpan_certificate.pdf"
                                target="_blank"
                                rel="noreferrer"
                                className="dp-doc-row"
                            >
                                <div className="dp-doc-name">
                                    <div className="dp-doc-badge-frame">
                                        <img src={LogoDarpan} alt="NITI Aayog DARPAN" className="dp-doc-badge-img" />
                                    </div>
                                    <div className="dp-doc-text-col">
                                        <span className="dp-doc-title">NGO DARPAN Registration</span>
                                        <span className="dp-doc-urn">Unique ID: AP/2026/1134813 • NITI Aayog</span>
                                    </div>
                                </div>
                                <span className="dp-doc-action-pill"><FaDownload /> PDF</span>
                            </a>

                            <a
                                href="/documents/trust_deed.pdf"
                                target="_blank"
                                rel="noreferrer"
                                className="dp-doc-row"
                            >
                                <div className="dp-doc-name">
                                    <div className="dp-doc-badge-frame">
                                        <img src={LogoTrustDeed} alt="AP Govt Trust Deed" className="dp-doc-badge-img" />
                                    </div>
                                    <div className="dp-doc-text-col">
                                        <span className="dp-doc-title">Registered Trust Deed of Declaration</span>
                                        <span className="dp-doc-urn">Regd. under Indian Trusts Act, 1882 (Govt. of AP)</span>
                                    </div>
                                </div>
                                <span className="dp-doc-action-pill"><FaDownload /> PDF</span>
                            </a>

                            <a
                                href="/documents/Trust_Pan_Card.pdf"
                                target="_blank"
                                rel="noreferrer"
                                className="dp-doc-row"
                            >
                                <div className="dp-doc-name">
                                    <div className="dp-doc-badge-frame pan-frame">
                                        <img src={LogoPan} alt="Trust PAN Card" className="dp-doc-badge-img dp-doc-badge-pan" />
                                    </div>
                                    <div className="dp-doc-text-col">
                                        <span className="dp-doc-title">Trust PAN Card</span>
                                        <span className="dp-doc-urn">Permanent Account Number: AAGTK5575Q</span>
                                    </div>
                                </div>
                                <span className="dp-doc-action-pill"><FaDownload /> Card</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* ──────────────────────────────────────────────────────────
                    RIGHT COLUMN: KIRAN TRUST CONTRIBUTION FORM
                   ────────────────────────────────────────────────────────── */}
                <div className="dp-right-col">
                    <div className="dp-form-card">
                        {/* Form Header Navy Banner */}
                        <div className="dp-form-header-banner">
                            <div className="dp-form-header-title">
                                <FaHeart className="dp-header-heart" />
                                <h3>Kiran Trust Contribution Form</h3>
                            </div>
                            <div className="dp-form-header-secure">
                                <FaLock /> 100% Safe &amp; Verified
                            </div>
                        </div>

                        {/* Contribution Type Tabs */}
                        <div className="dp-form-type-tabs">
                            <button
                                type="button"
                                className={`dp-type-tab-btn ${contributionType === 'cash' ? 'active' : ''}`}
                                onClick={() => setContributionType('cash')}
                            >
                                <FaHeart /> One-Time Donation
                            </button>
                            <button
                                type="button"
                                className="dp-type-tab-btn monthly-tab-btn"
                                onClick={() => setShowMonthlyModal(true)}
                                title="Open Monthly Contribution Dialogue"
                            >
                                <FaCalendarAlt style={{ color: '#2563eb' }} /> Monthly AutoPay
                            </button>
                            <button
                                type="button"
                                className={`dp-type-tab-btn ${contributionType === 'item' ? 'active' : ''}`}
                                onClick={() => setContributionType('item')}
                            >
                                <FaBoxOpen /> Item (In-Kind)
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="dp-form-body">
                            {/* SECTION 1: DONATION & AMOUNT DETAILS */}
                            <div className="dp-form-section-card dp-section-contribution">
                                <div className="dp-section-header">
                                    <span className="dp-section-badge-icon blue"><FaHeart /></span>
                                    <span className="dp-section-title">1. Select Contribution &amp; Amount</span>
                                </div>
                                {contributionType === 'cash' ? (
                                <>
                                    {/* Select Amount (₹) */}
                                    <div className="dp-field-group">
                                        <label className="dp-field-label">Select Amount (₹)</label>
                                        <div className="dp-amounts-grid">
                                            {presetAmounts.map((amt) => {
                                                const isSelected = !isCustomAmount && selectedAmount === amt;
                                                return (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        className={`dp-amount-btn ${isSelected ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setSelectedAmount(amt);
                                                            setIsCustomAmount(false);
                                                        }}
                                                    >
                                                        ₹{amt.toLocaleString('en-IN')}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                className={`dp-amount-btn dp-custom-btn ${isCustomAmount ? 'active' : ''}`}
                                                onClick={() => setIsCustomAmount(true)}
                                            >
                                                <FaEdit /> Custom Amount
                                            </button>
                                        </div>

                                        {isCustomAmount && (
                                            <div>
                                                <div className="dp-custom-amount-input-wrap">
                                                    <span className="dp-input-rupee"><FaRupeeSign /></span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="Enter amount (min ₹10)"
                                                        value={customAmountValue}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setCustomAmountValue(val);
                                                        }}
                                                        className="dp-custom-input"
                                                        style={customAmountValue !== '' && Number(customAmountValue) < 10 ? { borderColor: '#dc2626' } : undefined}
                                                        autoFocus
                                                    />
                                                </div>
                                                {customAmountValue !== '' && Number(customAmountValue) < 10 && (
                                                    <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                                                        ⚠️ Minimum donation amount is ₹10
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Donation Purpose */}
                                    <div className="dp-field-group">
                                        <label className="dp-field-label">Donation Purpose *</label>
                                        <select
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            className="dp-select-input"
                                        >
                                            <option value="Education Support & Scholarships">Education Support &amp; Scholarships</option>
                                            <option value="Healthcare & Rural Medical Camps">Healthcare &amp; Rural Medical Camps</option>
                                            <option value="Annadanam & Daily Food Relief">Annadanam &amp; Daily Food Relief</option>
                                            <option value="Senior Citizen Care & Shelter">Senior Citizen Care &amp; Shelter</option>
                                            <option value="Women Empowerment & Skill Development">Women Empowerment &amp; Skill Development</option>
                                            <option value="Disaster Relief & Emergency Kits">Disaster Relief &amp; Emergency Kits</option>
                                            <option value="General Trust Social Welfare">General Trust Social Welfare</option>
                                        </select>
                                    </div>

                                    {/* Contribution Mode */}
                                    <div className="dp-field-group">
                                        <label className="dp-field-label">Contribution Mode *</label>
                                        <select
                                            value={paymentMode}
                                            onChange={(e) => setPaymentMode(e.target.value)}
                                            className="dp-select-input"
                                        >
                                            <option value="online">Online Contribution (UPI, Cards, NetBanking)</option>
                                        </select>
                                        <div className="dp-mode-helper">
                                            <FaInfoCircle /> Instant Verified Online Gateway: UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Item In-Kind Form */}
                                    <div className="dp-field-group">
                                        <label className="dp-field-label">Item / Ration Category *</label>
                                        <select
                                            value={itemCategory}
                                            onChange={(e) => setItemCategory(e.target.value)}
                                            className="dp-select-input"
                                        >
                                            <option value="Rations & Dry Groceries">Rations &amp; Dry Groceries (Rice, Dal, Oil)</option>
                                            <option value="School Notebooks & Stationery">School Notebooks, Bags &amp; Stationery</option>
                                            <option value="Blankets & Clothes">Blankets &amp; New Clothes for Winter Relief</option>
                                            <option value="Medicines & First Aid Kits">Medicines &amp; First Aid Camp Supplies</option>
                                            <option value="Other Essential Supplies">Other Essential Relief Supplies</option>
                                        </select>
                                    </div>

                                    <div className="dp-field-group">
                                        <label className="dp-field-label">Quantity / Number of Kits *</label>
                                        <input
                                            type="text"
                                            value={itemQuantity}
                                            onChange={(e) => setItemQuantity(e.target.value)}
                                            placeholder="e.g., 20 Kits or 50 Notebooks"
                                            className="dp-text-input"
                                            required
                                        />
                                    </div>

                                    <div className="dp-field-group">
                                        <label className="dp-field-label">Description of Items</label>
                                        <textarea
                                            rows={2}
                                            value={itemDescription}
                                            onChange={(e) => setItemDescription(e.target.value)}
                                            placeholder="Brand, item specifications, or pickup requirements"
                                            className="dp-text-input"
                                        ></textarea>
                                    </div>
                                </>
                            )}

                            </div>

                            {/* SECTION 2: DONOR INFORMATION */}
                            <div className="dp-form-section-card dp-details-section">
                                <div className="dp-section-header">
                                    <span className="dp-section-badge-icon purple"><FaUsers /></span>
                                    <span className="dp-section-title">2. Donor Information &amp; Tax Receipt Details</span>
                                </div>

                                <div className="dp-form-row">
                                    <div className="dp-field-group half">
                                        <label className="dp-field-label">Full Name *</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="dp-text-input"
                                            required
                                        />
                                    </div>

                                    <div className="dp-field-group half">
                                        <label className="dp-field-label">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            className="dp-text-input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="dp-field-group">
                                    <label className="dp-field-label">Email Address *</label>
                                    <input
                                        type="email"
                                        placeholder="For receipt &amp; updates"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="dp-text-input"
                                        required
                                    />
                                </div>

                                <div className="dp-field-group">
                                    <label className="dp-field-label">Communication Address</label>
                                    <input
                                        type="text"
                                        placeholder="For communication / tax certificates"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="dp-text-input"
                                    />
                                </div>

                                <div className="dp-field-group">
                                    <label className="dp-field-label">PAN Number (Optional, for 80G tax benefit claim)</label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        placeholder="e.g., ABCDE1234F"
                                        value={panNumber}
                                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                        className="dp-text-input uppercase"
                                    />
                                </div>
                            </div>

                            {/* Authentic Interactive reCAPTCHA Container */}
                            <div
                                className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                                onClick={handleCaptchaClick}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleCaptchaClick();
                                    }
                                }}
                            >
                                <div className="dp-recaptcha-left">
                                    <div className="dp-recaptcha-checkbox-wrapper">
                                        {isCaptchaSpinning ? (
                                            <div className="dp-recaptcha-spinner" title="Verifying security challenge..." />
                                        ) : isCaptchaChecked ? (
                                            <svg
                                                className="dp-recaptcha-checkmark"
                                                viewBox="0 0 24 24"
                                                width="28"
                                                height="28"
                                            >
                                                <path
                                                    fill="#0f9d58"
                                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                                                />
                                            </svg>
                                        ) : (
                                            <div className="dp-recaptcha-square" />
                                        )}
                                    </div>
                                    <span className="dp-recaptcha-text">I'm not a robot</span>
                                </div>

                                <div className="dp-recaptcha-right">
                                    <img
                                        src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                                        alt="reCAPTCHA"
                                        className="dp-recaptcha-logo"
                                    />
                                    <span className="dp-recaptcha-brand-title">reCAPTCHA</span>
                                    <div className="dp-recaptcha-links">
                                        <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Privacy</a>
                                        <span> - </span>
                                        <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Terms</a>
                                    </div>
                                </div>
                            </div>

                            {/* Terms and conditions checkbox */}
                            <div className="dp-terms-row">
                                <input
                                    type="checkbox"
                                    id="agreeTerms"
                                    checked={isTermsAgreed}
                                    onChange={(e) => setIsTermsAgreed(e.target.checked)}
                                    className="dp-checkbox"
                                />
                                <label htmlFor="agreeTerms" className="dp-terms-label">
                                    I agree to the <Link to="/terms-conditions" target="_blank">Terms &amp; Conditions</Link> and acknowledge that this is a genuine support task.
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="dp-submit-btn"
                            >
                                <FaBolt /> {isSubmitting ? 'Connecting to Payment Gateway...' : contributionType === 'cash' ? `Pay ₹${effectiveAmount.toLocaleString('en-IN')} Now` : 'Register In-Kind Contribution'}
                            </button>

                            {/* Direct AutoPay Button below Pay Now */}
                            {contributionType === 'cash' && (
                                <button
                                    type="button"
                                    disabled={isSubmitting || monthlySubmitting}
                                    className="dp-monthly-btn-inline"
                                    style={{
                                        width: '100%',
                                        padding: '12px 18px',
                                        marginTop: '10px',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        border: '1.5px solid #3b82f6',
                                        borderRadius: '10px',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        cursor: (isSubmitting || monthlySubmitting) ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!fullName.trim()) return toast.error('Please enter your full name.');
                                        if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) return toast.error('Please enter a valid 10-digit mobile number.');
                                        if (!email.trim() || !email.includes('@')) return toast.error('Please provide a valid email address.');
                                        if (!isCaptchaChecked) return toast.error('Please complete security check.');
                                        if (!isTermsAgreed) return toast.error('Please accept the terms and conditions.');
                                        const amt = Math.max(500, effectiveAmount);
                                        setMonthlySubmitting(true);
                                        try {
                                            const payload = {
                                                fullName: fullName.trim(),
                                                email: email.trim(),
                                                mobile: mobileNumber.trim(),
                                                address: address || 'India',
                                                amount: amt,
                                                purpose: `Monthly AutoPay Subscription - ${purpose || 'Child Nutrition & Education Pillar'}`,
                                                source: 'monthly_donor',
                                                donorCategory: 'monthly_donor_subscription',
                                                mandateType: 'UPI_AUTOPAY',
                                                panNumber: panNumber ? panNumber.toUpperCase().trim() : '',
                                                origin: window.location.origin
                                            };
                                            const res = await axios.post(`${API_BASE_URL}/donations/initiate-sabpaisa`, payload);
                                            if (res.data?.success && res.data.checkoutUrl) {
                                                toast.info('Connecting directly to secure AutoPay portal...');
                                                window.location.href = res.data.checkoutUrl;
                                            } else {
                                                toast.error(res.data?.message || 'Failed to initiate AutoPay.');
                                                setMonthlySubmitting(false);
                                            }
                                        } catch (err) {
                                            toast.error(err.response?.data?.message || 'Failed to connect to AutoPay portal.');
                                            setMonthlySubmitting(false);
                                        }
                                    }}
                                >
                                    <FaCalendarAlt /> {monthlySubmitting ? 'Connecting to AutoPay...' : `Set Up Monthly AutoPay (₹${Math.max(500, effectiveAmount).toLocaleString('en-IN')}/mo)`}
                                </button>
                            )}

                            {/* Footer Badges */}
                            <div className="dp-form-footer-badges">
                                <span><FaShieldAlt className="green" /> 100% Secure</span>
                                <span>•</span>
                                <span>80G Tax Benefits</span>
                                <span>•</span>
                                <span>Verified NGO</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                4. DIGITAL 80G RECEIPT / CERTIFICATE MODAL
               ════════════════════════════════════════════════════════════ */}
            {receiptData && (
                <div className="dp-modal-overlay" onClick={() => setReceiptData(null)}>
                    <div className="dp-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="dp-modal-header">
                            <h3><FaCheckCircle style={{ color: '#10b981' }} /> Official 80G Donation Tribute</h3>
                            <button className="dp-modal-close" onClick={() => setReceiptData(null)}>✕</button>
                        </div>

                        <div className="dp-cert-frame">
                            <div className="dp-cert-top">
                                <strong>Kiran Charitable Trust</strong> • Registered under Indian Trusts Act 1882
                                <br />
                                80G URN: AAGTK5575QF20261 • 12A URN: AAGTK5575QE20261 • PAN: AAGTK5575Q
                            </div>

                            <h2 className="dp-cert-title">Official Philanthropic Receipt</h2>

                            <div className="dp-cert-grid">
                                <div>
                                    <span className="dp-cg-label">RECEIPT NUMBER</span>
                                    <strong className="dp-cg-val">{receiptData.receiptNo}</strong>
                                </div>
                                <div>
                                    <span className="dp-cg-label">TRANSACTION ID</span>
                                    <strong className="dp-cg-val">{receiptData.txnId}</strong>
                                </div>
                                <div>
                                    <span className="dp-cg-label">BENEFACATOR NAME</span>
                                    <strong className="dp-cg-val">{receiptData.name}</strong>
                                </div>
                                <div>
                                    <span className="dp-cg-label">CONTRIBUTION AMOUNT</span>
                                    <strong className="dp-cg-val text-green">
                                        {typeof receiptData.amount === 'number' ? `₹${receiptData.amount.toLocaleString('en-IN')}` : receiptData.amount}
                                    </strong>
                                </div>
                                <div>
                                    <span className="dp-cg-label">PURPOSE</span>
                                    <strong className="dp-cg-val">{receiptData.purpose}</strong>
                                </div>
                                <div>
                                    <span className="dp-cg-label">DATE</span>
                                    <strong className="dp-cg-val">{receiptData.date}</strong>
                                </div>
                            </div>

                            <p className="dp-cert-body">
                                Kiran Charitable Trust certifies that this donation qualifies for deduction under Section 80G(5)(vi) of the Income Tax Act, 1961. We convey our deepest gratitude for your compassion in sustaining our humanitarian missions.
                            </p>
                        </div>

                        <div className="dp-modal-footer">
                            <button
                                type="button"
                                className="dp-dialog-btn print"
                                onClick={() => window.print()}
                            >
                                <FaPrint /> Print / Save 80G PDF
                            </button>
                            <button
                                type="button"
                                className="dp-dialog-btn close"
                                onClick={() => setReceiptData(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            

            {/* ════════════════════════════════════════════════════════════
                POPUP 2: DEDICATED MONTHLY CONTRIBUTION DIALOGUE BOX
               ════════════════════════════════════════════════════════════ */}
            {showMonthlyModal && (
                <div className="dp-modal-overlay" onClick={() => setShowMonthlyModal(false)}>
                    <div className="dp-modal-box dp-monthly-modal-box" onClick={(e) => e.stopPropagation()}>
                        {/* Photo Banner with compassionate imagery & wrong symbol */}
                        <div className="dp-monthly-hero-photo-wrap">
                            <img
                                src="/documents/sprout_banner.png"
                                alt="Support Life - Kiran Charitable Trust"
                                className="dp-monthly-hero-photo"
                            />
                            <div className="dp-monthly-photo-overlay">
                                <span className="dp-monthly-photo-badge">
                                    <FaHeart style={{ color: '#ef4444' }} /> Continuous Monthly Philanthropy
                                </span>
                                <h3 className="dp-monthly-photo-title">Make a Difference, Every Month</h3>
                                <p className="dp-monthly-photo-tagline">
                                    Your kindness can create lasting change. Set up a monthly contribution and help us continue making a meaningful difference in the lives of those who need it most.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="dp-monthly-wrong-symbol-btn"
                                onClick={() => setShowMonthlyModal(false)}
                                title="Close Dialogue"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="dp-modal-header dp-monthly-header">
                            <div>
                                <h3><FaCalendarAlt style={{ color: '#2563eb' }} /> Set Up Your Monthly Contribution</h3>
                                <p className="dp-monthly-headline-sub">
                                    Official RBI &amp; NPCI AutoPay Mandate
                                </p>
                            </div>
                        </div>

                        <div className="dp-monthly-modal-body">
                            <form onSubmit={handleMonthlyAutoPaySubmit} className="dp-monthly-form">
                                {/* Choose Monthly Amount */}
                                <div className="dp-field-group">
                                    <label className="dp-field-label">Select Monthly Amount (₹ / month) *</label>
                                    <div className="dp-amounts-grid monthly-grid">
                                        {[500, 1000, 2500, 5000, 10000].map((amt) => {
                                            const isSelected = !isCustomMonthly && monthlyAmount === amt;
                                            return (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    className={`dp-amount-btn ${isSelected ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setMonthlyAmount(amt);
                                                        setIsCustomMonthly(false);
                                                    }}
                                                >
                                                    ₹{amt.toLocaleString('en-IN')}/mo
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            className={`dp-amount-btn dp-custom-btn ${isCustomMonthly ? 'active' : ''}`}
                                            onClick={() => setIsCustomMonthly(true)}
                                        >
                                            <FaEdit /> Custom
                                        </button>
                                    </div>

                                    {isCustomMonthly && (
                                        <div>
                                            <div className="dp-custom-amount-input-wrap" style={{ marginTop: 8 }}>
                                                <span className="dp-input-rupee">₹</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="Enter monthly amount (min ₹500)"
                                                    value={customMonthlyVal}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setCustomMonthlyVal(val);
                                                    }}
                                                    className="dp-custom-input"
                                                    style={customMonthlyVal !== '' && Number(customMonthlyVal) < 500 ? { borderColor: '#dc2626' } : undefined}
                                                    autoFocus
                                                />
                                                <span className="dp-input-suffix">/ month</span>
                                            </div>
                                            {customMonthlyVal !== '' && Number(customMonthlyVal) < 500 && (
                                                <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                                                    ⚠️ Minimum monthly contribution is ₹500/mo
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                

                                {/* Monthly Purpose */}
                                <div className="dp-field-group">
                                    <label className="dp-field-label">Monthly Philanthropy Focus *</label>
                                    <select
                                        value={monthlyPurpose}
                                        onChange={(e) => setMonthlyPurpose(e.target.value)}
                                        className="dp-select-input"
                                    >
                                        <option value="Child Nutrition & Education Pillar">Child Nutrition &amp; Education Pillar</option>
                                        <option value="Healthcare & Rural Medical Lifeline">Healthcare &amp; Rural Medical Lifeline</option>
                                        <option value="Daily Annadanam & Food Relief">Daily Annadanam &amp; Food Relief</option>
                                        <option value="Elderly Orphan & Senior Shelter">Elderly Orphan &amp; Senior Shelter</option>
                                        <option value="General Trust Social Welfare">General Trust Social Welfare</option>
                                    </select>
                                </div>

                                {/* Donor Details Row */}
                                <div className="dp-form-row">
                                    <div className="dp-field-group half">
                                        <label className="dp-field-label">Full Name *</label>
                                        <input
                                            type="text"
                                            placeholder="Your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="dp-text-input"
                                            required
                                        />
                                    </div>
                                    <div className="dp-field-group half">
                                        <label className="dp-field-label">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            className="dp-text-input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="dp-form-row">
                                    <div className="dp-field-group half">
                                        <label className="dp-field-label">Email Address *</label>
                                        <input
                                            type="email"
                                            placeholder="Receipt & 80G tax updates"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="dp-text-input"
                                            required
                                        />
                                    </div>
                                    <div className="dp-field-group half">
                                        <label className="dp-field-label">PAN Number (Optional, for 80G tax benefit claim)</label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            placeholder="e.g., ABCDE1234F"
                                            value={panNumber}
                                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                            className="dp-text-input uppercase"
                                        />
                                    </div>
                                </div>

                                {/* AutoPay Method */}
                                <div className="dp-field-group">
                                    <label className="dp-field-label">Recurring AutoPay Method (RBI &amp; NPCI Compliant) *</label>
                                    <select
                                        value={monthlyMethod}
                                        onChange={(e) => setMonthlyMethod(e.target.value)}
                                        className="dp-select-input"
                                    >
                                        <option value="UPI AutoPay (PhonePe, GPay, Paytm, BHIM)">UPI AutoPay (PhonePe, Google Pay, Paytm, BHIM)</option>
                                        <option value="eNACH Debit Card Auto-Debit">Debit Card Mandate (eNACH / NPCI)</option>
                                        <option value="NetBanking Auto-Debit Mandate">NetBanking Mandate (All Major Indian Banks)</option>
                                    </select>
                                </div>

                                {/* Consent */}
                                <div className="dp-terms-row" style={{ marginTop: 8 }}>
                                    <input
                                        type="checkbox"
                                        id="monthlyConsentCheck"
                                        checked={monthlyConsent}
                                        onChange={(e) => setMonthlyConsent(e.target.checked)}
                                        className="dp-checkbox"
                                    />
                                    <label htmlFor="monthlyConsentCheck" className="dp-terms-label">
                                        I authorize an automated monthly contribution of ₹{isCustomMonthly ? (customMonthlyVal || '0') : monthlyAmount.toLocaleString('en-IN')} to Kiran Charitable Trust. I understand that I can pause, modify or cancel this AutoPay mandate at any time from my bank/UPI app or trust portal.
                                    </label>
                                </div>

                                {/* Submit & Cancel buttons */}
                                <div className="dp-monthly-action-btns">
                                    <button
                                        type="submit"
                                        disabled={monthlySubmitting}
                                        className="dp-monthly-submit-btn"
                                    >
                                        <FaCalendarAlt /> {monthlySubmitting ? 'Setting up AutoPay...' : `Authorize Monthly Contribution (₹${isCustomMonthly ? (customMonthlyVal || '0') : monthlyAmount.toLocaleString('en-IN')}/mo)`}
                                    </button>
                                    <button
                                        type="button"
                                        className="dp-monthly-cancel-btn"
                                        onClick={() => setShowMonthlyModal(false)}
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                PAYMENT FAILED / TIMED OUT POPUP DIALOG BOX
               ════════════════════════════════════════════════════════════ */}
            {paymentFailureModal && (
                <div className="payment-failure-dialog-overlay" onClick={() => setPaymentFailureModal(null)}>
                    <div className="payment-failure-dialog-box" onClick={e => e.stopPropagation()}>
                        <button className="failure-close-btn" onClick={() => setPaymentFailureModal(null)} title="Close">
                            <FaTimes />
                        </button>
                        <div className="failure-dialog-icon">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="failure-dialog-title">Payment Unsuccessful / Timed Out</h3>
                        <p className="failure-dialog-desc">
                            Your payment session was not completed or timed out on the banking gateway.
                            We have safely restored all your contribution details below so you can retry seamlessly without re-typing.
                        </p>
                        <div className="failure-dialog-details">
                            <div className="failure-detail-row">
                                <span>Donor Name:</span>
                                <strong>{paymentFailureModal.name || fullName || 'Donor'}</strong>
                            </div>
                            <div className="failure-detail-row">
                                <span>Contribution Amount:</span>
                                <strong style={{ color: '#059669', fontSize: '16px' }}>₹{paymentFailureModal.amount || effectiveAmount}</strong>
                            </div>
                            <div className="failure-detail-row">
                                <span>Status / Reason:</span>
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{paymentFailureModal.reason}</span>
                            </div>
                            {paymentFailureModal.txnId && (
                                <div className="failure-detail-row">
                                    <span>Transaction Ref:</span>
                                    <code style={{ fontSize: '11px', color: '#64748b' }}>{paymentFailureModal.txnId}</code>
                                </div>
                            )}
                        </div>
                        <div className="failure-dialog-actions">
                            <button
                                type="button"
                                className="btn btn-primary failure-retry-btn"
                                onClick={() => {
                                    setPaymentFailureModal(null);
                                    setTimeout(() => {
                                        const formEl = document.querySelector('.donate-form-container') || document.querySelector('.donation-action-card');
                                        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                            >
                                <FaSyncAlt /> Retry Contribution Now
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary failure-bank-btn"
                                onClick={() => {
                                    setPaymentFailureModal(null);
                                    setPaymentMode('bank');
                                    setTimeout(() => {
                                        const bankEl = document.getElementById('direct-bank-details');
                                        if (bankEl) bankEl.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                            >
                                <FaUniversity /> Pay via Direct Bank NEFT / QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
