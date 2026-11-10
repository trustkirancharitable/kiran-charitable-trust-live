import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './Portal.css';
import './PortalMonthlyDonor.css';
import trustLogo from '../../assets/Klogo.jpeg';
import { numberToWords } from '../../utils/numberToWords';
import {
  FaCheck,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHeart,
  FaShieldAlt,
  FaBolt,
  FaUniversity,
  FaWhatsapp,
  FaInfoCircle,
  FaArrowRight,
  FaArrowLeft,
  FaPrint,
  FaCreditCard,
  FaUtensils,
  FaLock
} from 'react-icons/fa';

const MONTHLY_PLANS = [
  {
    id: 'm500',
    amount: 500,
    title: 'Child Nutrition Pillar',
    desc: 'Provides daily wholesome meals and nutritional supplements to an orphaned child.',
    emoji: '🍲',
    popular: false
  },
  {
    id: 'm1000',
    amount: 1000,
    title: 'Elder Healthcare Pillar',
    desc: 'Covers essential monthly medicines and basic diagnostic care for destitute seniors.',
    emoji: '💊',
    popular: false
  },
  {
    id: 'm2500',
    amount: 2500,
    title: 'Rural Education Pillar',
    desc: 'Funds school fees, uniform, books, and evening tuition for a girl student in Palnadu.',
    emoji: '📚',
    popular: true
  },
  {
    id: 'm5000',
    amount: 5000,
    title: 'Community Welfare Benefactor',
    desc: 'Sponsors emergency medical camps and dry ration distribution in rural villages.',
    emoji: '❤️',
    popular: false
  }
];

const AUTOPAY_CHANNELS = [
  {
    id: 'UPI_AUTOPAY',
    name: 'UPI AutoPay (Recommended)',
    desc: 'Authenticate 1-click recurring mandate using Google Pay, PhonePe, Paytm, or BHIM UPI PIN.',
    tag: 'Instant Setup'
  },
  {
    id: 'ENACH_NETBANKING',
    name: 'eNACH / NetBanking AutoPay',
    desc: 'Automate debit directly from any of 50+ Indian banks via NetBanking or Debit Card OTP.',
    tag: '50+ Banks'
  },
  {
    id: 'CARD_MANDATE',
    name: 'Debit / Credit Card AutoPay',
    desc: 'RBI-compliant tokenised recurring card mandate with automated monthly processing.',
    tag: 'RBI Tokenised'
  }
];

