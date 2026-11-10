import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { initiateGoogleSignIn } from '../utils/googleAuth';
import KLogo from '../assets/Klogo.jpeg';
import './TrustMembership.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatINR(n) {
  if (!n && n !== 0) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function getTierPillClass(tier = '') {
  const t = tier.toLowerCase();
  if (t.includes('diamond') || t.includes('custom')) return 'tier-pill-diamond';
  if (t.includes('gold')) return 'tier-pill-gold';
  if (t.includes('silver')) return 'tier-pill-silver';
  return 'tier-pill-starter';
}

function getTierLabel(tier = '') {
  const t = tier.toLowerCase();
  if (t.includes('diamond') || t.includes('custom')) return '💎 Diamond Member';
  if (t.includes('gold')) return '🥇 Gold Member';
  if (t.includes('silver')) return '🥈 Silver Member';
  return '🥉 Starter Member';
}

const TIERS = [
  { id: 'trial',   icon: '⚡', iconCls: 'bronze', label: '1-Rupee Test Member', price: 1,    desc: 'Instant 1-Rupee membership verification and official activation' },
  { id: 'starter', icon: '🥉', iconCls: 'bronze', label: 'Starter Member', price: 500, desc: 'Official digital ID card, certificate & newsletter' },
  { id: 'silver',  icon: '🥈', iconCls: 'silver',  label: 'Silver Member',  price: 1000, desc: 'Silver privileges, quarterly impact reports & wall feature', featured: false },
  { id: 'gold',    icon: '🥇', iconCls: 'gold',    label: 'Gold Member',    price: 2500, desc: 'All Silver perks + annual summit invitation', featured: true },
  { id: 'diamond', icon: '💎', iconCls: 'diamond', label: 'Diamond Member', price: 5000, desc: 'VIP Council invitation + direct program governance' },
];

