import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config';
import { toast } from 'react-toastify';
import { FaTimes, FaEnvelope, FaLock, FaCheckCircle, FaArrowRight, FaShieldAlt, FaUser, FaPhone, FaKey } from 'react-icons/fa';
import './AuthModal.css';

export default function AuthModal() {
    const navigate = useNavigate();
    const {
        isAuthModalOpen,
        closeAuthModal,
        authModalTab,
        sendOtp,
        verifyOtp,
        loginWithPassword,
        register,
        loginWithGoogle,
        isLoading
    } = useAuth();

    // Mode: 'login' | 'signup'
    const [authMode, setAuthMode] = useState(authModalTab === 'signup' ? 'signup' : 'login');
    // Login method: 'otp' | 'password' | 'google'
    const [loginMethod, setLoginMethod] = useState('otp');
    // Step for OTP: 'input' | 'verify'
    const [otpStep, setOtpStep] = useState('input');

    // Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [devOtpHint, setDevOtpHint] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [authErrorMessage, setAuthErrorMessage] = useState('');

    const otpInputRefs = useRef([]);

    useEffect(() => {
        if (authModalTab === 'signup' && isAuthModalOpen) {
            closeAuthModal();
            navigate('/portal/join');
            return;
        }
        setAuthMode('login');
        setOtpStep('input');
        setDevOtpHint('');
        setAuthErrorMessage('');
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setOtpDigits(['', '', '', '', '', '']);
    }, [authModalTab, isAuthModalOpen]);

    useEffect(() => {
        let timer = null;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    if (!isAuthModalOpen) return null;

    // --- Sign In: Send OTP ---
    const handleSendLoginOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        setAuthErrorMessage('');
        try {
            const res = await sendOtp(email);
            if (res?.success) {
                setOtpStep('verify');
                setCountdown(60);
                if (res.devOtp) setDevOtpHint(res.devOtp);
                toast.success(res.message || 'Verification code sent to your email.');
                setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
            } else {
                const msg = res?.message || 'Failed to send OTP code.';
                setAuthErrorMessage(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Error sending verification code';
            setAuthErrorMessage(msg);
            toast.error(msg);
        }
    };

    const redirectAfterAuth = (userObj) => {
        closeAuthModal();
        if (userObj?.role === 'admin') {
            window.open('/admin', '_blank');
        } else {
            // Open member portal in a new tab; main website stays untouched
            window.open('/portal/profile', '_blank');
        }
    };

    // --- Sign In: Verify OTP ---
    const handleVerifyLoginOtp = async (e) => {
        if (e) e.preventDefault();
        const code = otpDigits.join('');
        if (code.length !== 6) {
            toast.error('Please enter the 6-digit verification code');
            return;
        }
        setAuthErrorMessage('');
        try {
            const res = await verifyOtp({ email, otp: code });
            if (res?.success) {
                toast.success('Welcome back! Signed in successfully.');
                redirectAfterAuth(res.user);
            } else {
                const msg = res?.message || 'Invalid code';
                setAuthErrorMessage(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Verification failed. Please check code.';
            setAuthErrorMessage(msg);
            toast.error(msg);
        }
    };

    // --- Sign In: Password ---
    const handlePasswordSignIn = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please enter your email and password');
            return;
        }
        setAuthErrorMessage('');
        const res = await loginWithPassword({ email, password });
        if (res.success) {
            toast.success('Signed in successfully.');
            redirectAfterAuth(res.user);
        } else {
            const msg = res.message || 'Invalid credentials';
            setAuthErrorMessage(msg);
            toast.error(msg);
        }
    };

    // --- Register: Create Account ---
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Full name is required');
        if (!email.includes('@')) return toast.error('Valid email is required');
        if (!phone || phone.replace(/\D/g, '').length < 10) return toast.error('Valid 10-digit mobile number required');
        if (!password || password.length < 6) return toast.error('Password must be at least 6 characters');

        const res = await register({ name, email, phone, password });
        if (res.success) {
            toast.success('Account created successfully! Welcome to Kiran Trust.');
            redirectAfterAuth(res.user);
        } else {
            toast.error(res.message || 'Registration failed');
        }
    };

    // --- Google OAuth Handler ---
    const handleGoogleSignIn = () => {
        try {
            if (window.google?.accounts?.oauth2) {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'email profile openid',
                    callback: async (tokenResponse) => {
                        if (tokenResponse.error) {
                            toast.error('Google Sign-in was cancelled.');
                            return;
                        }
                        try {
                            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            });
                            const profile = await userInfoRes.json();
                            const res = await loginWithGoogle({
                                email: profile.email,
                                name: profile.name,
                                avatar: profile.picture,
                                googleId: profile.sub,
                                intent: authMode === 'signup' ? 'register' : 'login'
                            });
                            if (res?.success) {
                                toast.success(`Welcome, ${profile.name || profile.email}!`);
                                redirectAfterAuth(res.user);
                            } else {
                                const msg = res?.message || 'Google authentication failed.';
                                setAuthErrorMessage(msg);
                                toast.error(msg);
                            }
                        } catch (err) {
                            const msg = err.response?.data?.message || 'Could not retrieve Google profile.';
                            setAuthErrorMessage(msg);
                            toast.error(msg);
                        }
                    }
                });
                client.requestAccessToken();
            } else {
                toast.info('Google Sign-in service loading. Please try again in a moment.');
            }
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            toast.error('Google Sign-In error. Please use Email OTP.');
        }
    };

    const handleOtpChange = (index, value) => {
        const val = value.slice(-1);
        const newDigits = [...otpDigits];
        newDigits[index] = val;
        setOtpDigits(newDigits);
        if (val && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="auth-modal-backdrop" onClick={closeAuthModal}>
            <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
                <div className="auth-modal-header">
                    <button className="auth-modal-close" onClick={closeAuthModal}>
                        <FaTimes />
                    </button>
                    <h3>Kiran Charitable Trust</h3>
                    <p>
                        {authMode === 'login'
                            ? 'Sign in to access receipts, updates and your profile'
                            : 'Create a new supporter account to join our community'
                        }
                    </p>
                </div>

                {/* Primary Mode Switcher: Sign In tab & Direct Register Navigation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px', background: '#f1f5f9', borderRadius: 8, margin: '14px 24px 0' }}>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setOtpStep('input'); }}
                        style={{
                            padding: '9px 12px',
                            border: 'none',
                            borderRadius: 6,
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            transition: 'all 0.15s'
                        }}
                    >
                        Sign In
                    </button>

                    <button
                        type="button"
                        onClick={() => { closeAuthModal(); navigate('/portal/join'); }}
                        style={{
                            padding: '9px 12px',
                            border: 'none',
                            borderRadius: 6,
                            background: 'transparent',
                            color: '#64748b',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        Register / Join →
                    </button>
                </div>

                {/* Unregistered Alert Banner */}
                {authErrorMessage && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginBottom: 16,
                        color: '#b91c1c',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FaShieldAlt style={{ color: '#ef4444', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600 }}>{authErrorMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => { closeAuthModal(); navigate('/portal/join'); }}
                            style={{
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: 6,
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Become a Member First →
                        </button>
                    </div>
                )}

                {/* ========================================================
                    PANEL 1: SIGN IN ONLY (Clean, No registration fields)
                   ======================================================== */}
                <div className="auth-modal-body">
                        {/* Sub-tab: OTP vs Password vs Google */}
                        <div className="auth-tabs" style={{ marginBottom: 16 }}>
                            <button
                                className={`auth-tab-btn ${loginMethod === 'otp' ? 'active' : ''}`}
                                onClick={() => { setLoginMethod('otp'); setOtpStep('input'); }}
                            >
                                <FaEnvelope /> Email OTP
                            </button>
                            <button
                                className={`auth-tab-btn ${loginMethod === 'password' ? 'active' : ''}`}
                                onClick={() => setLoginMethod('password')}
                            >
                                <FaLock /> Password
                            </button>
                        </div>

                        {loginMethod === 'otp' ? (
                            otpStep === 'input' ? (
                                <form onSubmit={handleSendLoginOtp}>
                                    <div className="auth-form-group">
                                        <label>Registered Email Address *</label>
                                        <input
                                            type="email"
                                            placeholder="yourname@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="auth-input"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-primary-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Dispatching Code...' : (
                                            <>Send Verification Code <FaArrowRight /></>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyLoginOtp}>
                                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                                        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                                            Verification code dispatched to:
                                        </p>
                                        <strong style={{ color: '#0f172a', fontSize: 14 }}>{email}</strong>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setOtpStep('input')}
                                                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', marginTop: 4, textDecoration: 'underline' }}
                                            >
                                                Change email
                                            </button>
                                        </div>
                                    </div>

                                    {devOtpHint && (
                                        <div
                                            className="dev-otp-badge"
                                            onClick={() => setOtpDigits(devOtpHint.split(''))}
                                            title="Click to auto-fill code"
                                        >
                                            Code Preview: <strong>{devOtpHint}</strong> (Click to auto-fill)
                                        </div>
                                    )}

                                    <div className="auth-otp-row">
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={el => otpInputRefs.current[idx] = el}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={e => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={e => handleOtpKeyDown(idx, e)}
                                                className="auth-otp-cell"
                                                inputMode="numeric"
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-primary-btn"
                                        disabled={isLoading || otpDigits.join('').length !== 6}
                                    >
                                        {isLoading ? 'Verifying...' : <><FaCheckCircle /> Verify & Sign In</>}
                                    </button>

                                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                                        {countdown > 0 ? (
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                                Resend code in {countdown}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendLoginOtp}
                                                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Resend Verification Code
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )
                        ) : (
                            <form onSubmit={handlePasswordSignIn}>
                                <div className="auth-form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        placeholder="yourname@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="auth-input"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="auth-form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="auth-input"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="auth-primary-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In with Password'}
                                </button>
                            </form>
                        )}

                        {/* Divider */}
                        <div className="auth-divider">Or continue with</div>

                        {/* Google Button */}
                        <button
                            type="button"
                            className="auth-google-btn"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <svg className="google-icon" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
                            Want to become an official Trust Member?{' '}
                            <button
                                type="button"
                                onClick={() => { closeAuthModal(); navigate('/portal/join'); }}
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                            >
                                Register &amp; Join here →
                            </button>
                        </div>
                    </div>

                <div style={{ padding: '12px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                    <FaShieldAlt style={{ color: '#10b981', marginRight: 4 }} />
                    100% Safe &amp; Verified Official Trust Portal
                </div>
            </div>
        </div>
    );
}
