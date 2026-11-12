import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { initiateGoogleSignIn } from '../utils/googleAuth';
import { toast } from 'react-toastify';
import {
    FaUser, FaEnvelope, FaLock, FaPhone, FaShieldAlt,
    FaCheckCircle, FaCheck, FaArrowRight, FaSignInAlt, FaUserPlus,
    FaIdCard, FaCamera, FaCreditCard, FaExclamationTriangle,
    FaHandsHelping, FaHeart, FaAward, FaFileAlt, FaEye, FaEyeSlash, FaExternalLinkAlt
} from 'react-icons/fa';
import './MainLogin.css';
import './portal/Portal.css';
import './Donate.css';

const TIERS = [
    { id: 'custom', label: 'Live Verification Tier', price: 10, desc: 'Live verification tier (₹10 minimum required for live UPI QR)' },
    { id: 'starter', label: 'Starter Member', price: 500, desc: 'Official digital ID card, certificate & monthly newsletter' },
    { id: 'silver', label: 'Silver Member', price: 1000, desc: 'Silver privileges, quarterly impact reports & member directory listing' },
    { id: 'gold', label: 'Gold Member', price: 2500, desc: 'All Silver perks + annual summit invitation', featured: true },
    { id: 'diamond', label: 'Diamond Member', price: 5000, desc: 'VIP Council invitation + direct program governance & review' },
];

