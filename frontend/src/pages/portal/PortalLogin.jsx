import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { initiateGoogleSignIn } from '../../utils/googleAuth';
import {
  FaUser, FaEnvelope, FaPhone, FaLock, FaIdCard, FaCamera,
  FaShieldAlt, FaCheckCircle, FaTimes, FaArrowRight, FaCreditCard,
  FaQrcode, FaUniversity, FaExclamationTriangle, FaCheck, FaInfoCircle
} from 'react-icons/fa';
import './Portal.css';

const TIERS = [
  { id: 'starter', label: 'Starter Member', price: 500, desc: 'Official digital ID card, certificate & monthly newsletter' },
  { id: 'silver', label: 'Silver Member', price: 1000, desc: 'Silver privileges, quarterly impact reports & member directory listing' },
  { id: 'gold', label: 'Gold Member', price: 2500, desc: 'All Silver perks + annual summit invitation', featured: true },
  { id: 'diamond', label: 'Diamond Member', price: 5000, desc: 'VIP Council invitation + direct program governance & review' },
];

export default function PortalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithPassword, sendOtp, verifyOtp, loginWithGoogle, user, isAuthenticated } = useAuth();

  // Primary Tab: 'signin' | 'register'
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'signin';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sign In State
  const [signInMode, setSignInMode] = useState('otp'); // 'otp' | 'password'
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInOtp, setSignInOtp] = useState('');
  const [signInOtpSent, setSignInOtpSent] = useState(false);
  const [signInOtpCountdown, setSignInOtpCountdown] = useState(0);

  // Register State (4-Step Flow)
  const [regStep, setRegStep] = useState(1); // 1: Basic & Email OTP, 2: Mandatory KYC, 3: Mandatory Payment, 4: Active Member Card
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCountdown, setRegOtpCountdown] = useState(0);
  const [regEmailVerified, setRegEmailVerified] = useState(false);
  const [regAuthToken, setRegAuthToken] = useState('');

  // Step 2 KYC State
  const [regAadhar, setRegAadhar] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [selectedTier, setSelectedTier] = useState('starter');
  const [contributionAmount, setContributionAmount] = useState(500);
  const fileInputRef = useRef(null);

  // Step 3 Payment State
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'bank_transfer'
  const [bankUtr, setBankUtr] = useState('');
  const [activeCheckoutUrl, setActiveCheckoutUrl] = useState('');
  const [createdMember, setCreatedMember] = useState(null);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register' || tab === 'join') {
      navigate('/portal/join');
      return;
    }
    if (tab === 'signin' || tab === 'login') setActiveTab('signin');

    const reason = searchParams.get('reason');
    if (reason === 'account_trashed') {
      setError('Your account has been moved to the 30-day trash bin by the administrator. Active session was terminated.');
    } else if (reason === 'session_expired') {
      setError('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  // OTP Countdown Timers
  useEffect(() => {
    if (signInOtpCountdown <= 0) return;
    const t = setTimeout(() => setSignInOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [signInOtpCountdown]);

  useEffect(() => {
    if (regOtpCountdown <= 0) return;
    const t = setTimeout(() => setRegOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [regOtpCountdown]);

  if (isAuthenticated && user && regStep !== 4) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="pt-auth-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 1.25rem' }}>
            <FaCheckCircle />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
            Session Active
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Signed in as <strong>{user.name}</strong> ({user.email})
          </p>
          <button
            type="button"
            className="pt-btn-primary"
            onClick={() => navigate(user.role === 'admin' ? '/admin' : '/portal/profile')}
          >
            Enter {user.role === 'admin' ? 'Administration' : 'Trust Member Portal'} <FaArrowRight style={{ marginLeft: 6 }} />
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // SIGN IN HANDLERS
  // ============================================================
  async function handleSendSignInOtp() {
    if (!signInEmail || !signInEmail.includes('@')) {
      return setError('Please enter a valid email address.');
    }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await sendOtp(signInEmail);
      if (res.success) {
        setSignInOtpSent(true);
        setSignInOtpCountdown(60);
        setSuccess(`Verification code sent to ${signInEmail}`);
      } else {
        setError(res.message || 'Failed to send verification code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function handleVerifySignInOtp(e) {
    e.preventDefault();
    if (!signInOtp || signInOtp.length !== 6) {
      return setError('Please enter the 6-digit verification code.');
    }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await verifyOtp({ email: signInEmail, otp: signInOtp });
      if (res.success) {
        if (res.user?.role === 'admin') navigate('/admin');
        else navigate('/portal/profile');
      } else {
        setError(res.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      return setError('Please enter both email and password.');
    }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await loginWithPassword({ email: signInEmail, password: signInPassword });
      if (res.success) {
        if (res.user?.role === 'admin') navigate('/admin');
        else navigate('/portal/profile');
      } else {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  // ============================================================
  // REGISTER STEP 1: Details & OTP Verification
  // ============================================================
  async function handleSendRegOtp() {
    if (!regName.trim()) return setError('Full legal name is required.');
    if (!regEmail || !regEmail.includes('@')) return setError('Enter a valid email address.');
    if (!regPhone || regPhone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit mobile number.');
    if (!regPassword || regPassword.length < 6) return setError('Password must be at least 6 characters.');

    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        email: regEmail,
        type: 'trust_member_register'
      });
      if (res.data?.success) {
        setRegOtpSent(true);
        setRegOtpCountdown(60);
        setSuccess(`Verification code sent to ${regEmail}`);
      } else {
        setError(res.data?.message || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function handleVerifyRegOtp(e) {
    e.preventDefault();
    if (!regOtp || regOtp.length !== 6) return setError('Enter the 6-digit verification code.');
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: regEmail,
        otp: regOtp,
        type: 'trust_member_register'
      });
      if (res.data?.success) {
        setRegEmailVerified(true);
        setRegAuthToken(res.data.token || '');
        setSuccess('Email address verified successfully.');
        setRegStep(2);
      } else {
        setError(res.data?.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    }
    setLoading(false);
  }

  // Google OAuth Handler (Auto-verifies email and progresses to Step 2)
  function handleGoogleRegister() {
    initiateGoogleSignIn({
      onSuccess: async (profile) => {
        setLoading(true);
        setError('');
        try {
          const res = await loginWithGoogle({
            credential: profile.credential,
            email: profile.email,
            name: profile.name,
            avatar: profile.picture,
            intent: 'register'
          });
          if (res?.success) {
            setRegName(profile.name || res.user?.name || '');
            setRegEmail(profile.email || res.user?.email || '');
            setRegEmailVerified(true);
            if (profile.picture) setPhotoPreview(profile.picture);
            setRegAuthToken(res.token || '');
            setRegStep(2);
          } else {
            setError(res?.message || 'Google registration failed.');
          }
        } catch (err) {
          setError('Google authentication encountered an error.');
        }
        setLoading(false);
      },
      onError: (err) => setError(typeof err === 'string' ? err : 'Google Sign-in failed.')
    });
  }

  // ============================================================
  // REGISTER STEP 2: Mandatory Member KYC Details
  // ============================================================
  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return setError('Profile photo must be less than 5MB.');
    }
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleAadharInput(e) {
    let clean = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setRegAadhar(formatted);
  }

  function handleKycSubmit(e) {
    e.preventDefault();
    const rawAadhar = regAadhar.replace(/\s/g, '');
    if (!profilePhotoFile && !photoPreview) {
      return setError('Profile photo is mandatory. Please upload a clear photo.');
    }
    if (rawAadhar.length !== 12) {
      return setError('Aadhaar number must be exactly 12 digits.');
    }
    if (!regAddress.trim()) {
      return setError('Residential address is mandatory.');
    }
    setError(''); setSuccess('');
    setRegStep(3);
  }

  // ============================================================
  // REGISTER STEP 3: Mandatory Payment & Account Creation
  // ============================================================
  async function handleFinalizeMembership() {
    setError(''); setLoading(true);
    const rawAadhar = regAadhar.replace(/\s/g, '');
    const activeTierObj = TIERS.find(t => t.id === selectedTier) || TIERS[0];
    const finalAmount = Math.max(100, Number(contributionAmount) || activeTierObj.price);

    if (paymentMethod === 'bank_transfer') {
      const cleanUtr = bankUtr.trim();
      if (!cleanUtr || cleanUtr.length < 8) {
        setLoading(false);
        return setError('Please enter a valid 12-digit Bank Transaction / UTR Reference number.');
      }
    }

    try {
      const fd = new FormData();
      fd.append('name', regName);
      fd.append('email', regEmail);
      fd.append('phone', regPhone);
      fd.append('address', regAddress);
      fd.append('aadharNumber', rawAadhar);
      fd.append('panNumber', regPan.toUpperCase().trim());
      fd.append('donationAmount', finalAmount);
      fd.append('subscriptionTier', `${activeTierObj.label} (₹${finalAmount}/mo)`);
      fd.append('paymentMethod', paymentMethod === 'online' ? 'Online Payment' : 'Direct Bank Transfer / QR Code');
      fd.append('transactionId', paymentMethod === 'bank_transfer' ? bankUtr.trim() : `ONLINE-MEM-${Date.now()}`);

      if (profilePhotoFile) {
        fd.append('profilePhoto', profilePhotoFile);
      } else if (photoPreview && photoPreview.startsWith('http')) {
        fd.append('profilePhotoUrl', photoPreview);
      }

      const headers = { 'Content-Type': 'multipart/form-data' };
      if (regAuthToken) headers['Authorization'] = `Bearer ${regAuthToken}`;

      const res = await axios.post(`${API_BASE_URL}/trust-members/register`, fd, { headers });

      if (res.data?.success) {
        setCreatedMember(res.data.member || {
          memberId: res.data.memberId || 'KCT-MEM-1048',
          name: regName,
          email: regEmail,
          subscriptionTier: `${activeTierObj.label} (₹${finalAmount}/mo)`
        });
        setRegStep(4);
      } else {
        setError(res.data?.message || 'Membership registration could not be completed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error. Please verify details and try again.');
    } finally {
      setLoading(false);
    }
  }

  const activeTierObj = TIERS.find(t => t.id === selectedTier) || TIERS[0];

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: regStep === 2 || regStep === 3 ? 560 : 460,
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 20px 45px -10px rgba(15, 82, 186, 0.18), 0 8px 20px -4px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Curved Blue Header matching screenshots */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#FFFFFF',
            padding: '1.6rem 1.6rem 1.4rem',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            title="Close"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'background 0.2s'
            }}
          >
            <FaTimes />
          </button>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Kiran Charitable Trust
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
            {activeTab === 'signin'
              ? 'Sign in to access receipts, updates and your profile'
              : 'Create a new supporter account to join our community'}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.6rem' }}>
          {/* Segmented Pill Switcher: [ Sign In ]  [ Register ] */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: 4,
              borderRadius: 12,
              marginBottom: '1.4rem'
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'signin' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'signin' ? '#1e293b' : '#64748b',
                boxShadow: activeTab === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/portal/join')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: 'transparent',
                color: '#64748b',
                transition: 'all 0.2s'
              }}
            >
              Register / Join →
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem 0.9rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaExclamationTriangle style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem 0.9rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaCheckCircle style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* ============================================================
              TAB 1: SIGN IN (EMAIL OTP OR PASSWORD)
             ============================================================ */}
          {activeTab === 'signin' && (
            <div>
              {/* Sub-mode: [ Email OTP ]  [ Password ] */}
              <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0', marginBottom: '1.4rem' }}>
                <button
                  type="button"
                  onClick={() => { setSignInMode('otp'); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0',
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: signInMode === 'otp' ? '#2563eb' : '#64748b',
                    borderBottom: signInMode === 'otp' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <FaEnvelope style={{ fontSize: 13 }} /> Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setSignInMode('password'); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0',
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: signInMode === 'password' ? '#2563eb' : '#64748b',
                    borderBottom: signInMode === 'password' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <FaLock style={{ fontSize: 13 }} /> Password
                </button>
              </div>

              {/* Mode A: Email OTP */}
              {signInMode === 'otp' && (
                <form onSubmit={handleVerifySignInOtp}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Registered Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="pt-input"
                      placeholder="yourname@example.com"
                      value={signInEmail}
                      onChange={e => { setSignInEmail(e.target.value); setSignInOtpSent(false); }}
                      required
                    />
                  </div>

                  {!signInOtpSent ? (
                    <button
                      type="button"
                      className="pt-btn-primary"
                      onClick={handleSendSignInOtp}
                      disabled={loading}
                      style={{ background: '#2563eb', padding: '0.8rem', width: '100%', borderRadius: 10, fontWeight: 700 }}
                    >
                      {loading ? 'Sending Verification Code...' : 'Send Verification Code →'}
                    </button>
                  ) : (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Enter 6-Digit Verification Code <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          maxLength={6}
                          className="pt-input"
                          placeholder="••••••"
                          value={signInOtp}
                          onChange={e => setSignInOtp(e.target.value.replace(/\D/g, ''))}
                          style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem', fontWeight: 700 }}
                          required
                        />
                        <button
                          type="button"
                          onClick={handleSendSignInOtp}
                          disabled={signInOtpCountdown > 0 || loading}
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
                          {signInOtpCountdown > 0 ? `${signInOtpCountdown}s` : 'Resend'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="pt-btn-primary"
                        disabled={loading}
                        style={{ background: '#2563eb', padding: '0.8rem', width: '100%', borderRadius: 10, fontWeight: 700, marginTop: '1.2rem' }}
                      >
                        {loading ? 'Verifying...' : 'Verify Code & Sign In →'}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Mode B: Password */}
              {signInMode === 'password' && (
                <form onSubmit={handlePasswordLogin}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Registered Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="pt-input"
                      placeholder="yourname@example.com"
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                        Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <Link to="/portal/forgot-password" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                        Forgot Password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      className="pt-input"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="pt-btn-primary"
                    disabled={loading}
                    style={{ background: '#2563eb', padding: '0.8rem', width: '100%', borderRadius: 10, fontWeight: 700 }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In →'}
                  </button>
                </form>
              )}

              {/* Divider: OR CONTINUE WITH */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => {
                  initiateGoogleSignIn({
                    onSuccess: async (profile) => {
                      setLoading(true);
                      const res = await loginWithGoogle({
                        credential: profile.credential,
                        email: profile.email,
                        name: profile.name,
                        avatar: profile.picture
                      });
                      setLoading(false);
                      if (res?.success) {
                        navigate(res.user?.role === 'admin' ? '/admin' : '/portal/profile');
                      } else {
                        setError(res?.message || 'Google sign-in failed.');
                      }
                    },
                    onError: (err) => setError(err)
                  });
                }}
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
                  gap: 8,
                  transition: 'background 0.2s'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13 17.7 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z" />
                  <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.9-4.6l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.4-5.7c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.7-3.5-13.6-8.6l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.4rem', fontSize: '0.85rem', color: '#64748b' }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/portal/join')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: '6px 8px', display: 'inline-block' }}
                >
                  Become a Member &amp; Register here →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: REGISTER (4-STEP COMPLETE PROGRESSION)
             ============================================================ */}
          {activeTab === 'register' && (
            <div>
              {/* Stepper Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                {['1. Verification', '2. Member Details', '3. Payment', '4. Member ID'].map((label, idx) => {
                  const stepNum = idx + 1;
                  const isDone = regStep > stepNum;
                  const isCurrent = regStep === stepNum;
                  return (
                    <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          margin: '0 auto 4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          background: isDone ? '#10b981' : isCurrent ? '#2563eb' : '#e2e8f0',
                          color: isDone || isCurrent ? '#FFFFFF' : '#64748b'
                        }}
                      >
                        {isDone ? <FaCheck /> : stepNum}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#2563eb' : '#64748b' }}>
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── STEP 1: Basic Information & Email OTP ── */}
              {regStep === 1 && (
                <div>
                  <form onSubmit={handleVerifyRegOtp}>
                    <div style={{ marginBottom: '0.9rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                        <FaUser style={{ color: '#2563eb', fontSize: 12 }} /> Full Legal Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="pt-input"
                        placeholder="Your Full Legal Name"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '0.9rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                        <FaEnvelope style={{ color: '#2563eb', fontSize: 12 }} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        className="pt-input"
                        placeholder="yourname@example.com"
                        value={regEmail}
                        disabled={regOtpSent}
                        onChange={e => { setRegEmail(e.target.value); setRegOtpSent(false); }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '0.9rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                        <FaPhone style={{ color: '#2563eb', fontSize: 12 }} /> Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="pt-input"
                        placeholder="10-digit mobile number"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                        <FaLock style={{ color: '#2563eb', fontSize: 12 }} /> Create Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="password"
                        className="pt-input"
                        placeholder="Min. 6 characters"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        required
                      />
                    </div>

                    {!regOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendRegOtp}
                        disabled={loading}
                        className="pt-btn-primary"
                        style={{ background: '#2563eb', width: '100%', padding: '0.8rem', borderRadius: 10, fontWeight: 700 }}
                      >
                        {loading ? 'Sending Code...' : 'Complete Registration →'}
                      </button>
                    ) : (
                      <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Enter 6-Digit Email Verification Code <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            maxLength={6}
                            className="pt-input"
                            placeholder="••••••"
                            value={regOtp}
                            onChange={e => setRegOtp(e.target.value.replace(/\D/g, ''))}
                            style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem', fontWeight: 700 }}
                            required
                          />
                          <button
                            type="button"
                            onClick={handleSendRegOtp}
                            disabled={regOtpCountdown > 0 || loading}
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
                          className="pt-btn-primary"
                          disabled={loading}
                          style={{ background: '#2563eb', padding: '0.8rem', width: '100%', borderRadius: 10, fontWeight: 700, marginTop: '1rem' }}
                        >
                          {loading ? 'Verifying...' : 'Verify Email & Proceed →'}
                        </button>
                      </div>
                    )}
                  </form>

                  {/* Divider: OR REGISTER WITH */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>OR REGISTER WITH</span>
                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  </div>

                  {/* Google Instant Sign-up */}
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

                  <div style={{ textAlign: 'center', marginTop: '1.4rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: '6px 8px', display: 'inline-block' }}
                    >
                      Sign in here
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Official Member Details & Identification ── */}
              {regStep === 2 && (
                <form onSubmit={handleKycSubmit}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.9rem', marginBottom: '1.1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                      Step 2: Member Details &amp; Identification
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                      Verified for: <strong>{regName}</strong> ({regEmail})
                    </div>
                  </div>

                  {/* Profile Photo (Mandatory) */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      <FaCamera style={{ color: '#2563eb' }} /> Profile Photo <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0.75rem',
                        background: '#f8fafc',
                        border: photoPreview ? '2px solid #10b981' : '1.5px dashed #cbd5e1',
                        borderRadius: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: '#e2e8f0',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          flexShrink: 0
                        }}
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FaCamera style={{ fontSize: 18 }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: photoPreview ? '#059669' : '#1e293b' }}>
                          {photoPreview ? 'Profile Photo Attached ✓' : 'Click to Upload Member Photo *'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Used for your official Digital Trust Member ID Card (Max 5MB)
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Aadhaar Number (Mandatory) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      <FaIdCard style={{ color: '#2563eb' }} /> Aadhaar Card Number <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      className="pt-input"
                      placeholder="XXXX XXXX XXXX"
                      value={regAadhar}
                      onChange={handleAadharInput}
                      required
                    />
                  </div>

                  {/* PAN Card (Optional for 80G) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5, display: 'block' }}>
                      PAN Card Number <span style={{ color: '#64748b', fontWeight: 500 }}>(Optional - for 80G Tax Deductions)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      className="pt-input"
                      placeholder="ABCDE1234F"
                      value={regPan}
                      onChange={e => setRegPan(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Residential Address (Mandatory) */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5, display: 'block' }}>
                      Residential Address <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                    </label>
                    <input
                      type="text"
                      className="pt-input"
                      placeholder="Door No, Street, Village/City, District, State, PIN"
                      value={regAddress}
                      onChange={e => setRegAddress(e.target.value)}
                      required
                    />
                  </div>

                  {/* Contribution Tier Selection */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                      Monthly Sustaining Membership Tier <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {TIERS.map(t => (
                        <div
                          key={t.id}
                          onClick={() => { setSelectedTier(t.id); setContributionAmount(t.price); }}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 10,
                            border: selectedTier === t.id ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                            background: selectedTier === t.id ? '#eff6ff' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: selectedTier === t.id ? '#2563eb' : '#1e293b' }}>
                            ₹{t.price.toLocaleString('en-IN')}/mo
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                            {t.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
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
                      Proceed to Payment →
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Mandatory Payment Confirmation ── */}
              {regStep === 3 && (
                <div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', marginBottom: '1.2rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 4 }}>
                      Step 3: Membership Activation Payment
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563eb', color: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : regName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{regName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{regEmail} • {regPhone}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Aadhaar Number:</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>•••• {regAadhar.replace(/\s/g, '').slice(-4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Membership Tier:</span>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>{activeTierObj.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>Activation Contribution:</span>
                      <span style={{ fontWeight: 900, color: '#2563eb', fontSize: '1.15rem' }}>₹{Number(contributionAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 8, display: 'block' }}>
                      Select Contribution Method <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div
                        onClick={() => setPaymentMethod('online')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: 10,
                          border: paymentMethod === 'online' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: paymentMethod === 'online' ? '#eff6ff' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <FaCreditCard style={{ fontSize: 18, color: '#2563eb', marginBottom: 4 }} />
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>Online Payment</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>UPI, Cards, NetBanking</div>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('bank_transfer')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: 10,
                          border: paymentMethod === 'bank_transfer' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: paymentMethod === 'bank_transfer' ? '#eff6ff' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <FaUniversity style={{ fontSize: 18, color: '#059669', marginBottom: 4 }} />
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>Direct Transfer / QR</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Canara Bank Transfer</div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Bank Transfer / QR instructions */}
                  {paymentMethod === 'bank_transfer' && (
                    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: '1rem', marginBottom: '1.2rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', marginBottom: 6 }}>
                        Official Trust Account Details (Canara Bank)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                        <div><strong>Account Name:</strong> KIRAN CHARITABLE TRUST</div>
                        <div><strong>Account No:</strong> 0638101053158</div>
                        <div><strong>IFSC Code:</strong> CNRB0000638</div>
                        <div><strong>UPI ID:</strong> 9392785230@ybl</div>
                      </div>

                      <div style={{ marginTop: '0.9rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          12-Digit Bank UTR / Transaction Reference Number <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="pt-input"
                          placeholder="e.g. 412356789012"
                          value={bankUtr}
                          onChange={e => setBankUtr(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
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
                      onClick={handleFinalizeMembership}
                      disabled={loading}
                      className="pt-btn-primary"
                      style={{ flex: 1, background: '#2563eb', padding: '0.75rem', borderRadius: 10, fontWeight: 700 }}
                    >
                      {loading ? 'Activating Membership...' : `Contribute ₹${Number(contributionAmount).toLocaleString('en-IN')} & Join Trust`}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Congratulations & Official Digital Member ID Card ── */}
              {regStep === 4 && (
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 1rem' }}>
                    <FaCheckCircle />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                    Congratulations, Trust Member!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                    Your contribution succeeded. You are now officially enrolled under Regd. No. 3/2026.
                  </p>

                  {/* Digital ID Card Preview */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0b132b 0%, #1e293b 100%)',
                      borderRadius: 14,
                      padding: '1.25rem',
                      color: '#FFFFFF',
                      textAlign: 'left',
                      boxShadow: '0 10px 25px rgba(11, 19, 43, 0.25)',
                      marginBottom: '1.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Kiran Charitable Trust
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Official Member ID Card</div>
                      </div>
                      <span style={{ fontSize: '0.68rem', background: '#059669', padding: '2px 8px', borderRadius: 20, fontWeight: 800 }}>
                        80G TAX EXEMPT
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#2563eb', overflow: 'hidden', flexShrink: 0, border: '2px solid #fbbf24' }}>
                        {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>{createdMember?.name || regName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>
                          {createdMember?.memberId || 'KCT-MEM-1048'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {createdMember?.subscriptionTier || activeTierObj.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="pt-btn-primary"
                      onClick={() => navigate('/portal/profile')}
                      style={{ flex: 1, background: '#2563eb', padding: '0.75rem', borderRadius: 10, fontWeight: 700 }}
                    >
                      Enter Member Portal <FaArrowRight style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Edge Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: '1.25rem',
              paddingTop: '0.9rem',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.74rem',
              color: '#64748b'
            }}
          >
            <FaShieldAlt style={{ color: '#10b981', fontSize: 11 }} />
            <span>100% Safe &amp; Verified Official Trust Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