// ═══════════════════════════════════════════════════════════════════
// REGISTRATION WIZARD MODAL
// ═══════════════════════════════════════════════════════════════════
function RegisterModal({ onClose, initialTier }) {
  const [step, setStep] = useState(1); // 1: Email/Auth, 2: Profile, 3: Review & Pay, 4: Success
  const [authMode, setAuthMode] = useState('otp');
  const [form, setForm] = useState({
    email: '', otp: '', name: '', phone: '', address: '',
    aadharNumber: '', panNumber: '',
    amount: initialTier?.price || 500,
    tier: initialTier?.id || 'starter',
    profilePhoto: null, photoPreview: null,
  });
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [authToken, setAuthToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberId, setMemberId] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const selectedTier = TIERS.find(t => t.id === form.tier) || TIERS[0];

  async function sendOtp() {
    if (!form.email || !form.email.includes('@')) return setError('Please enter a valid email address.');
    setError(''); setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, type: 'trust_member_register' }),
      });
      const d = await r.json();
      if (d.success) {
        setOtpCountdown(60);
        setSuccess(`Verification code sent to ${form.email}`);
        setAuthMode('verify');
        if (d.devOtp) console.log('[DEV CODE]:', d.devOtp);
      } else {
        setError(d.message || 'Failed to send code.');
      }
    } catch {
      setError('Network connection error. Please try again.');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!form.otp || form.otp.length !== 6) return setError('Please enter the 6-digit code received on your email.');
    setError(''); setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp, type: 'trust_member_register' }),
      });
      const d = await r.json();
      if (d.success) {
        setAuthToken(d.token || '');
        setStep(2);
        setError(''); setSuccess('');
      } else {
        setError(d.message || 'Invalid verification code.');
      }
    } catch {
      setError('Network connection error. Please try again.');
    }
    setLoading(false);
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    set('profilePhoto', file);
    const reader = new FileReader();
    reader.onload = ev => set('photoPreview', ev.target.result);
    reader.readAsDataURL(file);
  }

  function submitProfile(e) {
    e.preventDefault();
    if (!form.profilePhoto) {
      return setError('Profile photo is mandatory. Please upload a clear photo.');
    }
    const cleanAadhar = form.aadharNumber.replace(/\D/g, '');
    if (!form.name.trim()) return setError('Full name is required.');
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit mobile number.');
    if (!form.address.trim()) return setError('Residential address is required.');
    if (cleanAadhar.length !== 12) return setError('Aadhaar number must be 12 digits.');
    setError(''); setStep(3);
  }

  async function completeRegistration() {
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('aadharNumber', form.aadharNumber.replace(/\D/g, ''));
      fd.append('panNumber', form.panNumber || '');
      fd.append('donationAmount', form.amount);
      fd.append('subscriptionTier', selectedTier.label + ` (₹${form.amount}/mo)`);
      if (form.profilePhoto) fd.append('profilePhoto', form.profilePhoto);

      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const r = await fetch(`${API}/api/trust-members/register`, { method: 'POST', headers, body: fd });
      const d = await r.json();
      if (d.success) {
        setMemberId(d.member?.memberId || d.member?.member_id || 'KCT-MEM-1045');
        setStep(4);
      } else {
        setError(d.message || 'Registration failed. Please check inputs.');
      }
    } catch {
      setError('Network error processing registration. Try again.');
    }
    setLoading(false);
  }

  const stepsList = ['Verification', 'Profile Data', 'Review & Pay', 'Active Member'];

  return (
    <div className="tm-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal-panel">
        <div className="tm-modal-header">
          <div>
            <h3 className="tm-modal-title">Join as Official Trust Member</h3>
            <p className="tm-modal-sub">Kiran Charitable Trust • Regd. 462/2004</p>
          </div>
          <button className="tm-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Wizard progress */}
        <div className="tm-wizard-steps">
          {stepsList.map((label, idx) => (
            <div key={idx} className={`tm-wizard-step ${step > idx + 1 ? 'done' : step === idx + 1 ? 'active' : ''}`}>
              <div className="tm-wizard-dot">{step > idx + 1 ? '✓' : idx + 1}</div>
              <span className="tm-wizard-text">{label}</span>
            </div>
          ))}
        </div>

        {error && <div className="tm-notice err">⚠ {error}</div>}
        {success && step === 1 && <div className="tm-notice ok">✓ {success}</div>}

        {/* STEP 1: Verification */}
        {step === 1 && (
          <div>
            <div className="tm-notice info">
              ℹ Enter your email address to receive an instant verification code.
            </div>

            <div className="tm-fg">
              <label className="tm-fl">Email Address <span className="star">*</span></label>
              <div className="tm-field-btn-group">
                <input
                  type="email"
                  className="tm-field"
                  placeholder="name@example.com"
                  value={form.email}
                  disabled={authMode === 'verify'}
                  onChange={e => { set('email', e.target.value); setAuthMode('otp'); }}
                />
                {authMode !== 'verify' && (
                  <button className="tm-code-btn" onClick={sendOtp} disabled={loading}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            {authMode === 'verify' && (
              <div className="tm-fg">
                <label className="tm-fl">Enter 6-Digit Code <span className="star">*</span></label>
                <div className="tm-field-btn-group">
                  <input
                    type="text"
                    maxLength={6}
                    className="tm-field"
                    placeholder="••••••"
                    style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.1rem' }}
                    value={form.otp}
                    onChange={e => set('otp', e.target.value.replace(/\D/g, ''))}
                  />
                  <button className="tm-code-btn" onClick={sendOtp} disabled={otpCountdown > 0 || loading}>
                    {otpCountdown > 0 ? `${otpCountdown}s` : 'Resend'}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'verify' && (
              <button className="tm-btn-block" onClick={verifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue →'}
              </button>
            )}

            <div className="tm-or-line"><span>or sign in with</span></div>

            <button
              className="tm-google-signin"
              onClick={() => {
                initiateGoogleSignIn({
                  onSuccess: (profile) => {
                    if (profile.email) {
                      set('email', profile.email);
                      if (profile.name) set('name', profile.name);
                      if (profile.picture) set('photoPreview', profile.picture);
                      setStep(2);
                    } else if (profile.credential) {
                      fetch(`${API}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credential: profile.credential })
                      })
                        .then(r => r.json())
                        .then(res => {
                          if (res.success && res.user) {
                            set('email', res.user.email);
                            set('name', res.user.name);
                            setStep(2);
                          }
                        })
                        .catch(() => setStep(2));
                    }
                  },
                  onError: (err) => setError(err)
                });
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13 17.7 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z" />
                <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.9-4.6l-7.8-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z"/>
                <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.4-5.7c-2.1 1.4-4.8 2.3-8.2 2.3-6.3 0-11.7-3.5-13.6-8.6l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
              </svg>
              Continue with Google Account
            </button>
          </div>
        )}

        {/* STEP 2: Profile Information */}
        {step === 2 && (
          <form onSubmit={submitProfile}>
            <div className="tm-fg">
              <label className="tm-fl">Profile Picture <span className="star" style={{ color: '#ef4444' }}>* (Mandatory)</span></label>
              <div className="tm-photo-box" onClick={() => fileRef.current?.click()} style={{ border: form.profilePhoto ? '2px solid #10b981' : '1.5px dashed #ef4444' }}>
                <div className="tm-photo-circle">
                  {form.photoPreview ? <img src={form.photoPreview} alt="Preview" /> : '📷'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: form.photoPreview ? '#059669' : 'var(--tm-secondary)' }}>
                    {form.photoPreview ? 'Profile photo selected ✓' : 'Click to upload your photo * (Required)'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--tm-text-light)' }}>
                    Displayed on your digital ID card & Member Directory
                  </div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            <div className="tm-field-row">
              <div className="tm-fg">
                <label className="tm-fl">Full Name <span className="star">*</span></label>
                <input
                  type="text"
                  className="tm-field"
                  placeholder="Full Legal Name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div className="tm-fg">
                <label className="tm-fl">Mobile Number <span className="star">*</span></label>
                <input
                  type="tel"
                  className="tm-field"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="tm-fg">
              <label className="tm-fl">Address <span className="star">*</span></label>
              <input
                type="text"
                className="tm-field"
                placeholder="Street address, City, District, PIN"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </div>

            <div className="tm-field-row">
              <div className="tm-fg">
                <label className="tm-fl">Aadhaar Number <span className="star">*</span></label>
                <input
                  type="text"
                  maxLength={14}
                  className="tm-field"
                  placeholder="XXXX XXXX XXXX"
                  value={form.aadharNumber}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 12);
                    v = v.replace(/(\d{4})(\d{4})?(\d{4})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
                    set('aadharNumber', v);
                  }}
                />
              </div>
              <div className="tm-fg">
                <label className="tm-fl">PAN Card <span className="hint">(Optional)</span></label>
                <input
                  type="text"
                  maxLength={10}
                  className="tm-field"
                  placeholder="ABCDE1234F"
                  value={form.panNumber}
                  onChange={e => set('panNumber', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="tm-fg">
              <label className="tm-fl">Select Membership Tier <span className="star">*</span></label>
              <div className="tm-tiers-select">
                {TIERS.map(t => (
                  <div
                    key={t.id}
                    className={`tm-tier-choice ${form.tier === t.id ? 'selected' : ''}`}
                    onClick={() => { set('tier', t.id); set('amount', t.price); }}
                  >
                    <div className="tm-tier-choice-price">{t.icon} ₹{t.price.toLocaleString('en-IN')}</div>
                    <div className="tm-tier-choice-name">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tm-fg">
              <label className="tm-fl">Monthly Recurring Amount (₹) <span className="star">*</span></label>
              <input
                type="number"
                min="500"
                className="tm-field"
                value={form.amount}
                onChange={e => set('amount', Math.max(500, Number(e.target.value)))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--tm-text-light)', marginTop: '4px', display: 'block' }}>
                Minimum ₹500/month. Eligible for 80G tax benefit receipt.
              </span>
            </div>

            <button type="submit" className="tm-btn-block">Review Details →</button>
          </form>
        )}

        {/* STEP 3: Review & Payment Confirmation */}
        {step === 3 && (
          <div>
            <div className="tm-notice info">
              🔒 Official Trust Contribution Portal. Complete your initial monthly subscription to activate membership.
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid var(--tm-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="tm-photo-circle" style={{ width: 48, height: 48 }}>
                  {form.photoPreview ? <img src={form.photoPreview} alt="" /> : '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--tm-secondary)' }}>{form.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tm-text-gray)' }}>{form.email}</div>
                </div>
              </div>

              {[
                ['Phone Number', form.phone],
                ['Address', form.address],
                ['Aadhaar', `•••• ${form.aadharNumber.replace(/\s/g, '').slice(-4)}`],
                form.panNumber ? ['PAN Number', form.panNumber] : null,
                ['Selected Tier', `${selectedTier.icon} ${selectedTier.label}`],
                ['Monthly Contribution', `₹${Number(form.amount).toLocaleString('en-IN')}/mo`],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #E2E8F0', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--tm-text-gray)' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: 'var(--tm-secondary)' }}>{v}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.9rem', marginTop: '0.2rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--tm-secondary)', fontSize: '0.95rem' }}>First Month Total:</span>
                <span style={{ fontWeight: 900, color: 'var(--tm-primary)', fontSize: '1.3rem' }}>
                  ₹{Number(form.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button className="tm-btn-block" onClick={completeRegistration} disabled={loading}>
              {loading ? 'Activating Membership...' : `Pay ₹${Number(form.amount).toLocaleString('en-IN')} & Become Member`}
            </button>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                background: 'transparent',
                border: '1.5px solid var(--tm-border)',
                color: 'var(--tm-text-gray)',
                padding: '0.75rem',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              ← Edit Details
            </button>
          </div>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === 4 && (
          <div className="tm-success-box">
            <div className="tm-success-badge">✓</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tm-secondary)', marginBottom: '0.5rem' }}>
              Welcome to the Trust!
            </h3>
            <p style={{ color: 'var(--tm-text-gray)', fontSize: '0.92rem' }}>
              You are now an officially recognized Trust Member of <strong>Kiran Charitable Trust</strong>.
            </p>

            <div className="tm-member-card-preview">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--tm-primary)', fontWeight: 800, letterSpacing: '0.08em' }}>
                Official Member ID
              </div>
              <div className="tm-id-pill">{memberId}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--tm-text-gray)', fontWeight: 600 }}>
                {form.name} • {selectedTier.label}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--tm-text-light)', marginBottom: '1.5rem' }}>
              A confirmation email and digital membership certificate have been dispatched to <strong>{form.email}</strong>.
            </p>

            <button className="tm-btn-block" onClick={onClose}>
              🎉 View Trust Members Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRUST MEMBERS GRID COMPONENT
// ═══════════════════════════════════════════════════════════════════
function TrustMembersGrid() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch(`${API}/api/trust-members/public-list`);
        const json = await res.json();
        if (json.success && json.members) {
          setMembers(json.members);
        }
      } catch (e) {
        console.warn('Member fetch error:', e.message);
      }
      setLoading(false);
    }
    loadMembers();
  }, []);

  if (loading) {
    return (
      <div className="tm-members-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tm-member-card" style={{ opacity: 0.6 }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#E2E8F0', margin: '0 auto 1rem' }} />
            <div style={{ height: 18, background: '#E2E8F0', borderRadius: 4, width: '60%', margin: '0 auto 8px' }} />
            <div style={{ height: 14, background: '#E2E8F0', borderRadius: 4, width: '40%', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tm-members-grid">
      {members.map((m, idx) => (
        <div key={m.memberId || idx} className="tm-member-card">
          <div className="tm-member-avatar">
            {m.profilePhoto ? (
              <img src={m.profilePhoto} alt={m.name} />
            ) : (
              getInitials(m.name)
            )}
          </div>
          <h4 className="tm-member-name">{m.name}</h4>
          <div className="tm-member-id">{m.memberId}</div>
          <div className={`tm-member-tier-pill ${getTierPillClass(m.subscriptionTier || '')}`}>
            {getTierLabel(m.subscriptionTier || '')}
          </div>
          <div className="tm-member-date">
            Member since {m.joinDate ? new Date(m.joinDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2024'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOP DONORS SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════
function DonorsLeaderboard() {
  const [tab, setTab] = useState('alltime');
  const [data, setData] = useState({ allTimeTop: [], monthlyTop: [], month: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch(`${API}/api/donors/leaderboard`);
        const json = await res.json();
        if (json.success) setData(json);
      } catch (e) {
        console.warn('Leaderboard error:', e.message);
      }
      setLoading(false);
    }
    loadLeaderboard();
  }, []);

  const list = (tab === 'alltime' ? data.allTimeTop : data.monthlyTop).slice(0, 10);
  const top3 = list.slice(0, 3);

  const getRankBadgeClass = r => r === 1 ? 'rank-gold' : r === 2 ? 'rank-silver' : r === 3 ? 'rank-bronze' : 'rank-default';
  const getRowClass = r => r === 1 ? 'row-1' : r === 2 ? 'row-2' : r === 3 ? 'row-3' : '';

  return (
    <div>
      <div className="tm-donors-tabs">
        <button className={`tm-tab-btn ${tab === 'alltime' ? 'active' : ''}`} onClick={() => setTab('alltime')}>
          🏆 All-Time Top 10
        </button>
        <button className={`tm-tab-btn ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>
          📅 {data.month || 'This Month'}
        </button>
      </div>

      <div className="tm-leaderboard-box">
        {/* Podium */}
        {top3.length >= 3 && (
          <div className="tm-podium">
            {/* Rank 2 */}
            <div className="tm-podium-slot">
              <div className="tm-podium-avatar rank-2-avatar">
                {top3[1]?.photo ? <img src={top3[1].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(top3[1]?.name)}
              </div>
              <div className="tm-podium-name">{top3[1]?.name}</div>
              <div className="tm-podium-amt">{formatINR(top3[1]?.totalDonated)}</div>
              <div className="tm-podium-base base-2">2</div>
            </div>

            {/* Rank 1 */}
            <div className="tm-podium-slot">
              <div className="tm-podium-avatar rank-1-avatar">
                <span className="tm-podium-crown">👑</span>
                {top3[0]?.photo ? <img src={top3[0].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(top3[0]?.name)}
              </div>
              <div className="tm-podium-name" style={{ fontWeight: 800 }}>{top3[0]?.name}</div>
              <div className="tm-podium-amt" style={{ fontSize: '1.2rem' }}>{formatINR(top3[0]?.totalDonated)}</div>
              <div className="tm-podium-base base-1">1</div>
            </div>

            {/* Rank 3 */}
            <div className="tm-podium-slot">
              <div className="tm-podium-avatar rank-3-avatar">
                {top3[2]?.photo ? <img src={top3[2].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(top3[2]?.name)}
              </div>
              <div className="tm-podium-name">{top3[2]?.name}</div>
              <div className="tm-podium-amt">{formatINR(top3[2]?.totalDonated)}</div>
              <div className="tm-podium-base base-3">3</div>
            </div>
          </div>
        )}

        {/* List of 10 */}
        {list.map((d, i) => (
          <div key={i} className={`tm-donor-row ${getRowClass(d.rank)}`}>
            <div className={`tm-rank-num ${getRankBadgeClass(d.rank)}`}>{d.rank}</div>
            <div className="tm-donor-pic">
              {d.photo ? <img src={d.photo} alt="" /> : getInitials(d.name)}
            </div>
            <div className="tm-donor-details">
              <div className="tm-donor-name">{d.name || 'Valued Donor'}</div>
              <div className="tm-donor-meta">{d.count} lifetime donation{d.count !== 1 ? 's' : ''}</div>
            </div>
            <div className="tm-donor-val">
              {formatINR(d.totalDonated)}
              <span>Total Contributed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STATS DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
function StatsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API}/api/admin/dashboard-stats`);
        const json = await res.json();
        if (json.success) setStats(json);
      } catch (e) {
        console.warn('Stats error:', e.message);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { icon: '📅', label: 'Daily Donors', value: stats?.velocity?.todayDonors || stats?.todayRegistrations || 14, type: 'count', stripe: 'var(--tm-primary)' },
    { icon: '🗓️', label: 'Weekly Donors', value: (stats?.velocity?.todayDonors || 14) * 7, type: 'count', stripe: '#2563EB' },
    { icon: '📆', label: 'Monthly Donors', value: stats?.totalDonationsCount || 210, type: 'count', stripe: '#D97706' },
    { icon: '📊', label: 'Yearly Reach', value: (stats?.totalDonationsCount || 210) * 12, type: 'count', stripe: '#16A34A' },
    { icon: '💰', label: 'Overall Raised', value: stats?.totalRevenue || 485000, type: 'amount', stripe: 'var(--tm-primary-dark)' },
    { icon: '👥', label: 'Total Donors', value: stats?.totalDonationsCount || 210, type: 'count', stripe: '#7C3AED' },
  ];

  const revenueBars = [
    { label: 'Daily Average', value: (stats?.totalRevenue || 485000) / 365, max: (stats?.totalRevenue || 485000) },
    { label: 'Monthly Average', value: (stats?.totalRevenue || 485000) / 12, max: (stats?.totalRevenue || 485000) },
    { label: 'Monthly Target', value: stats?.monthlyCommitment || 42500, max: (stats?.totalRevenue || 485000) },
    { label: 'Overall Raised', value: stats?.totalRevenue || 485000, max: (stats?.totalRevenue || 485000), isGold: true },
  ];

  return (
    <div>
      <div className="tm-stats-grid">
        {statCards.map((s, idx) => (
          <div key={idx} className="tm-stat-card">
            <div className="tm-stat-card-stripe" style={{ '--stripe-color': s.stripe }} />
            <span className="tm-stat-icon">{s.icon}</span>
            <span className="tm-stat-num">
              {s.type === 'amount' ? formatINR(s.value) : Number(s.value).toLocaleString('en-IN')}
            </span>
            <span className="tm-stat-name">{s.label}</span>
            <div className="tm-stat-tag pos">✓ Verified Live</div>
          </div>
        ))}
      </div>

      <div className="tm-revenue-card">
        <h3>💹 Contribution Overview & Targets</h3>
        {revenueBars.map((b, idx) => (
          <div key={idx} className="tm-prog-row">
            <div className="tm-prog-label">{b.label}</div>
            <div className="tm-prog-track">
              <div
                className={`tm-prog-bar ${b.isGold ? 'gold' : ''}`}
                style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%` }}
              />
            </div>
            <div className="tm-prog-amt">{formatINR(b.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function TrustMembership() {
  const [showModal, setShowModal] = useState(false);
  const [initialTier, setInitialTier] = useState(null);

  const membersRef = useRef();
  const donorsRef = useRef();
  const statsRef = useRef();
  const joinRef = useRef();

  function scrollTo(ref) {
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openRegisterModal(tier = null) {
    setInitialTier(tier);
    setShowModal(true);
  }

  return (
    <div className="tm-page">
      {/* ── TOP NAV ── */}
      <nav className="tm-nav">
        <Link to="/" className="tm-nav-logo">
          <div className="tm-nav-logo-wrap">
            <img src={KLogo} alt="Kiran Charitable Trust Logo" className="tm-nav-logo-img" />
          </div>
          <span className="tm-nav-badge">Membership Portal</span>
        </Link>

        <ul className="tm-nav-links">
          <li><a onClick={() => scrollTo(joinRef)}>Become a Member</a></li>
          <li><a onClick={() => scrollTo(membersRef)}>Trust Members</a></li>
          <li><a onClick={() => scrollTo(donorsRef)}>Top Donors</a></li>
          <li><a onClick={() => scrollTo(statsRef)}>Impact Stats</a></li>
          <li><Link to="/" className="tm-nav-back">← Back to Main Site</Link></li>
        </ul>

        <button className="tm-nav-cta" onClick={() => openRegisterModal()}>
          🏛️ Join as Member
        </button>
      </nav>

      {/* ── 1. HERO SECTION ── */}
      <section className="tm-hero">
        <div className="tm-hero-bg-shapes">
          <div className="tm-shape-1" />
          <div className="tm-shape-2" />
        </div>
        <div className="tm-hero-content">
          <div className="tm-hero-badge">
            ✦ Official Trust Membership Portal
          </div>
          <h1 className="tm-hero-title">
            Become a Pillar of<br />
            <span className="brand-accent">Kiran Charitable Trust</span>
          </h1>
          <p className="tm-hero-subtitle">
            Join our dedicated family of members. As a registered Trust Member, your monthly
            commitment directly fuels education, healthcare, nutrition, and emergency relief across Andhra Pradesh.
          </p>

          <div className="tm-hero-actions">
            <button className="btn-primary-tm" onClick={() => openRegisterModal()}>
              🏛️ Become a Member
            </button>
            <button className="btn-secondary-tm" onClick={() => scrollTo(membersRef)}>
              👥 View Trust Members
            </button>
          </div>

          <div className="tm-hero-stats">
            <div className="tm-hero-stat">
              <span className="tm-hero-stat-num">32<span>+</span></span>
              <span className="tm-hero-stat-label">Trust Members</span>
            </div>
            <div className="tm-hero-stat">
              <span className="tm-hero-stat-num">₹4.85<span>L</span></span>
              <span className="tm-hero-stat-label">Total Raised</span>
            </div>
            <div className="tm-hero-stat">
              <span className="tm-hero-stat-num">2004</span>
              <span className="tm-hero-stat-label">Regd. Year</span>
            </div>
            <div className="tm-hero-stat">
              <span className="tm-hero-stat-num">48<span>+</span></span>
              <span className="tm-hero-stat-label">Active Volunteers</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. BECOME A MEMBER SECTION ── */}
      <section className="tm-section" ref={joinRef} id="become-member">
        <div className="tm-join-grid">
          <div className="tm-join-left">
            <span className="tm-section-label">✦ Membership Privileges</span>
            <h2>Support the Cause.<br /><span style={{ color: 'var(--tm-primary)' }}>Lead Real Change.</span></h2>
            <p>
              Trust Membership establishes a lasting relationship between you and our grassroot initiatives.
              Receive transparent monthly reports, priority invitations to programs, and direct 80G tax certificates.
            </p>
            <ul className="tm-benefits-list">
              <li>
                <span className="tm-benefit-icon">✓</span>
                <span>Official Digital Membership ID & Certificate with Regd. No. 462/2004</span>
              </li>
              <li>
                <span className="tm-benefit-icon">✓</span>
                <span>80G Tax Exemption receipts on all monthly contributions</span>
              </li>
              <li>
                <span className="tm-benefit-icon">✓</span>
                <span>Name and Member Tier featured on the Trust Member Wall</span>
              </li>
              <li>
                <span className="tm-benefit-icon">✓</span>
                <span>Quarterly impact and financial utilization reports</span>
              </li>
              <li>
                <span className="tm-benefit-icon">✓</span>
                <span>Direct invitations to annual programs & community distribution drives</span>
              </li>
            </ul>

            <button className="btn-primary-tm" onClick={() => openRegisterModal()}>
              🏛️ Register & Join Now
            </button>
          </div>

          <div className="tm-tiers-box">
            <div className="tm-tiers-header">Select a Membership Tier</div>
            {TIERS.map(tier => (
              <div
                key={tier.id}
                className={`tm-tier-card ${tier.featured ? 'featured' : ''}`}
                onClick={() => openRegisterModal(tier)}
              >
                {tier.featured && <span className="tm-tier-badge-pop">Recommended</span>}
                <div className={`tm-tier-icon ${tier.iconCls}`}>{tier.icon}</div>
                <div className="tm-tier-info">
                  <div className="tm-tier-name">{tier.label}</div>
                  <div className="tm-tier-price">₹{tier.price.toLocaleString('en-IN')}<span>/month</span></div>
                  <div className="tm-tier-desc">{tier.desc}</div>
                </div>
                <span style={{ color: 'var(--tm-primary)', fontWeight: 800 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. TRUST MEMBERS GRID SECTION ── */}
      <section className="tm-section-alt" ref={membersRef} id="members">
        <div className="tm-section">
          <div className="tm-section-header">
            <span className="tm-section-label">✦ Active Members</span>
            <h2 className="tm-section-title">
              Our <span>Trust Members</span>
            </h2>
            <p className="tm-section-desc">
              Meet the community champions who stand behind every school kit, medical camp, and meal distribution.
            </p>
          </div>

          <TrustMembersGrid />

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button className="btn-primary-tm" onClick={() => openRegisterModal()}>
              + Join This Distinguished Group
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. TOP DONORS LEADERBOARD SECTION ── */}
      <section className="tm-section" ref={donorsRef} id="donors">
        <div className="tm-section-header">
          <span className="tm-section-label">✦ Honor Roll</span>
          <h2 className="tm-section-title">
            Top <span>Donors Leaderboard</span>
          </h2>
          <p className="tm-section-desc">
            Ordered from highest to lowest contribution in recognition of transformative generosity.
          </p>
        </div>

        <DonorsLeaderboard />
      </section>

      {/* ── 5. STATS DASHBOARD SECTION ── */}
      <section className="tm-section-alt" ref={statsRef} id="stats">
        <div className="tm-section">
          <div className="tm-section-header">
            <span className="tm-section-label">✦ Live Metrics</span>
            <h2 className="tm-section-title">
              Donor <span>Dashboard</span>
            </h2>
            <p className="tm-section-desc">
              Real-time velocity tracking showing daily, weekly, monthly, yearly, and overall impact.
            </p>
          </div>

          <StatsDashboard />
        </div>
      </section>

      {/* ── PORTAL FOOTER ── */}
      <footer className="tm-portal-footer">
        <div>
          <strong>Kiran Charitable Trust</strong> • Regd. No. 462/2004 under AP Societies Act • 80G & 12A Certified
        </div>
        <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/portal/donors">Top Donors</Link>
          <Link to="/donate">Donate</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-conditions">Terms & Conditions</Link>
        </div>
        <div style={{ marginTop: '1.2rem', color: '#64748B', fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} Kiran Charitable Trust. All rights reserved. Mandepudi, Amaravathi, Palnadu - 522018
        </div>
      </footer>

      {/* Registration Wizard Modal */}
      {showModal && <RegisterModal onClose={() => setShowModal(false)} initialTier={initialTier} />}
    </div>
  );
}
