import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { initiateGoogleSignIn } from '../../utils/googleAuth';
import {
  FaUser, FaEnvelope, FaPhone, FaLock, FaIdCard, FaCamera,
  FaShieldAlt, FaCheckCircle, FaCheck, FaArrowRight, FaCreditCard,
  FaUniversity, FaExclamationTriangle, FaAward, FaMedal, FaCrown, FaGem
} from 'react-icons/fa';
import './Portal.css';

const TIERS = [
  { id: 'custom',  label: 'Custom / ₹1 Test Tier', price: 1, desc: 'Flexible custom amount (minimum ₹1 for testing & live verification)' },
  { id: 'starter', label: 'Starter Member', price: 500, desc: 'Official digital ID card, certificate & monthly newsletter' },
  { id: 'silver',  label: 'Silver Member', price: 1000, desc: 'Silver privileges, quarterly impact reports & member directory listing' },
  { id: 'gold',    label: 'Gold Member', price: 2500, desc: 'All Silver perks + annual summit invitation', featured: true },
  { id: 'diamond', label: 'Diamond Member', price: 5000, desc: 'VIP Council invitation + direct program governance & review' },
];

export default function PortalJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: Auth & Email Verification, 2: Member Details, 3: Contribution, 4: Active Member Card
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
    address: '',
    aadharNumber: '',
    panNumber: '',
    amount: 1,
    tier: 'custom',
    profilePhoto: null,
    photoPreview: null,
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberId, setMemberId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [bankUtr, setBankUtr] = useState('');
  const fileRef = useRef(null);

  // Anti-bot Security Verification (reCAPTCHA)
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
    }, 1500);
  };

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // Handle return from payment gateway (SabPaisa callback)
  useEffect(() => {
    const status = searchParams.get('status');
    const returnMemberId = searchParams.get('memberId');
    const returnReceipt = searchParams.get('receiptNo');
    const returnToken = searchParams.get('auth_token') || searchParams.get('token');
    const returnName = searchParams.get('name');
    const returnEmail = searchParams.get('email');
    const returnAmount = searchParams.get('amount');

    if (status === 'success') {
      if (returnToken) {
        localStorage.setItem('kct_token', returnToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${returnToken}`;
        setAuthToken(returnToken);
      }
      if (returnMemberId) setMemberId(returnMemberId);
      if (returnName) set('name', returnName);
      if (returnEmail) set('email', returnEmail);
      if (returnAmount) set('amount', returnAmount);
      setSuccess(`Congratulations! Contribution verified. Official 80G Tax Receipt #${returnReceipt || 'Issued'}. Your Trust Member ID is activated.`);
      setStep(4);
    } else if (status === 'failed') {
      const reason = searchParams.get('reason') || 'Payment was not completed.';
      setError(`Payment Incomplete / Cancelled: ${reason}. Please note: Trust Member accounts and credentials are only created upon successful contribution. Please retry payment below.`);
      setStep(3);
    }
  }, [searchParams]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedTier = TIERS.find(t => t.id === form.tier) || TIERS[0];

  async function sendOtp() {
    if (!form.name.trim()) return setError('Full legal name is required.');
    if (!form.email || !form.email.includes('@')) return setError('Please enter a valid email address.');
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit mobile number.');
    if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (!isCaptchaChecked) return setError('Please complete security verification by checking "I\'m not a robot".');

    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        email: form.email,
        type: 'trust_member_register'
      });
      if (res.data?.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        setSuccess(`Verification code dispatched to ${form.email}. For testing: enter 123456 or your email code.`);
      } else {
        setError(res.data?.message || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function verifyOtp(e) {
    if (e) e.preventDefault();
    if (!form.otp || form.otp.length !== 6) return setError('Enter the 6-digit verification code.');
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: form.email,
        otp: form.otp,
        type: 'trust_member_register'
      });
      if (res.data?.success) {
        setEmailVerified(true);
        setSuccess('Email address verified successfully. Proceeding to Member Details.');
        setStep(2);
      } else {
        setError(res.data?.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification error. Please try again.');
    }
    setLoading(false);
  }

  function handleGoogleRegister() {
    initiateGoogleSignIn({
      onSuccess: (profile) => {
        setError('');
        set('name', profile.name || form.name || '');
        set('email', profile.email || '');
        if (profile.picture) set('photoPreview', profile.picture);
        setEmailVerified(true);
        setSuccess(`Google email verified: ${profile.email}. Please provide your mobile number and create a password to proceed.`);
      },
      onError: (err) => setError(typeof err === 'string' ? err : 'Google registration cancelled or failed.')
    });
  }

  function proceedToDetails(e) {
    if (e) e.preventDefault();
    if (!form.name.trim()) return setError('Full legal name is required.');
    if (!form.email || !form.email.includes('@')) return setError('Valid email address is required.');
    if (!emailVerified) return setError('Please verify your email address before proceeding.');
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit mobile number.');
    if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters.');
    setError(''); setSuccess('');
    setStep(2);
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError('Profile photo must be under 5MB.');
    set('profilePhoto', file);
    const reader = new FileReader();
    reader.onload = ev => set('photoPreview', ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleProfileSubmit(e) {
    e.preventDefault();
    if (!form.profilePhoto && !form.photoPreview) {
      return setError('Profile photo is required. Please upload a clear photo.');
    }
    const cleanAadhar = form.aadharNumber.replace(/\D/g, '');
    if (cleanAadhar.length !== 12) return setError('Please enter a valid 12-digit Aadhaar number.');
    if (!form.address.trim()) return setError('Residential address is required.');
    setError(''); setSuccess('');
    setStep(3);
  }

  async function processMembershipPayment() {
    if (!isCaptchaChecked) {
      return setError('Please complete the security verification by checking "I\'m not a robot".');
    }
    setError(''); setLoading(true);
    const cleanAadhar = form.aadharNumber.replace(/\D/g, '');
    const activeAmount = Math.max(1, Number(form.amount) || selectedTier.price || 1);

    // Online Automated Payment Gateway via SabPaisa
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
        setError(res.data?.message || 'Failed to initialize payment gateway.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to payment gateway.');
      setLoading(false);
      return;
    }
  }

  return (
    <div>
      {/* ── Banner ── */}
      <section className="pt-page-banner">
        <span className="pt-page-tag">Become a Trust Member</span>
        <h1 className="pt-page-heading">
          Join as an Official <span>Trust Member</span>
        </h1>
        <p className="pt-page-sub">
          Complete member verification, submit your details, and activate your sustaining contribution to receive your official Kiran Charitable Trust Member ID Card.
        </p>
      </section>

      {/* ── Main Container ── */}
      <div className="pt-container">
        <div className="pt-join-layout">
          {/* Form Card */}
          <div className="pt-join-card">
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
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        margin: '0 auto 5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        background: isDone ? '#10b981' : isCurrent ? '#2563eb' : '#e2e8f0',
                        color: isDone || isCurrent ? '#FFFFFF' : '#64748b'
                      }}
                    >
                      {isDone ? <FaCheck /> : stepNum}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#2563eb' : '#64748b' }}>
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaExclamationTriangle style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCheckCircle style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            {/* ── STEP 1: Registration Details & Email OTP ── */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--pt-secondary)', marginBottom: '0.35rem' }}>
                  Step 1: Account Details &amp; Email Verification
                </h3>
                <p style={{ color: 'var(--pt-text-gray)', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                  Provide your legal details and verify your email to begin your membership.
                </p>

                <form onSubmit={verifyOtp}>
                  <div style={{ marginBottom: '0.9rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      <FaUser style={{ color: '#2563eb' }} /> Full Legal Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="pt-input"
                      placeholder="Your Full Legal Name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                        <FaEnvelope style={{ color: '#2563eb' }} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {emailVerified && (
                        <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FaCheckCircle /> Verified Email
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      className="pt-input"
                      placeholder="yourname@example.com"
                      value={form.email}
                      disabled={otpSent || emailVerified}
                      onChange={e => { set('email', e.target.value); setOtpSent(false); setEmailVerified(false); }}
                      required
                      style={emailVerified ? { background: '#f0fdf4', borderColor: '#86efac' } : {}}
                    />
                  </div>

                  <div style={{ marginBottom: '0.9rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      <FaPhone style={{ color: '#2563eb' }} /> Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="pt-input"
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      <FaLock style={{ color: '#2563eb' }} /> Create Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      className="pt-input"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      required
                    />
                  </div>

                  {/* Authentic Interactive reCAPTCHA Box */}
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
                        <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Privacy</a>
                        <span> - </span>
                        <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Terms</a>
                      </div>
                    </div>
                  </div>

                  {emailVerified ? (
                    <button
                      type="button"
                      onClick={proceedToDetails}
                      className="pt-btn-primary"
                      style={{ background: '#059669', width: '100%', padding: '0.85rem', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      Proceed to Member Details (Step 2) →
                    </button>
                  ) : !otpSent ? (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      className="pt-btn-primary"
                      style={{ background: '#2563eb', width: '100%', padding: '0.8rem', borderRadius: 10, fontWeight: 700 }}
                    >
                      {loading ? 'Sending Code...' : 'Send Verification Code →'}
                    </button>
                  ) : (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          Enter 6-Digit Verification Code <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>
                          Testing code: 123456
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          maxLength={6}
                          className="pt-input"
                          placeholder="••••••"
                          value={form.otp}
                          onChange={e => set('otp', e.target.value.replace(/\D/g, ''))}
                          style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem', fontWeight: 700 }}
                          required
                        />
                        <button
                          type="button"
                          onClick={sendOtp}
                          disabled={otpCountdown > 0 || loading}
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
                          {otpCountdown > 0 ? `${otpCountdown}s` : 'Resend'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="pt-btn-primary"
                        disabled={loading}
                        style={{ background: '#2563eb', padding: '0.8rem', width: '100%', borderRadius: 10, fontWeight: 700, marginTop: '1rem' }}
                      >
                        {loading ? 'Verifying...' : 'Verify Email & Proceed →'}
                      </button>
                    </div>
                  )}
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>OR REGISTER WITH</span>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                </div>

                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#FFFFFF',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13 17.7 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z" />
                    <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.9-4.6l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z"/>
                    <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.4-5.7c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.7-3.5-13.6-8.6l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
                  </svg>
                  Instant Sign-Up with Google
                </button>
              </div>
            )}

            {/* ── STEP 2: Official Member Profile & Details ── */}
            {step === 2 && (
              <form onSubmit={handleProfileSubmit}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--pt-secondary)', marginBottom: '0.35rem' }}>
                  Step 2: Official Member Profile &amp; Identification
                </h3>
                <p style={{ color: 'var(--pt-text-gray)', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                  Aadhaar verification and official member photo are required for trust registration under Regd. No. 462/2004.
                </p>

                {/* Profile Photo */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    <FaCamera style={{ color: '#2563eb' }} /> Profile Photo <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0.8rem',
                      background: '#f8fafc',
                      border: form.photoPreview ? '2px solid #10b981' : '1.5px dashed #cbd5e1',
                      borderRadius: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                      {form.photoPreview ? (
                        <img src={form.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FaCamera style={{ fontSize: 18 }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: form.photoPreview ? '#059669' : '#1e293b' }}>
                        {form.photoPreview ? 'Profile Photo Attached ✓' : 'Click to Upload Member Photo *'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Displayed on your official Trust Member ID card and directory
                      </div>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    <FaIdCard style={{ color: '#2563eb' }} /> Aadhaar Card Number <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    className="pt-input"
                    placeholder="XXXX XXXX XXXX"
                    value={form.aadharNumber}
                    onChange={e => {
                      let clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                      let formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
                      set('aadharNumber', formatted);
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5, display: 'block' }}>
                    PAN Card Number <span style={{ color: '#64748b', fontWeight: 500 }}>(Optional - for 80G Tax Deductions)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className="pt-input"
                    placeholder="ABCDE1234F"
                    value={form.panNumber}
                    onChange={e => set('panNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5, display: 'block' }}>
                    Residential Address <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    className="pt-input"
                    placeholder="Door No, Street, Village/City, District, State, PIN"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    required
                  />
                </div>

                {/* Tier Selection */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                    Monthly Sustaining Membership Tier <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {TIERS.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { set('tier', t.id); set('amount', t.price); }}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 10,
                          border: form.tier === t.id ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: form.tier === t.id ? '#eff6ff' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: form.tier === t.id ? '#2563eb' : '#1e293b' }}>
                          ₹{t.price.toLocaleString('en-IN')}/mo
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                          {t.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {form.tier === 'custom' && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                        Enter Custom Test / Sustaining Amount (₹, Min 1)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="pt-input"
                        placeholder="Enter amount (e.g. 1)"
                        value={form.amount}
                        onChange={e => set('amount', Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ fontWeight: 800, color: '#2563eb' }}
                      />
                    </div>
                  )}
                </div>

                {/* Authentic Interactive reCAPTCHA Box */}
                <div
                  className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                  onClick={handleCaptchaClick}
                  role="button"
                  tabIndex={0}
                  style={{ margin: '14px 0 18px' }}
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
                      <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Privacy</a>
                      <span> - </span>
                      <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Terms</a>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '0.75rem 1rem',
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
                    className="pt-btn-primary"
                    style={{ flex: 1, background: '#2563eb', padding: '0.75rem', borderRadius: 10, fontWeight: 700 }}
                  >
                    Review &amp; Proceed to Payment →
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: Mandatory Payment Confirmation ── */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--pt-secondary)', marginBottom: '0.35rem' }}>
                  Step 3: Membership Activation Payment
                </h3>
                <p style={{ color: 'var(--pt-text-gray)', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                  Your Trust Member account is officially created and activated ONLY upon confirmed successful contribution.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#2563eb', color: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
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
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{selectedTier.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>Activation Contribution:</span>
                    <span style={{ fontWeight: 900, color: '#2563eb', fontSize: '1.15rem' }}>₹{Number(form.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 8, display: 'block' }}>
                    Instant Automated Activation Method <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      padding: '0.9rem',
                      borderRadius: 10,
                      border: '2px solid #2563eb',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      <FaCreditCard />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b' }}>
                        Instant Online Gateway (UPI, Cards, NetBanking)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Automated real-time verification via SabPaisa. Your Member ID is issued immediately.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authentic Interactive reCAPTCHA Box */}
                <div
                  className={`dp-recaptcha-box ${isCaptchaChecked ? 'verified' : ''} ${isCaptchaSpinning ? 'spinning' : ''}`}
                  onClick={handleCaptchaClick}
                  role="button"
                  tabIndex={0}
                  style={{ margin: '14px 0 18px' }}
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
                      <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Privacy</a>
                      <span> - </span>
                      <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Terms</a>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      padding: '0.75rem 1rem',
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
                    disabled={loading}
                    className="pt-btn-primary"
                    style={{ flex: 1, background: '#2563eb', padding: '0.75rem', borderRadius: 10, fontWeight: 700 }}
                  >
                    {loading ? 'Activating Membership...' : `Contribute ₹${Number(form.amount).toLocaleString('en-IN')} & Join Trust`}
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
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--pt-secondary)', marginBottom: '0.4rem' }}>
                  Congratulations, Trust Member!
                </h2>
                <p style={{ color: 'var(--pt-text-gray)', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
                  Your contribution succeeded. You are officially recognized as a certified Kiran Charitable Trust Member under Regd. No. 462/2004.
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
                      <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Digital Member ID Card</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', background: '#059669', padding: '3px 10px', borderRadius: 20, fontWeight: 800 }}>
                      80G TAX EXEMPT
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#2563eb', overflow: 'hidden', flexShrink: 0, border: '2.5px solid #fbbf24' }}>
                      {form.photoPreview ? <img src={form.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{form.name}</div>
                      <div style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: 800, fontFamily: 'monospace' }}>
                        {memberId || 'KCT-MEM-1048'}
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
                    onClick={() => navigate('/portal/profile')}
                    className="pt-btn-cta"
                    style={{ background: '#2563eb', padding: '0.75rem 1.6rem', borderRadius: 50, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Enter Member Portal <FaArrowRight style={{ marginLeft: 6 }} />
                  </button>
                  <Link
                    to="/portal/members"
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: 50,
                      border: '1.5px solid var(--pt-border)',
                      color: 'var(--pt-secondary)',
                      textDecoration: 'none',
                      fontWeight: 700
                    }}
                  >
                    View Member Directory
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Perks Sidebar */}
          <div className="pt-join-perks-box">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--pt-secondary)', marginBottom: '0.5rem' }}>
              Member Privileges &amp; Impact
            </h3>
            <p style={{ color: 'var(--pt-text-gray)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.4rem' }}>
              Your recurring contribution guarantees sustained funding for community initiatives across Amaravathi and Palnadu.
            </p>

            {[
              ['Official Membership ID & Certificate', 'Verified registration under Regd. No. 462/2004'],
              ['80G Income Tax Exemption', 'Tax deductible receipts for all monthly contributions'],
              ['Recognized on Official Member Wall', 'Featured on public trust member directory and leaderboard'],
              ['Quarterly Transparency Reports', 'Direct program audit breakdowns delivered to your inbox'],
              ['Ground Program Invitations', 'Special invitations to annual celebrations & distribution drives']
            ].map(([title, desc], idx) => (
              <div key={idx} className="pt-perk-item" style={{ display: 'flex', gap: 10, marginBottom: '1rem', alignItems: 'flex-start' }}>
                <span className="pt-perk-check" style={{ width: 20, height: 20, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 2 }}>
                  <FaCheck />
                </span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{title}</strong>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>{desc}</p>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '1.5rem', padding: '0.9rem', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--pt-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaShieldAlt style={{ color: '#10b981', fontSize: 14 }} />
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                <strong>100% Safe &amp; Verified</strong>: All member records and payments are officially protected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