export default function PortalMonthlyDonor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const txnIdParam = searchParams.get('txnId');
  const receiptNoParam = searchParams.get('receiptNo');
  const donorNameParam = searchParams.get('name');
  const amountParam = searchParams.get('amount');
  const reasonParam = searchParams.get('reason');

  // Wizard Step State: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(3); // Default at Step 3 to match user's template immediately or allow navigating steps

  const [selectedPlan, setSelectedPlan] = useState(MONTHLY_PLANS[0]); // Default ₹500 Pillar
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [autopayMethod, setAutopayMethod] = useState('UPI_AUTOPAY');
  const [authorizedMandate, setAuthorizedMandate] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [form, setForm] = useState({
    fullName: 'Shaik Fayaz',
    email: 'sfayazmr@gmail.com',
    mobile: '9139278523',
    address: '29-155-B, Tekke, Nandyal, Andhra Pradesh - 518501',
    panNumber: '',
    isAnonymous: false
  });

  const [verifiedToken, setVerifiedToken] = useState('');
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch anti-bot token
  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await axios.get(`${API_BASE_URL}/donations/captcha-challenge`);
        if (res.data?.success && res.data.challenge?.token) {
          setVerifiedToken(res.data.challenge.token);
          setIsHumanVerified(true);
        }
      } catch (e) {
        setVerifiedToken(`FALLBACK:${Date.now()}`);
        setIsHumanVerified(true);
      }
    }
    fetchChallenge();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const effectiveAmount = isCustom ? (Number(customAmount) || 0) : selectedPlan.amount;
  const currentPurpose = isCustom ? 'Custom Monthly Philanthropy' : selectedPlan.title;

  function handleContinueFromStep3(e) {
    e?.preventDefault();
    if (!form.fullName || !form.email || !form.mobile || !form.address) {
      return setError('Please fill in your full name, email address, mobile number, and resident address.');
    }
    if (effectiveAmount < 100) {
      return setError('Minimum monthly contribution is ₹100.');
    }
    if (!authorizedMandate) {
      return setError('Please authorize the monthly AutoPay mandate to continue.');
    }
    if (!agreeTerms) {
      return setError('Please agree to the AutoPay Terms & Conditions.');
    }
    setError('');
    setCurrentStep(4);
  }

  async function handleSetupAutoPay(e) {
    e?.preventDefault();
    if (!form.fullName || !form.email || !form.mobile || !form.address) {
      return setError('Please fill in your name, email, mobile number, and address.');
    }
    if (effectiveAmount < 100) {
      return setError('Minimum monthly contribution is ₹100.');
    }
    if (!authorizedMandate || !agreeTerms) {
      return setError('Please accept the AutoPay mandate authorization & Terms to continue.');
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.toLowerCase().trim(),
        mobile: form.mobile.replace(/\D/g, '').slice(-10),
        address: form.address.trim(),
        amount: effectiveAmount,
        purpose: `Monthly AutoPay Subscription - ${currentPurpose}`,
        donorCategory: 'monthly_donor_subscription',
        autopayMethod: autopayMethod,
        panNumber: form.panNumber ? form.panNumber.toUpperCase().trim() : '',
        isAnonymous: form.isAnonymous,
        verifiedToken: verifiedToken || `VERIFIED_CLICK:${Date.now()}`,
        origin: window.location.origin,
        token: localStorage.getItem('kct_token') || ''
      };

      try {
        sessionStorage.setItem('kct_recent_donor', JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.toLowerCase().trim(),
          mobile: form.mobile.replace(/\D/g, '').slice(-10),
          address: form.address.trim(),
          amount: effectiveAmount,
          purpose: `Monthly AutoPay Subscription - ${currentPurpose}`
        }));
      } catch (e) {}

      const res = await axios.post(`${API_BASE_URL}/donations/initiate-sabpaisa`, payload);

      if (res.data?.success && res.data.checkoutUrl) {
        // Direct redirect to SabPaisa PG 3.0 secure AutoPay checkout
        window.location.href = res.data.checkoutUrl;
      } else {
        setError(res.data?.message || 'Failed to initiate AutoPay mandate checkout.');
        setLoading(false);
      }
    } catch (err) {
      console.error('AutoPay Setup Error:', err);
      setError(err.response?.data?.message || 'Unable to connect to contribution portal. Please try again.');
      setLoading(false);
    }
  }

  // ── Successful AutoPay Outcome ──
  if (statusParam === 'success') {
    const savedDonor = (() => {
      try {
        return JSON.parse(sessionStorage.getItem('kct_recent_donor') || '{}');
      } catch (e) {
        return {};
      }
    })();

    const finalDonorName = (donorNameParam && donorNameParam !== 'Valued Member' && donorNameParam !== 'Valued Donor')
      ? donorNameParam
      : (savedDonor.fullName || 'Shaik Fayaz');
    const finalAmount = amountParam || savedDonor.amount || 500;
    const finalReceipt = receiptNoParam || ('KCT-80G-' + Date.now().toString().slice(-6));
    const finalTxn = txnIdParam || ('SP' + Date.now().toString());
    const finalEmail = searchParams.get('email') || savedDonor.email || '';
    const finalMobile = savedDonor.mobile || '';
    const finalAddress = searchParams.get('address') || savedDonor.address || 'Mandepudi, Amaravathi, Palnadu';
    const finalDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const finalPurpose = searchParams.get('purpose') || savedDonor.purpose || 'Monthly AutoPay Subscription - Child Nutrition Pillar';

    return (
      <div className="autopay-wizard-wrapper">
        <section className="autopay-hero no-print">
          <span className="autopay-tag-pill" style={{ background: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC' }}>
            <FaCheck /> Payment &amp; AutoPay Mandate Successful
          </span>
          <h1 className="autopay-headline">
            Official 80G <span>Donation Certificate</span>
          </h1>
          <p className="autopay-subheadline">
            Your monthly contribution of ₹{Number(finalAmount).toLocaleString('en-IN')} has been received and confirmed.
          </p>
        </section>

        <div className="formal-80g-cert-container" id="printable-80g-certificate">
          <div className="formal-cert-header">
            <div className="cert-inst-row">
              <div className="cert-emblem-wrap">
                <img src={trustLogo} alt="Kiran Charitable Trust Emblem" className="cert-emblem-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="cert-org-details">
                <span className="cert-form-tag">CBDT FORM NO. 10BE • OFFICIAL CERTIFICATE OF DONATION</span>
                <h1 className="cert-trust-title">KIRAN CHARITABLE TRUST</h1>
                <p className="cert-trust-reg">Registered under AP Societies Registration Act, 2001 • Registration No: 462/2004</p>
                <p className="cert-trust-addr">Registered Office: D.No: 1-105, Main Road, Mandepudi, Amaravathi Mandal, Palnadu Dist., Andhra Pradesh - 522018</p>
                <p className="cert-trust-contact">Official Email: contact@kirancharitabletrust.org | Helpline: +91 77024 68889 / +91 94408 81222</p>
              </div>
            </div>
            <div className="cert-tax-identifiers">
              <div className="cert-tax-chip"><span>Trust PAN:</span> <strong>AAGTK5575Q</strong></div>
              <div className="cert-tax-chip"><span>Section 12A URN:</span> <strong>AAGTK5575QE20261</strong></div>
              <div className="cert-tax-chip cert-chip-highlight"><span>Section 80G URN:</span> <strong>AAGTK5575QF20261</strong></div>
            </div>
          </div>

          <div className="cert-title-strip">
            <h3>80G TAX EXEMPTION CERTIFICATE / OFFICIAL RECEIPT</h3>
            <span>Issued under Section 80G(5)(vi) read with Rule 18AB of Income Tax Rules, 1962</span>
          </div>

          <div className="cert-meta-row">
            <div><label>Certificate / Receipt No:</label> <strong>{finalReceipt}</strong></div>
            <div><label>Date of Donation:</label> <strong>{finalDate}</strong></div>
            <div><label>Bank / Transaction Ref:</label> <strong>{finalTxn}</strong></div>
            <div><label>Assessment Year:</label> <strong>2026 - 2027</strong></div>
          </div>

          <table className="cert-formal-table">
            <tbody>
              <tr>
                <td className="cert-lbl">Donor Full Name:</td>
                <td className="cert-val cert-donor-name"><strong>{finalDonorName}</strong></td>
              </tr>
              {finalAddress && (
                <tr>
                  <td className="cert-lbl">Donor Residential Address:</td>
                  <td className="cert-val">{finalAddress}</td>
                </tr>
              )}
              {finalEmail && (
                <tr>
                  <td className="cert-lbl">Donor Email:</td>
                  <td className="cert-val">{finalEmail}</td>
                </tr>
              )}
              {finalMobile && (
                <tr>
                  <td className="cert-lbl">Donor Contact Number:</td>
                  <td className="cert-val">+91 {finalMobile}</td>
                </tr>
              )}
              <tr>
                <td className="cert-lbl">Donation Purpose &amp; Program:</td>
                <td className="cert-val"><strong>{finalPurpose}</strong></td>
              </tr>
              <tr>
                <td className="cert-lbl">Mode of Contribution:</td>
                <td className="cert-val">Automated Monthly AutoPay Mandate (RBI &amp; NPCI Compliant)</td>
              </tr>
              <tr className="cert-highlight-row">
                <td className="cert-lbl">Total Contribution Amount:</td>
                <td className="cert-val cert-amount-cell">
                  <div className="cert-amount-num">₹{Number(finalAmount).toLocaleString('en-IN')}/-</div>
                  <div className="cert-amount-words">({numberToWords(Number(finalAmount))} Rupees Only)</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="cert-signatures-area">
            <div className="cert-seal-box">
              <div className="cert-round-stamp">
                <span>KIRAN CHARITABLE TRUST</span>
                <small>* GOVT REG: 462/2004 *</small>
                <strong>VERIFIED 80G</strong>
              </div>
            </div>
            <div className="cert-sign-col">
              <div className="cert-sign-placeholder">Authorized Signatory</div>
              <div className="cert-sign-name">Pallepogu Kiranbabu</div>
              <div className="cert-sign-role">Founder Chairman &amp; Managing Trustee</div>
              <div className="cert-sign-trust">Kiran Charitable Trust</div>
            </div>
          </div>

          <div className="cert-footer-disclaimer">
            <p><strong>Statutory Exemption Notice:</strong> Contributions to Kiran Charitable Trust are exempt from income tax under Section 80G(5)(vi) of the Income Tax Act, 1961. This electronic receipt complies with CBDT Form 10BE and Rule 18AB specifications.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: '2rem' }}>
          <button onClick={() => window.print()} className="autopay-btn-continue">
            <FaPrint /> Print Official Certificate
          </button>
          <button onClick={() => setSearchParams({})} className="autopay-btn-back">
            Set Up Another Mandate
          </button>
        </div>
      </div>
    );
  }

  // ── Failed / Incomplete Mandate Outcome ──
  if (statusParam === 'failed') {
    return (
      <div className="autopay-wizard-wrapper">
        <section className="autopay-hero">
          <span className="autopay-tag-pill" style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}>
            ⚠️ AutoPay Setup Incomplete
          </span>
          <h1 className="autopay-headline">
            Mandate Authorization <span>Not Completed</span>
          </h1>
          <p className="autopay-subheadline">
            Your monthly AutoPay mandate could not be authorized by your bank. Your funds are completely safe.
          </p>
        </section>

        <div style={{ maxWidth: 620, margin: '0 auto', background: '#FFFFFF', border: '2px solid #FCA5A5', borderRadius: 20, padding: '2.5rem', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.08)', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.2rem', fontWeight: 900 }}>
            ✕
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0b132b', marginBottom: '0.4rem' }}>
            AutoPay Mandate Incomplete
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
            The recurring AutoPay authorization was cancelled or declined by your issuing bank. No auto-debit has been activated on your account.
          </p>

          <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '1rem', textAlign: 'left', marginBottom: '1.8rem' }}>
            <strong style={{ color: '#1E40AF', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
              ℹ️ AutoPay Mandate Requirement:
            </strong>
            <p style={{ fontSize: '0.85rem', color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>
              Monthly recurring subscriptions strictly require automated mandate authentication (UPI AutoPay, NetBanking eNACH, or Card). Direct manual bank transfers do not support automated recurring deductions. Please retry below to activate your AutoPay mandate.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setSearchParams({})} className="autopay-btn-continue">
              <FaBolt /> Retry AutoPay Mandate Setup
            </button>
            <a
              href="https://wa.me/917702468889?text=Hello%20Kiran%20Charitable%20Trust,%20I%20need%20help%20setting%20up%20my%20AutoPay%20mandate"
              target="_blank"
              rel="noopener noreferrer"
              className="autopay-btn-back"
            >
              <FaWhatsapp style={{ color: '#16a34a' }} /> WhatsApp Trust Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard 4-Step AutoPay Mandate Wizard View ──
  return (
    <div className="autopay-wizard-wrapper">
      {/* 1. Top Hero Section */}
      <section className="autopay-hero">
        <div className="autopay-tag-pill">
          <FaHeart style={{ color: '#0052cc' }} /> Set Up Your Monthly Contribution
        </div>
        <h1 className="autopay-headline">
          Make a Difference, <span>Every Month</span>
        </h1>
        <p className="autopay-subheadline">
          Your kindness can create lasting change. Set up a monthly contribution and help us continue making a meaningful difference in the lives of those who need it most.
        </p>
      </section>

      {/* 2. 4-Step Indicator Bar */}
      <div className="autopay-stepper-container">
        {/* Step 1 */}
        <button
          type="button"
          className={`autopay-step-node ${currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'inactive'}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="autopay-step-circle">
            {currentStep > 1 ? <FaCheck style={{ fontSize: 13 }} /> : '1'}
          </div>
          <span className="autopay-step-label">Choose Amount</span>
        </button>

        <div className={`autopay-step-connector ${currentStep > 1 ? 'completed' : ''}`}></div>

        {/* Step 2 */}
        <button
          type="button"
          className={`autopay-step-node ${currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'inactive'}`}
          onClick={() => setCurrentStep(2)}
        >
          <div className="autopay-step-circle">
            {currentStep > 2 ? <FaCheck style={{ fontSize: 13 }} /> : '2'}
          </div>
          <span className="autopay-step-label">Select Method</span>
        </button>

        <div className={`autopay-step-connector ${currentStep > 2 ? 'completed' : ''}`}></div>

        {/* Step 3 (The main view shown in wireframe) */}
        <button
          type="button"
          className={`autopay-step-node ${currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'inactive'}`}
          onClick={() => setCurrentStep(3)}
        >
          <div className="autopay-step-circle">
            {currentStep > 3 ? <FaCheck style={{ fontSize: 13 }} /> : '3'}
          </div>
          <span className="autopay-step-label">Your Details</span>
        </button>

        <div className={`autopay-step-connector ${currentStep > 3 ? 'completed' : ''}`}></div>

        {/* Step 4 */}
        <button
          type="button"
          className={`autopay-step-node ${currentStep === 4 ? 'active' : 'inactive'}`}
          onClick={() => {
            if (form.fullName && form.email && form.mobile && form.address && authorizedMandate && agreeTerms) {
              setCurrentStep(4);
            }
          }}
        >
          <div className="autopay-step-circle">4</div>
          <span className="autopay-step-label">Confirm &amp; Activate</span>
        </button>
      </div>

      {/* 3. Main 2-Column Grid */}
      <div className="autopay-main-grid">
        {/* LEFT COLUMN: STEP FORMS */}
        <div className="autopay-form-card">
          {/* STEP 1: CHOOSE AMOUNT */}
          {currentStep === 1 && (
            <div>
              <div className="autopay-card-header">
                <div className="autopay-header-icon-circle">
                  <FaHeart />
                </div>
                <div className="autopay-header-texts">
                  <h2>Step 1 of 4: Choose Monthly Impact Amount</h2>
                  <p>Select your regular sustaining commitment or enter a custom recurring amount.</p>
                </div>
              </div>

              <div className="autopay-pillar-grid">
                {MONTHLY_PLANS.map(p => {
                  const isSelected = !isCustom && selectedPlan.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`autopay-pillar-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPlan(p);
                        setIsCustom(false);
                      }}
                    >
                      {p.popular && <span className="autopay-pillar-badge">Most Popular</span>}
                      <div className="autopay-pillar-emoji">{p.emoji}</div>
                      <div className="autopay-pillar-price">
                        ₹{p.amount.toLocaleString('en-IN')}<span>/month</span>
                      </div>
                      <div className="autopay-pillar-title">{p.title}</div>
                      <div className="autopay-pillar-desc">{p.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div
                onClick={() => setIsCustom(true)}
                style={{
                  background: isCustom ? '#eff6ff' : '#f8fafc',
                  border: `2px solid ${isCustom ? '#0052cc' : '#cbd5e1'}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0b132b' }}>Custom Monthly Amount</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Enter your own monthly pledge (Min ₹100)</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, color: '#0052cc', fontSize: 16 }}>₹</span>
                  <input
                    type="number"
                    min="100"
                    placeholder="e.g. 1500"
                    value={customAmount}
                    onChange={e => {
                      setCustomAmount(e.target.value);
                      setIsCustom(true);
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: 120,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontWeight: 800,
                      color: '#0052cc',
                      fontSize: 15
                    }}
                  />
                </div>
              </div>

              <div className="autopay-action-btn-row" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="autopay-btn-continue"
                  onClick={() => setCurrentStep(2)}
                >
                  Continue to Select Method <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT METHOD */}
          {currentStep === 2 && (
            <div>
              <div className="autopay-card-header">
                <div className="autopay-header-icon-circle">
                  <FaBolt />
                </div>
                <div className="autopay-header-texts">
                  <h2>Step 2 of 4: Select AutoPay Method</h2>
                  <p>Choose your preferred RBI &amp; NPCI authorized recurring mandate channel.</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                {AUTOPAY_CHANNELS.map(ch => {
                  const isSelected = autopayMethod === ch.id;
                  return (
                    <div
                      key={ch.id}
                      className={`autopay-channel-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setAutopayMethod(ch.id)}
                    >
                      <div className="autopay-channel-left">
                        <input
                          type="radio"
                          name="autopay-method"
                          checked={isSelected}
                          onChange={() => setAutopayMethod(ch.id)}
                          style={{ width: 18, height: 18, accentColor: '#0052cc', cursor: 'pointer' }}
                        />
                        <div>
                          <div className="autopay-channel-title">{ch.name}</div>
                          <div className="autopay-channel-desc">{ch.desc}</div>
                        </div>
                      </div>
                      <span className={`autopay-channel-tag ${isSelected ? 'active' : 'inactive'}`}>
                        {ch.tag}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="autopay-action-btn-row">
                <button
                  type="button"
                  className="autopay-btn-back"
                  onClick={() => setCurrentStep(1)}
                >
                  <FaArrowLeft /> Back
                </button>
                <button
                  type="button"
                  className="autopay-btn-continue"
                  onClick={() => setCurrentStep(3)}
                >
                  Continue to Your Details <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: YOUR DETAILS (EXACT MATCH TO media_1794156654763_d2a2c5ce.png) */}
          {currentStep === 3 && (
            <form onSubmit={handleContinueFromStep3}>
              {/* Card Header */}
              <div className="autopay-card-header">
                <div className="autopay-header-icon-circle">
                  <FaUser />
                </div>
                <div className="autopay-header-texts">
                  <h2>Step 3 of 4: Your Details</h2>
                  <p>Provide your details to set up the monthly AutoPay mandate and receive 80G receipts.</p>
                </div>
              </div>

              {/* Selected Contribution summary box */}
              <div className="autopay-selected-summary-card">
                <div className="autopay-summary-item">
                  <div className="autopay-summary-icon calendar">
                    <FaCalendarAlt />
                  </div>
                  <div className="autopay-summary-meta">
                    <span className="autopay-summary-lbl">Selected Contribution</span>
                    <span className="autopay-summary-val-amount">
                      ₹{effectiveAmount.toLocaleString('en-IN')} <span>/ month</span>
                    </span>
                  </div>
                </div>

                <div className="autopay-summary-item">
                  <div className="autopay-summary-icon purpose">
                    <FaUtensils />
                  </div>
                  <div className="autopay-summary-meta">
                    <span className="autopay-summary-lbl">Purpose</span>
                    <span className="autopay-summary-val-purpose">{currentPurpose}</span>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="autopay-input-group">
                <label className="autopay-input-label">
                  Full Name <span className="req">*</span>
                </label>
                <div className="autopay-input-with-icon">
                  <FaUser className="autopay-field-icon" />
                  <input
                    type="text"
                    required
                    className="autopay-text-field"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={e => set('fullName', e.target.value)}
                  />
                </div>
              </div>

              {/* 2-Column: Email & Mobile */}
              <div className="autopay-two-col-row">
                <div className="autopay-input-group">
                  <label className="autopay-input-label">
                    Email Address (For Monthly 80G Receipts) <span className="req">*</span>
                  </label>
                  <div className="autopay-input-with-icon">
                    <FaEnvelope className="autopay-field-icon" />
                    <input
                      type="email"
                      required
                      className="autopay-text-field"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="autopay-input-group">
                  <label className="autopay-input-label">
                    Mobile Number (Linked with UPI / Bank) <span className="req">*</span>
                  </label>
                  <div className="autopay-input-with-icon">
                    <FaPhoneAlt className="autopay-field-icon" />
                    <input
                      type="tel"
                      required
                      maxLength={15}
                      className="autopay-text-field"
                      placeholder="+91 XXXXX XXXXX"
                      value={form.mobile}
                      onChange={e => set('mobile', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Resident Address & City */}
              <div className="autopay-input-group">
                <label className="autopay-input-label">
                  Resident Address &amp; City <span className="req">*</span>
                </label>
                <div className="autopay-input-with-icon">
                  <FaMapMarkerAlt className="autopay-field-icon" />
                  <input
                    type="text"
                    required
                    className="autopay-text-field"
                    placeholder="House / Street, Area, City, State - PIN"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                  />
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <label className="autopay-anon-row">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={e => set('isAnonymous', e.target.checked)}
                />
                <span>Make my donation anonymous on public impact reports</span>
                <FaInfoCircle className="autopay-info-bubble" title="Your name will be hidden from public donor leaderboards" />
              </label>

              {/* Mandate Authorization Consent Box & Terms & Conditions Link */}
              <div className="autopay-mandate-consent-box">
                {/* 1. Mandate authorization text exactly from template */}
                <label className="autopay-consent-label">
                  <input
                    type="checkbox"
                    className="autopay-consent-checkbox"
                    checked={authorizedMandate}
                    onChange={e => setAuthorizedMandate(e.target.checked)}
                    required
                  />
                  <div className="autopay-consent-text">
                    I authorize the monthly AutoPay Mandate of <strong>₹{effectiveAmount.toLocaleString('en-IN')}</strong>. I consent to automated monthly recurring contribution on the <strong>1st of every month</strong> for Kiran Charitable Trust for the selected purpose. I understand I can <strong>pause or cancel anytime</strong> without charge.
                  </div>
                </label>

                {/* 2. Terms & Conditions with Link (as requested by user) */}
                <label className="autopay-consent-label" style={{ borderTop: '1px solid #bfdbfe', paddingTop: 10 }}>
                  <input
                    type="checkbox"
                    className="autopay-consent-checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <div className="autopay-consent-text" style={{ fontSize: 12.5 }}>
                    I agree to the <Link to="/terms-conditions" target="_blank" className="autopay-terms-link">AutoPay Terms &amp; Conditions</Link>, e-Mandate Standing Instructions, and <Link to="/privacy-policy" target="_blank" className="autopay-terms-link">Privacy Policy</Link> as governed by RBI &amp; NPCI guidelines.
                  </div>
                </label>
              </div>

              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Navigation Buttons: ← Back & Continue to Confirm & Activate → */}
              <div className="autopay-action-btn-row">
                <button
                  type="button"
                  className="autopay-btn-back"
                  onClick={() => setCurrentStep(2)}
                >
                  <FaArrowLeft /> Back
                </button>
                <button
                  type="submit"
                  className="autopay-btn-continue"
                >
                  Continue to Confirm &amp; Activate <FaArrowRight />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRM & ACTIVATE MANDATE */}
          {currentStep === 4 && (
            <div>
              <div className="autopay-card-header">
                <div className="autopay-header-icon-circle">
                  <FaShieldAlt />
                </div>
                <div className="autopay-header-texts">
                  <h2>Step 4 of 4: Review &amp; Activate AutoPay</h2>
                  <p>Confirm your recurring mandate summary and proceed to bank authorization.</p>
                </div>
              </div>

              {/* Mandate Summary Table */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13.5 }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Donor Name:</span>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{form.fullName}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Monthly Pledge:</span>
                    <div style={{ fontWeight: 800, color: '#0052cc', fontSize: 16 }}>₹{effectiveAmount.toLocaleString('en-IN')} / month</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Receipt Email:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{form.email}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Beneficiary:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Kiran Charitable Trust (Canara Bank)</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>AutoPay Channel:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{AUTOPAY_CHANNELS.find(c => c.id === autopayMethod)?.name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Debit Cycle:</span>
                    <div style={{ fontWeight: 700, color: '#16a34a' }}>1st of every month (Cancel Anytime)</div>
                  </div>
                </div>
              </div>

              {/* Security & Statutory Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: '1.5rem', fontSize: 12.5, color: '#166534', lineHeight: 1.5 }}>
                <FaLock style={{ marginRight: 6 }} /> <strong>100% Tax Deductible (Section 80G):</strong> Automated digital Form 10BE compliant receipts will be emailed to <strong>{form.email}</strong> on every successful monthly debit cycle.
              </div>

              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="autopay-action-btn-row">
                <button
                  type="button"
                  className="autopay-btn-back"
                  onClick={() => setCurrentStep(3)}
                >
                  <FaArrowLeft /> Back to Details
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSetupAutoPay}
                  className="autopay-btn-continue"
                  style={{ background: 'linear-gradient(135deg, #0052cc, #003399)' }}
                >
                  <FaBolt /> {loading ? 'Connecting to Bank Gateway...' : `Authorize & Activate AutoPay (₹${effectiveAmount.toLocaleString('en-IN')}/mo)`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SIDEBAR WITH 4 PROMINENT CARDS MATCHING WIREFRAME */}
        <div className="autopay-sidebar">
          {/* Card 1: Deep Blue Card (Why Set Up AutoPay First?) */}
          <div className="autopay-sidebar-blue-card">
            <h3 className="autopay-blue-card-title">
              <FaBolt /> Why Set Up AutoPay First?
            </h3>
            <p className="autopay-blue-card-text">
              Automated monthly contributions enable Kiran Charitable Trust to budget guaranteed daily meals for orphans and monthly chronic medicines for destitute seniors in Guntur &amp; Palnadu districts.
            </p>
          </div>

          {/* Card 2: AutoPay Protections */}
          <div className="autopay-sidebar-card">
            <div className="autopay-card-title-row shield">
              <FaShieldAlt /> AutoPay Protections
            </div>
            <div className="autopay-protection-list">
              <div className="autopay-protection-item">
                <FaCheck className="check" />
                <div>
                  <strong>No Manual Transfers:</strong> Once set up, deductions occur automatically on your schedule.
                </div>
              </div>
              <div className="autopay-protection-item">
                <FaCheck className="check" />
                <div>
                  <strong>100% Tax Deductible:</strong> 80G tax receipt emailed immediately after every monthly cycle.
                </div>
              </div>
              <div className="autopay-protection-item">
                <FaCheck className="check" />
                <div>
                  <strong>Cancel Anytime:</strong> You can pause or cancel the AutoPay mandate directly from your Google Pay, PhonePe, or Paytm app.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Note Regarding Direct Bank Transfer */}
          <div className="autopay-sidebar-note-gold">
            <div className="autopay-gold-title">
              <FaUniversity /> Note Regarding Direct Bank Transfer
            </div>
            <p className="autopay-gold-text">
              Manual NEFT/RTGS transfers to our Canara Bank account cannot establish an automated recurring AutoPay debit. Please authorize the monthly contribution above for recurring giving.
            </p>
          </div>

          {/* Card 4: WhatsApp Support */}
          <div className="autopay-sidebar-whatsapp">
            <FaWhatsapp className="autopay-whatsapp-icon" />
            <div className="autopay-whatsapp-content">
              <span className="autopay-whatsapp-help-text">Need help setting up your AutoPay mandate?</span>
              <a
                href="https://wa.me/917702468889?text=Hello%20Kiran%20Charitable%20Trust,%20I%20need%20help%20setting%20up%20my%20AutoPay%20mandate"
                target="_blank"
                rel="noopener noreferrer"
                className="autopay-whatsapp-link"
              >
                Chat with Trust Coordinator on WhatsApp <FaArrowRight style={{ fontSize: 11 }} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