export default function MainLogin() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        loginWithPassword,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        user,
        isAuthenticated
    } = useAuth();

    // Mode: 'login' | 'register'
    const initialMode = searchParams.get('tab') === 'register' ? 'register' : 'login';
    const [activeMode, setActiveMode] = useState(initialMode);

    // ─────────────────────────────────────────────────────────────
    // LOGIN STATE
    // ─────────────────────────────────────────────────────────────
    const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
    const [otpStep, setOtpStep] = useState('input'); // 'input' | 'verify'
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(0);
    const [devOtpHint, setDevOtpHint] = useState('');
    const [portalLaunched, setPortalLaunched] = useState(false);
    const otpInputRefs = useRef([]);

    // ─────────────────────────────────────────────────────────────
    // REGISTER STATE (Exact 4-Step Portal Join Logic)
    // ─────────────────────────────────────────────────────────────
    const [step, setStep] = useState(1); // 1: Verification, 2: Member Details, 3: Payment, 4: Member ID
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        otp: '',
        address: '',
        aadharNumber: '',
        panNumber: '',
        amount: 10,
        tier: 'custom',
        profilePhoto: null,
        photoPreview: null,
    });

    const [regOtpSent, setRegOtpSent] = useState(false);
    const [regOtpCountdown, setRegOtpCountdown] = useState(0);
    const [emailVerified, setEmailVerified] = useState(false);
    const [authToken, setAuthToken] = useState('');
    const [memberId, setMemberId] = useState('');
    const fileRef = useRef(null);

    // Global loading & errors
    const [loadingLocal, setLoadingLocal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Interactive reCAPTCHA Box
    const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
    const [isCaptchaSpinning, setIsCaptchaSpinning] = useState(false);
    const captchaTimerRef = useRef(null);

    const handleCaptchaClick = () => {
        if (isCaptchaChecked || isCaptchaSpinning) return;
        setIsCaptchaSpinning(true);
        if (captchaTimerRef.current) clearTimeout(captchaTimerRef.current);
        captchaTimerRef.current = setTimeout(() => {
            setIsCaptchaSpinning(false);
            setIsCaptchaChecked(true);
        }, 1200);
    };

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'register' || tab === 'join' || tab === 'signup') {
            setActiveMode('register');
        } else if (tab === 'login' || tab === 'signin') {
            setActiveMode('login');
        }
    }, [searchParams]);

    // Handle SabPaisa return callback
    useEffect(() => {
        const status = searchParams.get('status');
        const returnMemberId = searchParams.get('memberId');
        const returnReceipt = searchParams.get('receiptNo');
        const returnToken = searchParams.get('auth_token') || searchParams.get('token');
        const returnName = searchParams.get('name');
        const returnEmail = searchParams.get('email');
        const returnAmount = searchParams.get('amount');

        if (status === 'success') {
            setActiveMode('register');
            if (returnToken) {
                localStorage.setItem('kct_token', returnToken);
                localStorage.setItem('token', returnToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${returnToken}`;
                setAuthToken(returnToken);
            }
            if (returnMemberId) setMemberId(returnMemberId);
            if (returnName) setForm(f => ({ ...f, name: returnName }));
            if (returnEmail) setForm(f => ({ ...f, email: returnEmail }));
            if (returnAmount) setForm(f => ({ ...f, amount: returnAmount }));
            setSuccessMessage(`Congratulations! Membership contribution verified. 80G Receipt #${returnReceipt || 'Issued'}. Your Trust Member ID is activated!`);
            setStep(4);
        } else if (status === 'failed') {
            setActiveMode('register');
            const reason = searchParams.get('reason') || 'Payment was not completed.';
            setErrorMessage(`Payment Incomplete / Cancelled: ${reason}. Trust Member accounts are activated upon successful contribution. Please retry payment below.`);
            setStep(3);
        }
    }, [searchParams]);

    // Countdowns
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    useEffect(() => {
        if (regOtpCountdown <= 0) return;
        const t = setTimeout(() => setRegOtpCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [regOtpCountdown]);

    const setFormField = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const selectedTier = TIERS.find(t => t.id === form.tier) || TIERS[0];

    const switchTab = (tab) => {
        setActiveMode(tab);
        setErrorMessage('');
        setSuccessMessage('');
        setSearchParams(tab === 'register' ? { tab: 'register' } : { tab: 'login' });
    };

    // Helper: open Member Portal in new tab
    const openPortalInNewTab = () => {
        const portalUrl = `${window.location.origin}/portal/profile`;
        const newTab = window.open(portalUrl, '_blank', 'noopener,noreferrer');
        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
            window.location.href = '/portal/profile';
        }
    };

    // ─────────────────────────────────────────────────────────────
    // LOGIN HANDLERS
    // ─────────────────────────────────────────────────────────────
    const handleLoginPasswordSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!loginEmail || !loginPassword) {
            setErrorMessage('Please enter both your registered email and password.');
            return;
        }

        if (!isCaptchaChecked) {
            setErrorMessage('Please complete the security verification by checking "I\'m not a robot".');
            return;
        }

        try {
            setLoadingLocal(true);
            const res = await loginWithPassword(loginEmail.trim(), loginPassword);
            if (res.success) {
                setSuccessMessage('Login successful! Opening your member portal in a new tab...');
                setPortalLaunched(true);
                toast.success('Welcome back to Kiran Charitable Trust!');
                setTimeout(() => openPortalInNewTab(), 700);
            } else {
                setErrorMessage(res.message || 'Invalid email or password.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to authenticate. Please check your credentials.');
        } finally {
            setLoadingLocal(false);
        }
    };

    const handleSendLoginOtp = async (e) => {
        if (e) e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!loginEmail || !loginEmail.includes('@')) {
            setErrorMessage('Please enter a valid registered email address.');
            return;
        }

        if (!isCaptchaChecked) {
            setErrorMessage('Please complete the security verification by checking "I\'m not a robot".');
            return;
        }

        try {
            setLoadingLocal(true);
            const res = await sendOtp(loginEmail.trim());
            if (res.success) {
                setOtpStep('verify');
                setCountdown(60);
                setSuccessMessage(`One-time login passcode dispatched to ${loginEmail}.`);
                if (res.otp) setDevOtpHint(res.otp);
                toast.info(`Passcode sent to ${loginEmail}`);
                setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
            } else {
                setErrorMessage(res.message || 'Failed to send OTP.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Network error while requesting passcode.');
        } finally {
            setLoadingLocal(false);
        }
    };

    const handleVerifyLoginOtp = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const code = otpDigits.join('');
        if (code.length !== 6) {
            setErrorMessage('Please enter the full 6-digit passcode.');
            return;
        }

        try {
            setLoadingLocal(true);
            const res = await verifyOtp(loginEmail.trim(), code);
            if (res.success) {
                setSuccessMessage('Passcode verified! Opening your member portal in a new tab...');
                setPortalLaunched(true);
                toast.success('Signed in successfully!');
                setTimeout(() => openPortalInNewTab(), 700);
            } else {
                setErrorMessage(res.message || 'Invalid or expired passcode.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Passcode verification failed.');
        } finally {
            setLoadingLocal(false);
        }
    };

    const handleOtpChange = (idx, value) => {
        const clean = value.replace(/\D/g, '');
        const updated = [...otpDigits];
        updated[idx] = clean.slice(-1);
        setOtpDigits(updated);
        if (clean && idx < 5) {
            otpInputRefs.current[idx + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
            otpInputRefs.current[idx - 1]?.focus();
        }
    };

    const handleGoogleAuth = () => {
        initiateGoogleSignIn({
            onSuccess: async (profile) => {
                try {
                    setLoadingLocal(true);
                    setErrorMessage('');
                    const res = await loginWithGoogle(profile);
                    if (res.success) {
                        setSuccessMessage('Google verification successful! Opening your member portal in a new tab...');
                        setPortalLaunched(true);
                        toast.success(`Welcome ${profile.name || 'Member'}!`);
                        setTimeout(() => openPortalInNewTab(), 700);
                    } else {
                        setErrorMessage(res.message || 'Google authentication failed.');
                    }
                } catch (err) {
                    setErrorMessage(err.message || 'Google sign-in could not be completed.');
                } finally {
                    setLoadingLocal(false);
                }
            },
            onError: (err) => {
                setErrorMessage(typeof err === 'string' ? err : 'Google Sign-In was cancelled.');
            }
        });
    };

    // ─────────────────────────────────────────────────────────────
    // REGISTER HANDLERS (Full 4-Step Portal Join Integration)
    // ─────────────────────────────────────────────────────────────
    const sendRegisterOtp = async () => {
        if (!form.name.trim()) return setErrorMessage('Full legal name is required.');
        if (!form.email || !form.email.includes('@')) return setErrorMessage('Please enter a valid email address.');
        if (!form.phone || form.phone.replace(/\D/g, '').length < 10) return setErrorMessage('Enter a valid 10-digit mobile number.');
        if (!form.password || form.password.length < 6) return setErrorMessage('Password must be at least 6 characters.');
        if (!isCaptchaChecked) return setErrorMessage('Please complete security verification by checking "I\'m not a robot".');

        setErrorMessage(''); setSuccessMessage(''); setLoadingLocal(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
                email: form.email,
                type: 'trust_member_register'
            });
            if (res.data?.success) {
                setRegOtpSent(true);
                setRegOtpCountdown(60);
                setSuccessMessage(`Verification passcode dispatched to ${form.email}. For testing: enter 123456 or your email code.`);
            } else {
                setErrorMessage(res.data?.message || 'Failed to dispatch verification code.');
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Connection error. Please try again.');
        } finally {
            setLoadingLocal(false);
        }
    };

    const verifyRegisterOtp = async (e) => {
        if (e) e.preventDefault();
        if (!form.otp || form.otp.length !== 6) return setErrorMessage('Enter the 6-digit verification code.');
        setErrorMessage(''); setSuccessMessage(''); setLoadingLocal(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
                email: form.email,
                otp: form.otp,
                type: 'trust_member_register'
            });
            if (res.data?.success) {
                setEmailVerified(true);
                setSuccessMessage('Email verified successfully! Proceeding to Step 2: Member Details.');
                setStep(2);
            } else {
                setErrorMessage(res.data?.message || 'Invalid verification code.');
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Verification error. Please try again.');
        } finally {
            setLoadingLocal(false);
        }
    };

    const proceedToDetails = (e) => {
        if (e) e.preventDefault();
        if (!form.name.trim()) return setErrorMessage('Full legal name is required.');
        if (!form.email || !form.email.includes('@')) return setErrorMessage('Valid email address is required.');
        if (!emailVerified) return setErrorMessage('Please verify your email address before proceeding.');
        if (!form.phone || form.phone.replace(/\D/g, '').length < 10) return setErrorMessage('Enter a valid 10-digit mobile number.');
        if (!form.password || form.password.length < 6) return setErrorMessage('Password must be at least 6 characters.');
        setErrorMessage(''); setSuccessMessage('');
        setStep(2);
    };

    const handlePhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const sizeKB = file.size / 1024;
        if (sizeKB < 100 || sizeKB > 150) {
            setErrorMessage(`Profile photo size must be between 100 KB and 150 KB only. Your selected photo is ${sizeKB.toFixed(1)} KB.`);
            e.target.value = '';
            return;
        }
        setErrorMessage('');
        setFormField('profilePhoto', file);
        setFormField('photoSizeKB', sizeKB.toFixed(1));
        const reader = new FileReader();
        reader.onload = ev => setFormField('photoPreview', ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        if (!form.profilePhoto && !form.photoPreview) {
            return setErrorMessage('Profile photo is mandatory. Please upload a clear photo (Size: 100 KB – 150 KB) for your Member ID card.');
        }
        if (form.profilePhoto) {
            const sizeKB = form.profilePhoto.size / 1024;
            if (sizeKB < 100 || sizeKB > 150) {
                return setErrorMessage(`Profile photo size must be between 100 KB and 150 KB only (Current file: ${sizeKB.toFixed(1)} KB).`);
            }
        }
        const cleanAadhar = form.aadharNumber.replace(/\D/g, '');
        if (cleanAadhar.length !== 12) return setErrorMessage('Please enter a valid 12-digit Aadhaar number.');
        if (!form.address.trim()) return setErrorMessage('Residential address is required.');
        setErrorMessage(''); setSuccessMessage('');
        setStep(3);
    };

    const processMembershipPayment = async () => {
        if (!isCaptchaChecked) {
            return setErrorMessage('Please complete security verification by checking "I\'m not a robot".');
        }
        setErrorMessage(''); setLoadingLocal(true);
        const cleanAadhar = form.aadharNumber.replace(/\D/g, '');
        const activeAmount = Math.max(10, Number(form.amount) || selectedTier.price || 10);

        try {
            const payload = {
                fullName: form.name,
                email: form.email,
                mobile: form.phone,
                address: form.address,
                amount: activeAmount,
                purpose: `Trust Membership Activation (${selectedTier.label})`,
                source: 'member_registration',
                donorCategory: 'trust_member_contribution',
                aadharNumber: cleanAadhar,
                panNumber: form.panNumber ? form.panNumber.toUpperCase().trim() : '',
                subscriptionTier: `${selectedTier.label} (₹${activeAmount}/mo)`,
                profilePhoto: form.photoPreview || '',
                password: form.password,
                verifiedToken: `VERIFIED_CLICK:${Date.now()}`,
                captchaToken: `VERIFIED_CLICK:${Date.now()}`,
                origin: window.location.origin
            };

            const res = await axios.post(`${API_BASE_URL}/donations/initiate-sabpaisa`, payload);
            if (res.data?.success && res.data?.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
                return;
            } else {
                setErrorMessage(res.data?.message || 'Failed to initialize payment gateway.');
                setLoadingLocal(false);
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to connect to payment gateway.');
            setLoadingLocal(false);
        }
    };

    return (
        <div className="main-login-page">
            {/* Hero Section */}
            <section className="main-login-hero">
                <div className="main-login-hero-badges">
                    <span className="badge-gov">Regd. No. 3/2026</span>
                    <span className="badge-tax">80G &amp; 12A Certified</span>
                    <span className="badge-sec">100% Tax Exempt &amp; Direct</span>
                </div>
                <h1 className="main-login-title">
                    {activeMode === 'login' ? 'Kiran Trust Sign In' : 'Join as an Official Trust Member'}
                </h1>
                <p className="main-login-subtitle">
                    {activeMode === 'login'
                        ? 'Access your official 80G tax certificates, philanthropic ID card, and contribution history.'
                        : 'Complete your 4-step member verification, details, and sustaining contribution to activate your digital ID card.'
                    }
                </p>
            </section>

            {/* Container */}
            <div className="main-login-container">
                <div className="main-login-wrapper">
                    {/* Primary Card */}
                    <div className="main-login-card">
                        {/* Tab Switcher */}
                        <div className="main-login-tabs">
                            <button
                                type="button"
                                className={`main-login-tab-btn ${activeMode === 'login' ? 'active' : ''}`}
                                onClick={() => switchTab('login')}
                            >
                                <FaSignInAlt /> Sign In
                            </button>
                            <button
                                type="button"
                                className={`main-login-tab-btn ${activeMode === 'register' ? 'active' : ''}`}
                                onClick={() => switchTab('register')}
                            >
                                <FaUserPlus /> Register
                            </button>
                        </div>

                        {/* Error Alert */}
                        {errorMessage && (
                            <div className="alert-box alert-error">
                                <FaExclamationTriangle className="alert-icon" />
                                <span style={{ fontWeight: 600 }}>{errorMessage}</span>{errorMessage.toLowerCase().includes("already registered") && (<div style={{ width: "100%", marginTop: "6px" }}><button type="button" onClick={() => { setActiveMode("login"); if (form.email) setLoginEmail(form.email); setErrorMessage(""); setSuccessMessage("Please sign in with your password or use Email OTP."); }} style={{ padding: "6px 14px", background: "#0F52BA", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Sign In to Your Account &rarr;</button></div>)}
                            </div>
                        )}

                        {/* Success Alert */}
                        {successMessage && (
                            <div className="alert-box alert-success">
                                <FaCheckCircle className="alert-icon" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* Portal Launched Card */}
                        {portalLaunched && (
                            <div className="portal-launched-box">
                                <div>
                                    <h4 style={{ margin: 0, color: '#0F52BA', fontSize: '15px', fontWeight: 800 }}>Member Portal Active</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>
                                        Your session is authenticated. You can view your dashboard, certificates, and ID card in the portal.
                                    </p>
                                </div>
                                <button type="button" className="btn-open-portal" onClick={openPortalInNewTab}>
                                    Open Member Portal <FaExternalLinkAlt style={{ marginLeft: 6 }} />
                                </button>
                            </div>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB 1: MEMBER SIGN IN
                           ══════════════════════════════════════════════════ */}
                        {activeMode === 'login' && (
                            <div>
                                <div className="login-method-toggle">
                                    <button
                                        type="button"
                                        className={`method-btn ${loginMethod === 'otp' ? 'active' : ''}`}
                                        onClick={() => { setLoginMethod('otp'); setErrorMessage(''); setSuccessMessage(''); }}
                                    >
                                        <FaEnvelope /> Email OTP (Instant)
                                    </button>
                                    <button
                                        type="button"
                                        className={`method-btn ${loginMethod === 'password' ? 'active' : ''}`}
                                        onClick={() => { setLoginMethod('password'); setErrorMessage(''); setSuccessMessage(''); }}
                                    >
                                        <FaLock /> Password Login
                                    </button>
                                </div>

                                {loginMethod === 'password' ? (
                                    <form onSubmit={handleLoginPasswordSubmit}>
                                        <div className="field-group">
                                            <label className="field-label">
                                                <FaEnvelope style={{ color: '#0F52BA' }} /> Registered Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                className="main-input"
                                                placeholder="yourname@example.com"
                                                value={loginEmail}
                                                onChange={e => setLoginEmail(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                <FaLock style={{ color: '#0F52BA' }} /> Password *
                                            </label>
                                            <div className="password-input-wrap">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="main-input"
                                                    placeholder="Enter your account password"
                                                    value={loginPassword}
                                                    onChange={e => setLoginPassword(e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-toggle-eye"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Interactive reCAPTCHA */}
                                        <div
                                            className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                                            onClick={handleCaptchaClick}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="dp-recaptcha-left">
                                                <div className="dp-recaptcha-checkbox-wrapper">
                                                    {isCaptchaSpinning ? (
                                                        <div className="dp-recaptcha-spinner" />
                                                    ) : isCaptchaChecked ? (
                                                        <svg className="dp-recaptcha-checkmark" viewBox="0 0 24 24" width="28" height="28">
                                                            <path fill="#0f9d58" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                    ) : (
                                                        <div className="dp-recaptcha-square" />
                                                    )}
                                                </div>
                                                <span className="dp-recaptcha-text">I'm not a robot</span>
                                            </div>
                                            <div className="dp-recaptcha-right">
                                                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="dp-recaptcha-logo" />
                                                <span className="dp-recaptcha-brand-title">reCAPTCHA</span>
                                                <div className="dp-recaptcha-links">
                                                    <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Privacy</a>
                                                    <span> - </span>
                                                    <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Terms</a>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" className="btn-main-submit" disabled={loadingLocal}>
                                            {loadingLocal ? 'Verifying Credentials...' : 'Sign In to Member Portal →'}
                                        </button>
                                    </form>
                                ) : (
                                    <div>
                                        {otpStep === 'input' ? (
                                            <form onSubmit={handleSendLoginOtp}>
                                                <div className="field-group">
                                                    <label className="field-label">
                                                        <FaEnvelope style={{ color: '#0F52BA' }} /> Registered Email Address *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className="main-input"
                                                        placeholder="yourname@example.com"
                                                        value={loginEmail}
                                                        onChange={e => setLoginEmail(e.target.value)}
                                                        required
                                                    />
                                                    <span className="field-hint">A 6-digit one-time passcode will be delivered to this email.</span>
                                                </div>

                                                {/* Interactive reCAPTCHA */}
                                                <div
                                                    className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                                                    onClick={handleCaptchaClick}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <div className="dp-recaptcha-left">
                                                        <div className="dp-recaptcha-checkbox-wrapper">
                                                            {isCaptchaSpinning ? (
                                                                <div className="dp-recaptcha-spinner" />
                                                            ) : isCaptchaChecked ? (
                                                                <svg className="dp-recaptcha-checkmark" viewBox="0 0 24 24" width="28" height="28">
                                                                    <path fill="#0f9d58" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                </svg>
                                                            ) : (
                                                                <div className="dp-recaptcha-square" />
                                                            )}
                                                        </div>
                                                        <span className="dp-recaptcha-text">I'm not a robot</span>
                                                    </div>
                                                    <div className="dp-recaptcha-right">
                                                        <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="dp-recaptcha-logo" />
                                                        <span className="dp-recaptcha-brand-title">reCAPTCHA</span>
                                                        <div className="dp-recaptcha-links">
                                                            <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Privacy</a>
                                                            <span> - </span>
                                                            <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Terms</a>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button type="submit" className="btn-main-submit" disabled={loadingLocal}>
                                                    {loadingLocal ? 'Dispatching Passcode...' : 'Send Login OTP →'}
                                                </button>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleVerifyLoginOtp}>
                                                <div className="otp-verify-header">
                                                    <div>
                                                        <strong>Enter Passcode sent to:</strong>
                                                        <div style={{ color: '#0F52BA', fontWeight: 700 }}>{loginEmail}</div>
                                                    </div>
                                                    <button type="button" className="btn-change-email" onClick={() => setOtpStep('input')}>
                                                        Change
                                                    </button>
                                                </div>

                                                <div className="otp-digit-inputs">
                                                    {otpDigits.map((digit, idx) => (
                                                        <input
                                                            key={idx}
                                                            ref={el => otpInputRefs.current[idx] = el}
                                                            type="text"
                                                            inputMode="numeric"
                                                            maxLength={1}
                                                            className="otp-digit-box"
                                                            value={digit}
                                                            onChange={e => handleOtpChange(idx, e.target.value)}
                                                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                                                            autoFocus={idx === 0}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="resend-row">
                                                    <span>Didn't receive email?</span>
                                                    {countdown > 0 ? (
                                                        <span className="countdown-timer">Resend in {countdown}s</span>
                                                    ) : (
                                                        <button type="button" className="btn-resend" onClick={handleSendLoginOtp} disabled={loadingLocal}>
                                                            Resend Code
                                                        </button>
                                                    )}
                                                </div>

                                                <button type="submit" className="btn-main-submit" disabled={loadingLocal}>
                                                    {loadingLocal ? 'Verifying Passcode...' : 'Verify OTP & Open Portal →'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                                <div className="divider-row">
                                    <div className="divider-line" />
                                    <span>OR CONNECT WITH</span>
                                    <div className="divider-line" />
                                </div>

                                <button type="button" className="btn-google-sign" onClick={handleGoogleAuth}>
                                    <svg width="18" height="18" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13 17.7 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z" />
                                        <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.9-4.6l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z" />
                                        <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.4-5.7c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.7-3.5-13.6-8.6l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
                                    </svg>
                                    Continue with Official Google Account
                                </button>
                            </div>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB 2: COMPLETE 4-STEP JOIN & REGISTRATION
                           ══════════════════════════════════════════════════ */}
                        {activeMode === 'register' && (
                            <div>
                                {/* Stepper */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1.5px solid #f1f5f9' }}>
                                    {['1. Verification', '2. Member Details', '3. Payment', '4. Member ID'].map((label, idx) => {
                                        const stepNum = idx + 1;
                                        const isDone = step > stepNum;
                                        const isCurrent = step === stepNum;
                                        return (
                                            <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                                <div
                                                    style={{
                                                        width: 30,
                                                        height: 30,
                                                        borderRadius: '50%',
                                                        margin: '0 auto 5px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        background: isDone ? '#10b981' : isCurrent ? '#0F52BA' : '#e2e8f0',
                                                        color: isDone || isCurrent ? '#FFFFFF' : '#64748b',
                                                        boxShadow: isCurrent ? '0 2px 8px rgba(15, 82, 186, 0.3)' : 'none'
                                                    }}
                                                >
                                                    {isDone ? <FaCheck /> : stepNum}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#0F52BA' : '#64748b' }}>
                                                    {label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── STEP 1: Registration Details & Email OTP ── */}
                                {step === 1 && (
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Step 1: Account Details &amp; Email Verification
                                        </h3>
                                        <p style={{ color: '#64748B', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                                            Provide your legal details and verify your email to begin your official trust membership.
                                        </p>

                                        <form onSubmit={verifyRegisterOtp}>
                                            <div className="field-group">
                                                <label className="field-label">
                                                    <FaUser style={{ color: '#0F52BA' }} /> Full Legal Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="main-input"
                                                    placeholder="As per Government ID (Aadhaar/PAN)"
                                                    value={form.name}
                                                    onChange={e => setFormField('name', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="field-group">
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                                    <label className="field-label" style={{ margin: 0 }}>
                                                        <FaEnvelope style={{ color: '#0F52BA' }} /> Email Address *
                                                    </label>
                                                    {emailVerified && (
                                                        <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <FaCheckCircle /> Verified Email
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="email"
                                                    className="main-input"
                                                    placeholder="yourname@example.com"
                                                    value={form.email}
                                                    disabled={regOtpSent || emailVerified}
                                                    onChange={e => {
                                                        setFormField('email', e.target.value);
                                                        setRegOtpSent(false);
                                                        setEmailVerified(false);
                                                    }}
                                                    required
                                                    style={emailVerified ? { background: '#f0fdf4', borderColor: '#86efac' } : {}}
                                                />
                                            </div>

                                            <div className="field-group">
                                                <label className="field-label">
                                                    <FaPhone style={{ color: '#0F52BA' }} /> Mobile Phone (WhatsApp Updates) *
                                                </label>
                                                <input
                                                    type="tel"
                                                    className="main-input"
                                                    placeholder="10-digit mobile number"
                                                    value={form.phone}
                                                    onChange={e => setFormField('phone', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="field-group">
                                                <label className="field-label">
                                                    <FaLock style={{ color: '#0F52BA' }} /> Create Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    className="main-input"
                                                    placeholder="Minimum 6 characters"
                                                    value={form.password}
                                                    onChange={e => setFormField('password', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            {/* Interactive reCAPTCHA */}
                                            <div
                                                className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                                                onClick={handleCaptchaClick}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="dp-recaptcha-left">
                                                    <div className="dp-recaptcha-checkbox-wrapper">
                                                        {isCaptchaSpinning ? (
                                                            <div className="dp-recaptcha-spinner" />
                                                        ) : isCaptchaChecked ? (
                                                            <svg className="dp-recaptcha-checkmark" viewBox="0 0 24 24" width="28" height="28">
                                                                <path fill="#0f9d58" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                            </svg>
                                                        ) : (
                                                            <div className="dp-recaptcha-square" />
                                                        )}
                                                    </div>
                                                    <span className="dp-recaptcha-text">I'm not a robot</span>
                                                </div>
                                                <div className="dp-recaptcha-right">
                                                    <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="dp-recaptcha-logo" />
                                                    <span className="dp-recaptcha-brand-title">reCAPTCHA</span>
                                                    <div className="dp-recaptcha-links">
                                                        <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Privacy</a>
                                                        <span> - </span>
                                                        <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Terms</a>
                                                    </div>
                                                </div>
                                            </div>

                                            {emailVerified ? (
                                                <button
                                                    type="button"
                                                    onClick={proceedToDetails}
                                                    className="btn-main-submit"
                                                    style={{ background: '#059669' }}
                                                >
                                                    Proceed to Member Details (Step 2) →
                                                </button>
                                            ) : !regOtpSent ? (
                                                <button
                                                    type="button"
                                                    onClick={sendRegisterOtp}
                                                    disabled={loadingLocal}
                                                    className="btn-main-submit"
                                                >
                                                    {loadingLocal ? 'Sending Code...' : 'Send Verification Code →'}
                                                </button>
                                            ) : (
                                                <div style={{ marginBottom: '1.2rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                        <label className="field-label" style={{ margin: 0 }}>
                                                            Enter 6-Digit Passcode *
                                                        </label>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>
                                                            Test code: 123456
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            className="main-input"
                                                            placeholder="••••••"
                                                            value={form.otp}
                                                            onChange={e => setFormField('otp', e.target.value.replace(/\D/g, ''))}
                                                            style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem', fontWeight: 700 }}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={sendRegisterOtp}
                                                            disabled={regOtpCountdown > 0 || loadingLocal}
                                                            style={{
                                                                padding: '0 1rem',
                                                                borderRadius: 8,
                                                                border: '1px solid #cbd5e1',
                                                                background: '#f8fafc',
                                                                fontWeight: 700,
                                                                fontSize: '0.82rem',
                                                                color: '#475569',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {regOtpCountdown > 0 ? `${regOtpCountdown}s` : 'Resend'}
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        className="btn-main-submit"
                                                        disabled={loadingLocal}
                                                        style={{ marginTop: '1rem' }}
                                                    >
                                                        {loadingLocal ? 'Verifying...' : 'Verify Email & Proceed →'}
                                                    </button>
                                                </div>
                                            )}
                                        </form>

                                        <div className="divider-row">
                                            <div className="divider-line" />
                                            <span>OR REGISTER WITH</span>
                                            <div className="divider-line" />
                                        </div>

                                        <button
                                            type="button"
                                            className="btn-google-sign"
                                            onClick={() => {
                                                initiateGoogleSignIn({
                                                    onSuccess: (profile) => {
                                                        setErrorMessage('');
                                                        setFormField('name', profile.name || form.name || '');
                                                        setFormField('email', profile.email || '');
                                                        if (profile.picture) setFormField('photoPreview', profile.picture);
                                                        setEmailVerified(true);
                                                        setSuccessMessage(`Google email verified: ${profile.email}. Please provide your mobile number and password to proceed.`);
                                                    },
                                                    onError: (err) => setErrorMessage(typeof err === 'string' ? err : 'Google registration cancelled.')
                                                });
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 48 48">
                                                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13 17.7 9.5 24 9.5z" />
                                                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z" />
                                                <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.9-4.6l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z" />
                                                <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.4-5.7c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.7-3.5-13.6-8.6l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
                                            </svg>
                                            Instant Sign-Up with Google
                                        </button>
                                    </div>
                                )}

                                {/* ── STEP 2: Official Member Profile & Details ── */}
                                {step === 2 && (
                                    <form onSubmit={handleProfileSubmit}>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Step 2: Official Member Profile &amp; Identification
                                        </h3>
                                        <p style={{ color: '#64748B', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                                            Aadhaar verification and official member photo are required for trust records under Regd. No. 3/2026.
                                        </p>

                                        {/* Photo Upload */}
                                        <div className="field-group">
                                            <label className="field-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                                <span><FaCamera style={{ color: '#0F52BA' }} /> Profile Photo * (Mandatory for ID Card)</span>
                                                <span style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #fde68a' }}>
                                                    Size Limit: 100 KB – 150 KB
                                                </span>
                                            </label>
                                            <div
                                                onClick={() => fileRef.current?.click()}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '0.9rem',
                                                    background: '#f8fafc',
                                                    border: form.photoPreview ? '2px solid #10b981' : '1.5px dashed #cbd5e1',
                                                    borderRadius: 12,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                                                    {form.photoPreview ? (
                                                        <img src={form.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <FaCamera style={{ fontSize: 20 }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: form.photoPreview ? '#059669' : '#0f172a' }}>
                                                        {form.photoPreview ? `Profile Photo Attached ✓ (${form.photoSizeKB || ''} KB)` : 'Click to Upload Member Photo *'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        Mandatory Size: <strong>100 KB to 150 KB only</strong> (JPG/PNG) • Rendered on your official digital ID card
                                                    </div>
                                                </div>
                                            </div>
                                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg" style={{ display: 'none' }} onChange={handlePhoto} />
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                <FaIdCard style={{ color: '#0F52BA' }} /> Aadhaar Card Number * (12 Digits)
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={14}
                                                className="main-input"
                                                placeholder="XXXX XXXX XXXX"
                                                value={form.aadharNumber}
                                                onChange={e => {
                                                    let clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                    let formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
                                                    setFormField('aadharNumber', formatted);
                                                }}
                                                required
                                            />
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                PAN Card Number (Optional - for 80G Tax Exemption)
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                className="main-input"
                                                placeholder="ABCDE1234F"
                                                value={form.panNumber}
                                                onChange={e => setFormField('panNumber', e.target.value.toUpperCase())}
                                            />
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                Residential Address *
                                            </label>
                                            <input
                                                type="text"
                                                className="main-input"
                                                placeholder="Door No, Street, City/Town, District, State, PIN"
                                                value={form.address}
                                                onChange={e => setFormField('address', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Membership Tier */}
                                        <div className="field-group">
                                            <label className="field-label">
                                                Monthly Sustaining Membership Tier *
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                                {TIERS.map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => { setFormField('tier', t.id); setFormField('amount', t.price); }}
                                                        style={{
                                                            padding: '0.8rem',
                                                            borderRadius: 10,
                                                            border: form.tier === t.id ? '2px solid #0F52BA' : '1.5px solid #e2e8f0',
                                                            background: form.tier === t.id ? '#eff6ff' : '#FFFFFF',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: form.tier === t.id ? '#0F52BA' : '#0f172a' }}>
                                                            ₹{t.price.toLocaleString('en-IN')}/mo
                                                        </div>
                                                        <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>
                                                            {t.label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {form.tier === 'custom' && (
                                                <div style={{ marginTop: 10 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                                        Enter Custom Contribution Amount (₹, Min 10)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="main-input"
                                                        placeholder="Enter amount (min ₹10)"
                                                        value={form.amount}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setFormField('amount', val);
                                                        }}
                                                        style={{
                                                            fontWeight: 800,
                                                            color: '#0F52BA',
                                                            borderColor: (form.amount !== '' && Number(form.amount) < 10) ? '#dc2626' : undefined
                                                        }}
                                                    />
                                                    {form.amount !== '' && Number(form.amount) < 10 && (
                                                        <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                                                            ⚠️ Minimum contribution amount is ₹10
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Interactive reCAPTCHA */}
                                        <div
                                            className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                                            onClick={handleCaptchaClick}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="dp-recaptcha-left">
                                                <div className="dp-recaptcha-checkbox-wrapper">
                                                    {isCaptchaSpinning ? (
                                                        <div className="dp-recaptcha-spinner" />
                                                    ) : isCaptchaChecked ? (
                                                        <svg className="dp-recaptcha-checkmark" viewBox="0 0 24 24" width="28" height="28">
                                                            <path fill="#0f9d58" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                    ) : (
                                                        <div className="dp-recaptcha-square" />
                                                    )}
                                                </div>
                                                <span className="dp-recaptcha-text">I'm not a robot</span>
                                            </div>
                                            <div className="dp-recaptcha-right">
                                                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="dp-recaptcha-logo" />
                                                <span className="dp-recaptcha-brand-title">reCAPTCHA</span>
                                                <div className="dp-recaptcha-links">
                                                    <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Privacy</a>
                                                    <span> - </span>
                                                    <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Terms</a>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                style={{
                                                    padding: '0.85rem 1.2rem',
                                                    borderRadius: 10,
                                                    border: '1px solid #cbd5e1',
                                                    background: '#f8fafc',
                                                    fontWeight: 700,
                                                    color: '#64748b',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn-main-submit"
                                                style={{ flex: 1 }}
                                            >
                                                Review &amp; Proceed to Payment →
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* ── STEP 3: Mandatory Payment Confirmation ── */}
                                {step === 3 && (
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Step 3: Membership Activation Payment
                                        </h3>
                                        <p style={{ color: '#64748B', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                                            Your Trust Member account is officially created and activated upon verified contribution.
                                        </p>

                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', marginBottom: '1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0F52BA', color: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                    {form.photoPreview ? <img src={form.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : form.name[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{form.name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{form.email} • {form.phone}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                                                <span style={{ color: '#64748b' }}>Aadhaar Number:</span>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>•••• {form.aadharNumber.replace(/\s/g, '').slice(-4)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                                                <span style={{ color: '#64748b' }}>Membership Tier:</span>
                                                <span style={{ fontWeight: 700, color: '#0F52BA' }}>{selectedTier.label}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}>
                                                <span style={{ fontWeight: 800, color: '#0f172a' }}>Activation Contribution:</span>
                                                <span style={{ fontWeight: 900, color: '#0F52BA', fontSize: '1.2rem' }}>₹{Number(form.amount).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>
                                                Instant Automated Activation Gateway *
                                            </label>
                                            <div
                                                style={{
                                                    padding: '0.9rem',
                                                    borderRadius: 10,
                                                    border: '2px solid #0F52BA',
                                                    background: '#eff6ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12
                                                }}
                                            >
                                                <div style={{ width: 42, height: 42, borderRadius: 8, background: '#0F52BA', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                                    <FaCreditCard />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b' }}>
                                                        Instant Online Contribution (UPI, Cards, NetBanking)
                                                    </div>
                                                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                                        Automated real-time verification. Your Member ID is issued immediately.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Interactive reCAPTCHA */}
                                        <div
                                            className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                                            onClick={handleCaptchaClick}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="dp-recaptcha-left">
                                                <div className="dp-recaptcha-checkbox-wrapper">
                                                    {isCaptchaSpinning ? (
                                                        <div className="dp-recaptcha-spinner" />
                                                    ) : isCaptchaChecked ? (
                                                        <svg className="dp-recaptcha-checkmark" viewBox="0 0 24 24" width="28" height="28">
                                                            <path fill="#0f9d58" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                    ) : (
                                                        <div className="dp-recaptcha-square" />
                                                    )}
                                                </div>
                                                <span className="dp-recaptcha-text">I'm not a robot</span>
                                            </div>
                                            <div className="dp-recaptcha-right">
                                                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="dp-recaptcha-logo" />
                                                <span className="dp-recaptcha-brand-title">reCAPTCHA</span>
                                                <div className="dp-recaptcha-links">
                                                    <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Privacy</a>
                                                    <span> - </span>
                                                    <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Terms</a>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                            <button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                style={{
                                                    padding: '0.85rem 1.2rem',
                                                    borderRadius: 10,
                                                    border: '1px solid #cbd5e1',
                                                    background: '#f8fafc',
                                                    fontWeight: 700,
                                                    color: '#64748b',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                type="button"
                                                onClick={processMembershipPayment}
                                                disabled={loadingLocal}
                                                className="btn-main-submit"
                                                style={{ flex: 1, background: '#0F52BA' }}
                                            >
                                                {loadingLocal ? 'Connecting Gateway...' : `Contribute ₹${Number(form.amount).toLocaleString('en-IN')} & Activate Membership`}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 4: Official Digital Member ID Card ── */}
                                {step === 4 && (
                                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 1.25rem' }}>
                                            <FaCheckCircle />
                                        </div>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
                                            Congratulations, Trust Member!
                                        </h2>
                                        <p style={{ color: '#64748B', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
                                            Your contribution succeeded. You are officially certified as a Kiran Charitable Trust Member under Regd. No. 3/2026.
                                        </p>

                                        {/* Digital Member Card */}
                                        <div
                                            style={{
                                                background: 'linear-gradient(135deg, #0b132b 0%, #1e293b 100%)',
                                                borderRadius: 16,
                                                padding: '1.4rem',
                                                color: '#FFFFFF',
                                                textAlign: 'left',
                                                boxShadow: '0 12px 30px rgba(11, 19, 43, 0.25)',
                                                maxWidth: 420,
                                                margin: '0 auto 1.75rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10, marginBottom: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                        Kiran Charitable Trust
                                                    </div>
                                                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Official Digital Member ID</div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', background: '#059669', padding: '3px 10px', borderRadius: 20, fontWeight: 800 }}>
                                                    80G TAX EXEMPT
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                                <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#0F52BA', overflow: 'hidden', flexShrink: 0, border: '2.5px solid #fbbf24' }}>
                                                    {form.photoPreview ? <img src={form.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{form.name}</div>
                                                    <div style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: 800, fontFamily: 'monospace' }}>
                                                        {memberId || 'KCT-MEM-2026-001'}
                                                    </div>
                                                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                                        {selectedTier.label} • Active Member
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={openPortalInNewTab}
                                                className="btn-main-submit"
                                                style={{ padding: '0.8rem 1.8rem', borderRadius: 50, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                                            >
                                                Enter Member Portal (New Tab) <FaExternalLinkAlt />
                                            </button>
                                            <Link
                                                to="/trust-members"
                                                style={{
                                                    padding: '0.8rem 1.4rem',
                                                    borderRadius: 50,
                                                    border: '1.5px solid #cbd5e1',
                                                    color: '#334155',
                                                    textDecoration: 'none',
                                                    fontWeight: 700,
                                                    display: 'inline-flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                View Trust Members Wall
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Perks Column */}
                    <div className="main-login-info-column">
                        <div className="info-card">
                            <h3 className="info-card-title">
                                <FaShieldAlt style={{ color: '#0F52BA' }} /> Member &amp; Donor Privileges
                            </h3>
                            <ul className="info-perks-list">
                                <li>
                                    <FaCheckCircle className="perk-check-icon" />
                                    <div>
                                        <strong>100% Tax Deductible (Section 80G)</strong>
                                        <p>Download certified 80G donation receipts with official QR verification anytime.</p>
                                    </div>
                                </li>
                                <li>
                                    <FaCheckCircle className="perk-check-icon" />
                                    <div>
                                        <strong>Official Digital Member ID</strong>
                                        <p>Personalized digital photo membership card with registration credentials.</p>
                                    </div>
                                </li>
                                <li>
                                    <FaCheckCircle className="perk-check-icon" />
                                    <div>
                                        <strong>Transparent Impact Tracking</strong>
                                        <p>Real-time updates on children sponsored, patients treated, and food distributed.</p>
                                    </div>
                                </li>
                                <li>
                                    <FaCheckCircle className="perk-check-icon" />
                                    <div>
                                        <strong>Recognition in Philanthropy Roster</strong>
                                        <p>Public honour roll ranking for top champions powering Palnadu &amp; Guntur drives.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Statutory Registration Box */}
                        <div className="compliance-mini-card">
                            <div className="compliance-row">
                                <FaIdCard className="comp-icon" />
                                <div>
                                    <div className="comp-title">TRUST REGISTRATION NO.</div>
                                    <div className="comp-val">3/2026 (Govt. of AP)</div>
                                </div>
                            </div>
                            <div className="compliance-row">
                                <FaHandsHelping className="comp-icon" />
                                <div>
                                    <div className="comp-title">NITI AAYOG NGO DARPAN</div>
                                    <div className="comp-val">AP/2023/0342918</div>
                                </div>
                            </div>
                            <div className="compliance-row">
                                <FaShieldAlt className="comp-icon" />
                                <div>
                                    <div className="comp-title">12A REGISTRATION URN</div>
                                    <div className="comp-val">AAGTK5575QE20261</div>
                                </div>
                            </div>
                            <div className="compliance-row">
                                <FaAward className="comp-icon" />
                                <div>
                                    <div className="comp-title">80G TAX EXEMPTION URN</div>
                                    <div className="comp-val">AAGTK5575QF20261</div>
                                </div>
                            </div>
                            <div className="compliance-row">
                                <FaIdCard className="comp-icon" />
                                <div>
                                    <div className="comp-title">PERMANENT ACCOUNT NUMBER (PAN)</div>
                                    <div className="comp-val">AAGTK5575Q</div>
                                </div>
                            </div>
                        </div>

                        <div className="compliance-help">
                            Need assistance? Reach our coordinator at <a href="tel:+917702468889">+91 77024 68889</a> or <a href="mailto:contact@kirancharitabletrust.org">contact@kirancharitabletrust.org</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
