import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaShieldAlt, FaUser, FaReceipt, FaBell, FaSignOutAlt, FaPrint,
    FaCheckCircle, FaCamera, FaDownload, FaSyncAlt, FaExternalLinkAlt,
    FaCalendarAlt, FaRupeeSign, FaHeart, FaIdCard, FaExclamationCircle,
    FaLock, FaCheck, FaTrashAlt, FaCheckDouble, FaUniversity, FaQrcode,
    FaCreditCard, FaCopy, FaTimes, FaExclamationTriangle, FaThLarge, FaBolt,
    FaChevronDown, FaCoins, FaUsers, FaGraduationCap, FaInfoCircle, FaCog, FaArrowRight,
    FaSearch, FaFilter, FaCube
} from 'react-icons/fa';
import KLogo from '../../assets/Klogo.jpeg';
import { numberToWordsIndian } from '../../utils/numberToWords';
import './PortalProfile.css';

const formatReceiptDateTime = (dateStr) => {
    if (!dateStr) dateStr = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const day = d.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
};

export default function PortalProfile() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout, refreshUser } = useAuth();
    const fileInputRef = useRef();

    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get('tab');
    const isDashboardRoute = location.pathname.includes('/dashboard');
    const [activeTab, setActiveTab] = useState(urlTab || 'dashboard');

    useEffect(() => {
        if (urlTab && ['dashboard', 'profile', 'payments', 'notifications'].includes(urlTab)) {
            setActiveTab(urlTab);
        } else if (!urlTab) {
            setActiveTab('dashboard');
        }
    }, [urlTab, isDashboardRoute]);

    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setSearchParams(tab === 'dashboard' ? {} : { tab });
    };

    const [profileData, setProfileData] = useState(null);
    const [donations, setDonations] = useState([]);
    const [trustMember, setTrustMember] = useState(null);
    const [loading, setLoading] = useState(true);

    // Profile Edit State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(() => user?.avatar || user?.profilePhoto || '');
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);

    useEffect(() => {
        if (user?.avatar || user?.profilePhoto) {
            setAvatarPreview(prev => prev || user.avatar || user.profilePhoto);
        }
    }, [user]);

    // Direct Portal Donation State
    const [donationAmount, setDonationAmount] = useState(1000);
    const [customAmount, setCustomAmount] = useState('');
    const [donationPurpose, setDonationPurpose] = useState('General Trust Social Welfare & Community Drives');
    const [donationChannel, setDonationChannel] = useState('online'); // 'online' | 'bank_qr'
    const [portalUtr, setPortalUtr] = useState('');
    const [portalCheckoutSession, setPortalCheckoutSession] = useState(null);
    const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showPaymentsContribute, setShowPaymentsContribute] = useState(false);
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentDateFilter, setPaymentDateFilter] = useState('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

    // Password Update State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [hasPassword, setHasPassword] = useState(false);
    const [pwUpdating, setPwUpdating] = useState(false);

    // 80G Certificate Modal State
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // Collapsible profile sections state
    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        kyc: true,
        security: false
    });
    const toggleSection = (sec) => setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));

    // Notifications State with persistence
    const defaultNotifs = [
        {
            id: 'notif-1',
            title: '80G Tax Exemption Certificate Issued',
            desc: 'Your official CBDT Form 10BE tax receipts are available for instant download in the Payment History section.',
            time: 'Active Record',
            icon: 'green',
            read: false
        },
        {
            id: 'notif-2',
            title: 'Verified Supporter & Member Account',
            desc: 'Your supporter profile is active and verified under Kiran Charitable Trust (Regd. No. 3/2026). Thank you for sustaining daily education and nutrition programs.',
            time: 'Updated Today',
            icon: 'blue',
            read: false
        },
        {
            id: 'notif-3',
            title: 'Kiran Trust Field Distribution Update',
            desc: 'Over 450 school kits and nutritious meal kits distributed across Palnadu & Amaravathi rural communities this month.',
            time: 'Trust Announcement',
            icon: 'amber',
            read: false
        }
    ];

    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem('kct_user_notifications');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return defaultNotifs;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const saveNotifs = (list) => {
        setNotifications(list);
        try {
            localStorage.setItem('kct_user_notifications', JSON.stringify(list));
        } catch (e) {}
    };

    const handleMarkAllAsRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        saveNotifs(updated);
        toast.info('All notifications marked as read.');
    };

    const handleClearAllNotifs = () => {
        saveNotifs([]);
        toast.info('All notifications cleared.');
    };

    const handleToggleRead = (id) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
        saveNotifs(updated);
    };

    const handleDismissNotif = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        saveNotifs(updated);
        toast.info('Notification dismissed.');
    };

    const handleResetNotifs = () => {
        saveNotifs(defaultNotifs);
        toast.success('Default notifications restored.');
    };

    const loadUserData = async () => {
        try {
            const tokenToUse = searchParams.get('auth_token') || searchParams.get('token') || localStorage.getItem('kct_token') || localStorage.getItem('token');
            if (tokenToUse) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
            }
            const res = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {}
            });
            if (res.data?.success && res.data.user) {
                const u = res.data.user;
                setProfileData(u);
                const resolvedName = u.name || u.trustMember?.name || user?.name || '';
                setName(resolvedName);
                const resolvedPhone = u.phone || u.trustMember?.phone || user?.phone || '';
                setPhone(resolvedPhone);
                const resolvedAddress = u.address || u.trustMember?.address || user?.address || '';
                setAddress(resolvedAddress);
                const resolvedPan = u.panNumber || u.trustMember?.panNumber || u.trustMember?.pan_number || '';
                setPanNumber(resolvedPan);
                const rawAadhar = u.aadharNumber || u.trustMember?.aadharNumber || u.trustMember?.aadhar_number || '';
                const formattedAadhar = String(rawAadhar).replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                setAadharNumber(formattedAadhar);
                const photo = u.avatar || u.trustMember?.profilePhoto || u.trustMember?.profile_photo || user?.avatar || '';
                setAvatarPreview(photo);
                setAvatarLoadError(false);
                setDonations(u.donations || []);
                setTrustMember(u.trustMember || null);
                setHasPassword(Boolean(u.hasPassword));
            }
        } catch (e) {
            console.warn('Profile fetch notice:', e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const urlToken = searchParams.get('auth_token') || searchParams.get('token');
        if (urlToken) {
            localStorage.setItem('kct_token', urlToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;
        }

        const activeToken = urlToken || localStorage.getItem('kct_token') || localStorage.getItem('token');
        if (activeToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
        }
        if (!isAuthenticated && !activeToken) {
            navigate('/portal/login', { replace: true });
            return;
        }
        loadUserData();

        // Listen for return status from SabPaisa gateway or action triggers
        const status = searchParams.get('status');
        const amount = searchParams.get('amount');
        const action = searchParams.get('action');

        if (action === 'contribute') {
            setShowPaymentsContribute(true);
        }

        if (status === 'success') {
            toast.success(`Donation of ₹${amount ? Number(amount).toLocaleString('en-IN') : ''} Confirmed! Official 80G Tax Exemption Receipt generated.`);
            setActiveTab('payments');
            loadUserData();
            const receiptNo = searchParams.get('receiptNo') || searchParams.get('receiptNumber');
            const txnId = searchParams.get('txnId') || searchParams.get('txId');
            if (receiptNo || txnId) {
                setSelectedReceipt({
                    receiptNumber: receiptNo || ('KCT-REC-' + Date.now().toString().slice(-6)),
                    amount: amount || 0,
                    transactionId: txnId || 'TXN-ONLINE',
                    purpose: searchParams.get('purpose') || 'General Trust Contribution',
                    createdAt: new Date().toISOString()
                });
            }
        } else if (status === 'failed') {
            const reason = searchParams.get('reason') || 'Payment was not completed.';
            toast.error(`Payment failed: ${reason}`);
            setActiveTab('payments');
        }
    }, [isAuthenticated, navigate]);

    // Handle Direct Portal Donation Initiation
    const handleInitiatePortalPayment = async () => {
        const finalAmt = customAmount ? Number(customAmount) : Number(donationAmount);
        if (!finalAmt || isNaN(finalAmt) || finalAmt < 1) {
            toast.error('Please select or enter a valid contribution amount of at least ₹1.');
            return;
        }

        if (donationChannel === 'bank_qr') {
            if (!portalUtr || portalUtr.trim().length < 4) {
                toast.error('Please enter the UPI / Bank UTR Transaction Reference number.');
                return;
            }
            setIsSubmittingDonation(true);
            try {
                const res = await axios.post(`${API_BASE_URL}/donations`, {
                    donationType: 'cash',
                    fullName: name || user?.name || 'Trust Member',
                    mobile: phone || user?.phone || '9999999999',
                    email: user?.email,
                    address: address || user?.address || 'Mandepudi, Palnadu, AP',
                    amount: finalAmt,
                    purpose: donationPurpose,
                    paymentMethod: 'Direct UPI / Bank Transfer',
                    panNumber: panNumber || user?.panNumber || '',
                    memberId: trustMember?.memberId || user?.trustMemberId || user?.memberId || 'KCT-MEM-1032',
                    userId: user?.id || user?._id,
                    donorCategory: 'trust_member_contribution',
                    transactionId: portalUtr.trim()
                });
                if (res.data?.success) {
                    toast.success('Donation submitted and recorded under your account! Instant 80G receipt available.');
                    setPortalUtr('');
                    setCustomAmount('');
                    await loadUserData();
                    setActiveTab('payments');
                    setSearchParams({ tab: 'payments' });
                    if (res.data.data) {
                        setSelectedReceipt(res.data.data);
                    }
                } else {
                    toast.error(res.data?.message || 'Failed to record donation.');
                }
            } catch (e) {
                toast.error(e.response?.data?.message || 'Failed to record contribution.');
            } finally {
                setIsSubmittingDonation(false);
            }
            return;
        }

        // Online SabPaisa PG 3.0 initiation
        setIsSubmittingDonation(true);
        try {
            const payload = {
                fullName: name || user?.name || 'Trust Member',
                mobile: phone || user?.phone || '9999999999',
                email: user?.email,
                address: address || user?.address || 'Mandepudi, Palnadu, AP',
                amount: finalAmt,
                purpose: donationPurpose,
                memberId: trustMember?.memberId || user?.trustMemberId || user?.memberId || 'KCT-MEM-1032',
                userId: user?.id || user?._id,
                source: 'portal',
                donorCategory: 'trust_member_contribution',
                panNumber: panNumber || user?.panNumber || '',
                origin: window.location.origin,
                token: localStorage.getItem('kct_token') || ''
            };

            const res = await axios.post(`${API_BASE_URL}/donations/initiate-sabpaisa`, payload);
            if (res.data?.success && res.data?.checkoutUrl) {
                toast.info('Connecting to SabPaisa official payment gateway...');
                window.location.href = res.data.checkoutUrl;
            } else {
                toast.error(res.data?.message || 'Failed to initialize payment gateway.');
                setIsSubmittingDonation(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to connect to SabPaisa payment gateway.');
        } finally {
            setIsSubmittingDonation(false);
        }
    };

    // Handle Photo Upload
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Profile photo must be less than 5MB');
            return;
        }

        // Instant local preview
        const reader = new FileReader();
        reader.onload = ev => {
            setAvatarPreview(ev.target.result);
            setAvatarLoadError(false);
        };
        reader.readAsDataURL(file);

        // Upload to server / Cloudflare R2
        setPhotoUploading(true);
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const res = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success && res.data.avatarUrl) {
                setAvatarPreview(res.data.avatarUrl);
                setAvatarLoadError(false);
                toast.success('Profile photo updated successfully.');
                refreshUser();
                if (typeof loadUserData === 'function') loadUserData();
            } else {
                toast.success('Profile photo selected.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error updating profile photo');
        } finally {
            setPhotoUploading(false);
        }
    };

    // Save Profile Information
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const cleanAadhar = (aadharNumber || '').replace(/\D/g, '');
            if (cleanAadhar.length !== 12) {
                toast.error('Aadhaar Card Number is mandatory and must be exactly 12 digits.');
                setSaving(false);
                return;
            }

            const cleanPan = panNumber ? panNumber.toUpperCase().trim() : '';

            const tokenToUse = localStorage.getItem('kct_token') || localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/auth/profile`, {
                name,
                phone,
                address,
                panNumber: cleanPan,
                aadharNumber: cleanAadhar,
                avatar: avatarPreview || undefined
            }, {
                headers: tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {}
            });
            if (res.data?.success) {
                toast.success('Profile details saved successfully.');
                if (refreshUser) refreshUser();
                await loadUserData();
            } else {
                toast.error(res.data?.message || 'Failed to update profile');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile details');
        } finally {
            setSaving(false);
        }
    };

    // Update Password Handler
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (hasPassword && !currentPassword) {
            toast.error('Please enter your current password.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match. Please re-enter.');
            return;
        }
        setPwUpdating(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/auth/update-password`, {
                currentPassword: hasPassword ? currentPassword : 'None',
                newPassword
            });
            if (res.data?.success) {
                toast.success(res.data.message || 'Password saved successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setHasPassword(true);
            } else {
                toast.error(res.data?.message || 'Failed to update password');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPwUpdating(false);
        }
    };

    const handleSignOut = () => {
        logout(false);
        navigate('/');
    };

    // Reusable Direct Member Contribution Console (In-Portal, No External Redirect)
    const renderContributionConsole = () => (
        <div id="contribute" className="user-card" style={{ marginTop: 24, border: '1.5px solid #a7f3d0', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(5, 150, 105, 0.08)' }}>
            <div className="user-card-header" style={{ borderBottomColor: '#d1fae5', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', padding: '18px 24px' }}>
                <div>
                    <h2 className="user-card-title" style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.25rem', margin: 0 }}>
                        <FaHeart style={{ color: '#ef4444' }} /> Make a Direct Trust Contribution
                    </h2>
                    <p className="user-card-sub" style={{ margin: '4px 0 0', color: '#065f46' }}>
                        Instant 100% tax-exempt contribution (Section 80G). Automatically linked to your Member ID <strong>{trustMember?.memberId || user?.trustMemberId || 'KCT-MEM-1032'}</strong>.
                    </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 700 }}>
                    <FaShieldAlt /> 80G &amp; 12A Certified
                </div>
            </div>
            
            <div className="user-card-body" style={{ padding: '24px' }}>
                {/* Step 1: Select Amount */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                        1. Select Contribution Amount (INR):
                    </label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {[100, 500, 1000, 2500, 5000].map(amt => {
                            const isSelected = !customAmount && Number(donationAmount) === amt;
                            return (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => { setDonationAmount(amt); setCustomAmount(''); }}
                                    style={{
                                        padding: '10px 18px',
                                        background: isSelected ? '#059669' : '#F8FAFC',
                                        color: isSelected ? '#ffffff' : '#0F172A',
                                        border: isSelected ? '1.5px solid #059669' : '1.5px solid #E2E8F0',
                                        borderRadius: 8,
                                        fontWeight: 800,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <FaRupeeSign style={{ fontSize: 11 }} />{amt.toLocaleString('en-IN')}
                                </button>
                            );
                        })}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 8, padding: '0 10px', height: 42 }}>
                            <FaRupeeSign style={{ color: '#64748B', fontSize: 12 }} />
                            <input
                                type="number"
                                placeholder="Custom Amount"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', width: 130, fontWeight: 700, fontSize: 14, color: '#0F172A' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2: Purpose */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                        2. Initiative / Program Allocation:
                    </label>
                    <select
                        value={donationPurpose}
                        onChange={(e) => setDonationPurpose(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: 520,
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1.5px solid #CBD5E1',
                            fontSize: 14,
                            color: '#0F172A',
                            fontWeight: 600,
                            background: '#FFFFFF'
                        }}
                    >
                        <option value="General Trust Social Welfare & Community Drives">General Trust Social Welfare &amp; Community Drives</option>
                        <option value="Rural Health & Medical Camps (Free Medicines)">Rural Health &amp; Medical Camps (Free Checkups &amp; Medicines)</option>
                        <option value="Child Education, School Kits & Orphan Support">Child Education, School Kits &amp; Orphan Support</option>
                        <option value="Monthly Sustaining Trust Member Pledge">Monthly Sustaining Trust Member Pledge</option>
                        <option value="Annadanam & Daily Food Relief Drive">Annadanam &amp; Daily Food Relief Drive</option>
                    </select>
                </div>

                {/* Step 3: Verified Online Payment Method */}
                <div style={{ marginBottom: 22 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                        3. Contribution Payment Method:
                    </label>
                    <div style={{
                        padding: '14px 18px',
                        borderRadius: 10,
                        border: '2px solid #059669',
                        background: '#F0FDF4',
                        color: '#065F46',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14
                    }}>
                        <FaCreditCard style={{ fontSize: 24, color: '#059669', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 14.5 }}>Official Online Gateway (SabPaisa 3.0)</div>
                            <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                                Instant Auto-Verification via UPI (Google Pay, PhonePe, Paytm), All Debit/Credit Cards &amp; NetBanking. Instant 80G Tax Exemption Certificate issued.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div>
                    <button
                        type="button"
                        onClick={handleInitiatePortalPayment}
                        disabled={isSubmittingDonation}
                        style={{
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '12px 28px',
                            fontWeight: 800,
                            fontSize: 15,
                            cursor: isSubmittingDonation ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <FaHeart />
                        {isSubmittingDonation 
                            ? 'Connecting...' 
                            : (donationChannel === 'online' 
                                ? `Proceed to Contribute ₹${(customAmount ? Number(customAmount) : Number(donationAmount)).toLocaleString('en-IN')}` 
                                : `Confirm Contribution of ₹${(customAmount ? Number(customAmount) : Number(donationAmount)).toLocaleString('en-IN')}`)}
                    </button>
                </div>
            </div>
        </div>
    );

    // Calculations - Accurate separation of Verified vs Pending/Failed transactions
    const successfulDonations = donations.filter(d => {
        const s = (d.status || '').toLowerCase();
        return s === 'completed' || s === 'success';
    });
    const totalVerifiedAmount = successfulDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const effectiveMemberId = trustMember?.memberId || user?.trustMemberId || user?.memberId || 'KCT-MEM-1007';
    const monthlyPledgeAmt = (trustMember?.donationAmount && Number(trustMember.donationAmount) >= 500)
        ? Number(trustMember.donationAmount)
        : 500;
    const memberSinceDate = trustMember?.createdAt || user?.createdAt || new Date();
    const memberSinceStr = new Date(memberSinceDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const handleExportCSV = () => {
        if (!donations || donations.length === 0) {
            toast.info('No contribution records to export.');
            return;
        }
        const headers = ['Receipt ID', 'Date', 'Initiative / Purpose', 'Amount (INR)', 'Payment Status', '80G Eligible'];
        const rows = filteredDonations.map(d => [
            `"${d.receiptNumber || d.transactionId || 'KCT-REC'}"`,
            `"${new Date(d.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}"`,
            `"${(d.campaignTitle || d.purpose || 'General Trust Social Welfare').replace(/"/g, '""')}"`,
            Number(d.amount || 0),
            `"${(d.status || 'completed').toUpperCase()}"`,
            `"Yes (80G Form 10BE)"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `KCT_Official_Contributions_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Official contribution records exported successfully.');
    };

    const filteredDonations = donations.filter(d => {
        const q = paymentSearch.trim().toLowerCase();
        const rId = (d.receiptNumber || d.transactionId || '').toLowerCase();
        const purpose = (d.campaignTitle || d.purpose || '').toLowerCase();
        const amt = String(d.amount || '');
        const matchesSearch = !q || rId.includes(q) || purpose.includes(q) || amt.includes(q);

        const sLower = (d.status || '').toLowerCase();
        const isCompleted = sLower === 'completed' || sLower === 'success';
        const isPending = sLower === 'pending';
        const isFailed = !isCompleted && !isPending;

        let matchesStatus = true;
        if (paymentStatusFilter === 'completed') matchesStatus = isCompleted;
        else if (paymentStatusFilter === 'pending') matchesStatus = isPending;
        else if (paymentStatusFilter === 'failed') matchesStatus = isFailed;

        let matchesDate = true;
        if (paymentDateFilter === 'last30') {
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            matchesDate = new Date(d.createdAt || Date.now()).getTime() >= thirtyDaysAgo;
        } else if (paymentDateFilter === '2026') {
            matchesDate = new Date(d.createdAt || Date.now()).getFullYear() === 2026;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <div className="user-console-shell" style={{ paddingTop: '0px', minHeight: 'auto' }}>
            {/* MAIN WORKSPACE CONTENT */}
            <main className="user-console-workspace">
                {/* ========================================================
                    DASHBOARD OVERVIEW TAB (Matching Panel 5)
                   ======================================================== */}
                {activeTab === 'dashboard' && (
                    <div>
                        {/* Welcome Banner - High-contrast, clean & accessible */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: '24px 28px',
                            color: '#0f172a',
                            marginBottom: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 16,
                            boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                    Official Trust Member Workspace
                                </div>
                                <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                    Welcome back, <span style={{ color: '#2563eb' }}>{name || user?.name || 'Kiran'}</span> 👋
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13, color: '#64748b' }}>
                                        Trust Member ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>{effectiveMemberId}</strong>
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 800 }}>
                                        ● Active Member
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid #e2e8f0',
                                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22,
                                fontWeight: 800,
                                color: '#ffffff',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                            }}>
                                {avatarPreview && avatarPreview !== 'undefined' && !avatarLoadError ? (
                                    <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarLoadError(true)} />
                                ) : (
                                    (name || user?.name || 'U').charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>

                        {/* 4 KPI Metrics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
                            {/* Card 1: Total Contributed */}
                            <div className="pt-stat-card" style={{
                                background: '#ffffff',
                                padding: '22px 24px',
                                borderRadius: 16,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', bottom: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        <FaCoins />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                                            Total Contributed
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', lineHeight: 1.15 }}>
                                            ₹{Number(totalVerifiedAmount).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>Direct community welfare</div>
                            </div>

                            {/* Card 2: Monthly Contribution */}
                            <div className="pt-stat-card" style={{
                                background: '#ffffff',
                                padding: '22px 24px',
                                borderRadius: 16,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', bottom: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        <FaCalendarAlt />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                                            Monthly Contribution
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', lineHeight: 1.15 }}>
                                            ₹{Number(monthlyPledgeAmt).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>Active Sustaining AutoPay</div>
                            </div>

                            {/* Card 3: Receipts */}
                            <div className="pt-stat-card" style={{
                                background: '#ffffff',
                                padding: '22px 24px',
                                borderRadius: 16,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', bottom: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        <FaReceipt />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                                            Receipts
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', lineHeight: 1.15 }}>
                                            {successfulDonations.length}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>80G Tax Deductible</div>
                            </div>

                            {/* Card 4: Member Since */}
                            <div className="pt-stat-card" style={{
                                background: '#ffffff',
                                padding: '22px 24px',
                                borderRadius: 16,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', bottom: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        <FaUsers />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                                            Member Since
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
                                            {memberSinceStr}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>Regd. No. 2/2026</div>
                            </div>
                        </div>

                        {/* Quick Actions Panel */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: '20px 24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            marginBottom: 24
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
                                <FaBolt style={{ color: '#f59e0b' }} /> Quick Actions
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => handleTabSwitch('profile')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        padding: '12px 18px',
                                        borderRadius: 10,
                                        background: '#0b1e4f',
                                        color: '#ffffff',
                                        fontSize: 13.5,
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(11, 30, 79, 0.25)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FaIdCard /> View ID Card
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTabSwitch('profile')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        padding: '12px 18px',
                                        borderRadius: 10,
                                        background: '#ffffff',
                                        color: '#1e293b',
                                        fontSize: 13.5,
                                        fontWeight: 700,
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FaUser style={{ color: '#64748b' }} /> Update Profile
                                </button>

                                <Link
                                    to="/portal/monthly-donor"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        padding: '12px 18px',
                                        borderRadius: 10,
                                        background: '#ffffff',
                                        color: '#1e293b',
                                        fontSize: 13.5,
                                        fontWeight: 700,
                                        border: '1px solid #e2e8f0',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FaCreditCard style={{ color: '#64748b' }} /> Manage AutoPay
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => handleTabSwitch('payments')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        padding: '12px 18px',
                                        borderRadius: 10,
                                        background: '#ffffff',
                                        color: '#1e293b',
                                        fontSize: 13.5,
                                        fontWeight: 700,
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FaDownload style={{ color: '#64748b' }} /> Download Receipts
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Snapshot */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                                    <FaReceipt style={{ color: '#2563eb' }} /> Recent Contributions &amp; Receipts
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTabSwitch('payments')}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                    View All History →
                                </button>
                            </div>
                            <div style={{ padding: 0 }}>
                                {donations.length === 0 ? (
                                    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                                        <FaCheckCircle style={{ color: '#059669', fontSize: 32, marginBottom: 8 }} />
                                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a' }}>Your membership contribution is verified</p>
                                        <p style={{ margin: 0, fontSize: 13 }}>Official 80G Tax Exemption receipts are generated instantly for every contribution.</p>
                                    </div>
                                ) : (
                                    <div className="user-table-wrap">
                                        <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                                                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, fontWeight: 700, color: '#475569' }}><FaCalendarAlt style={{ marginRight: 6, color: '#94a3b8' }} />Date</th>
                                                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, fontWeight: 700, color: '#475569' }}># Receipt #</th>
                                                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, fontWeight: 700, color: '#475569' }}><FaCube style={{ marginRight: 6, color: '#94a3b8' }} />Purpose</th>
                                                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, fontWeight: 700, color: '#475569' }}><FaCoins style={{ marginRight: 6, color: '#94a3b8' }} />Amount</th>
                                                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, fontWeight: 700, color: '#475569' }}><FaInfoCircle style={{ marginRight: 6, color: '#94a3b8' }} />Status</th>
                                                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, fontWeight: 700, color: '#475569' }}><FaCog style={{ marginRight: 6, color: '#94a3b8' }} />Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {donations.slice(0, 5).map((d, idx) => {
                                                    const sLower = (d.status || '').toLowerCase();
                                                    const isSuccess = sLower === 'completed' || sLower === 'success';
                                                    const isPending = sLower === 'pending';
                                                    const purposeText = d.campaignTitle || d.purpose || 'Trust Sustaining Contribution';
                                                    const isEducation = purposeText.toLowerCase().includes('education') || purposeText.toLowerCase().includes('scholarship');
                                                    const isAutoPay = purposeText.toLowerCase().includes('autopay') || purposeText.toLowerCase().includes('subscription') || purposeText.toLowerCase().includes('monthly');
                                                    const receiptIdStr = d.receiptNumber || d.transactionId?.substring(0, 18) || `KCT-${idx + 1042}`;

                                                    return (
                                                        <tr key={d._id || d.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '14px 18px', fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                <FaCalendarAlt style={{ marginRight: 6, color: '#cbd5e1' }} />
                                                                {new Date(d.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', fontSize: 12.5 }}>
                                                                <a
                                                                    href="#receipt"
                                                                    onClick={(e) => { e.preventDefault(); setSelectedReceipt(d); }}
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', textDecoration: 'none' }}
                                                                >
                                                                    {receiptIdStr}
                                                                    <FaExternalLinkAlt style={{ fontSize: 10, opacity: 0.7 }} />
                                                                </a>
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontSize: 13, color: '#1e293b' }}>
                                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                                    {isEducation ? (
                                                                        <FaGraduationCap style={{ color: '#7c3aed', flexShrink: 0, fontSize: 15 }} />
                                                                    ) : isAutoPay ? (
                                                                        <FaCalendarAlt style={{ color: '#7c3aed', flexShrink: 0, fontSize: 15 }} />
                                                                    ) : (
                                                                        <FaUsers style={{ color: '#7c3aed', flexShrink: 0, fontSize: 15 }} />
                                                                    )}
                                                                    <span style={{ fontWeight: 600 }}>{purposeText}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: 14, color: isSuccess ? '#059669' : isPending ? '#d97706' : '#dc2626', whiteSpace: 'nowrap' }}>
                                                                ₹{Number(d.amount).toLocaleString('en-IN')}
                                                            </td>
                                                            <td style={{ padding: '14px 18px' }}>
                                                                {isSuccess ? (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700 }}>
                                                                        ✓ Verified
                                                                    </span>
                                                                ) : isPending ? (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 700 }}>
                                                                        ⏳ Pending
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                                                                        ✕ Failed
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '14px 18px' }}>
                                                                {isSuccess ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedReceipt(d)}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 6,
                                                                            padding: '5px 14px',
                                                                            borderRadius: 20,
                                                                            background: '#ffffff',
                                                                            border: '1px solid #cbd5e1',
                                                                            color: '#0f172a',
                                                                            fontSize: 12,
                                                                            fontWeight: 700,
                                                                            cursor: 'pointer',
                                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                                        }}
                                                                    >
                                                                        <FaDownload style={{ fontSize: 10, color: '#64748b' }} /> Receipt
                                                                    </button>
                                                                ) : isPending ? (
                                                                    <span style={{ fontSize: 12, color: '#64748b' }}>Awaiting Confirmation</span>
                                                                ) : (
                                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    SECTION 2: PROFILE UPDATES
                   ======================================================== */}
                {activeTab === 'profile' && (
                    <div>
                        {/* Member Status Banner if Member */}
                        {trustMember && (
                            <div style={{
                                background: 'linear-gradient(135deg, #1e3a8a, #1e293b)',
                                color: '#ffffff',
                                padding: '16px 20px',
                                borderRadius: 10,
                                marginBottom: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 12,
                                border: '1px solid #3b82f6'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#60a5fa' }}>
                                        <FaIdCard />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                            Official Trust Member • {(trustMember.subscriptionTier || 'Member Tier').replace(/Patron/gi, 'Member')}
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                                            Membership ID: <span style={{ color: '#fbbf24', letterSpacing: 1 }}>{trustMember.memberId || trustMember.member_id || 'KCT-MEM-1032'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 12, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
                                        Active Standing
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* SECTION 1: Personal Credentials & Photo (Dropdown Accordion) */}
                        <div className="user-card" style={{ marginBottom: 18, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                            <div
                                className="user-card-header"
                                onClick={() => toggleSection('personal')}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: '#F8FAFC', padding: '16px 20px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontSize: 16 }}>
                                        <FaUser />
                                    </div>
                                    <div>
                                        <h2 className="user-card-title" style={{ fontSize: 15, margin: 0, fontWeight: 800, color: '#0F172A' }}>Personal Details &amp; Profile Photo</h2>
                                        <p className="user-card-sub" style={{ fontSize: 12, margin: '2px 0 0', color: '#64748B' }}>Manage your name, mobile, photo, and residential address</p>
                                    </div>
                                </div>
                                <FaChevronDown style={{ color: '#64748B', fontSize: 13, transform: expandedSections.personal ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            </div>

                            {expandedSections.personal && (
                                <div className="user-card-body" style={{ padding: '20px' }}>
                                    {/* Profile Photo Section */}
                                    <div className="user-photo-box">
                                        <div className="user-photo-avatar">
                                            {avatarPreview && avatarPreview !== 'undefined' && !avatarLoadError ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                    onError={() => setAvatarLoadError(true)}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', fontSize: 26, fontWeight: 800 }}>
                                                    {(name || user?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-photo-meta">
                                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Profile Photo</h3>
                                            <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 10px' }}>Used for your official Trust Member ID card and donor recognitions (JPG, PNG up to 5MB).</p>
                                            <button
                                                type="button"
                                                className="user-btn-secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={photoUploading}
                                            >
                                                <FaCamera /> {photoUploading ? 'Uploading to Secure Storage...' : 'Change Profile Photo'}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Profile Update Form */}
                                    <form onSubmit={handleSaveProfile} style={{ marginTop: 20 }}>
                                        <div className="user-form-grid">
                                            <div className="user-form-group">
                                                <label className="user-form-label">Full Legal Name *</label>
                                                <input
                                                    type="text"
                                                    className="user-input"
                                                    placeholder="Enter your full legal name"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="user-form-group">
                                                <label className="user-form-label">Registered Email Address</label>
                                                <input
                                                    type="email"
                                                    className="user-input"
                                                    value={user?.email || ''}
                                                    disabled
                                                    style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                                                />
                                                <small style={{ color: '#059669', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>
                                                    ✔ Verified Email Address
                                                </small>
                                            </div>

                                            <div className="user-form-group">
                                                <label className="user-form-label">Mobile Number *</label>
                                                <input
                                                    type="tel"
                                                    className="user-input"
                                                    placeholder="+91 9392785230"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="user-form-group">
                                                <label className="user-form-label">Residential Address</label>
                                                <input
                                                    type="text"
                                                    className="user-input"
                                                    placeholder="Door No, Street, Village/City, District, State, Pincode"
                                                    value={address}
                                                    onChange={e => setAddress(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                            <button
                                                type="submit"
                                                className="user-btn-primary"
                                                disabled={saving}
                                            >
                                                <FaCheckCircle /> {saving ? 'Saving...' : 'Save Personal Details'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: Statutory Verification & Tax KYC (Dropdown Accordion) */}
                        <div className="user-card" style={{ marginBottom: 18, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                            <div
                                className="user-card-header"
                                onClick={() => toggleSection('kyc')}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: '#F8FAFC', padding: '16px 20px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: 16 }}>
                                        <FaShieldAlt />
                                    </div>
                                    <div>
                                        <h2 className="user-card-title" style={{ fontSize: 15, margin: 0, fontWeight: 800, color: '#0F172A' }}>Statutory Verification &amp; Tax KYC</h2>
                                        <p className="user-card-sub" style={{ fontSize: 12, margin: '2px 0 0', color: '#64748B' }}>Aadhaar UIDAI verification and PAN number for 80G tax exemptions</p>
                                    </div>
                                </div>
                                <FaChevronDown style={{ color: '#64748B', fontSize: 13, transform: expandedSections.kyc ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            </div>

                            {expandedSections.kyc && (
                                <div className="user-card-body" style={{ padding: '20px' }}>
                                    <form onSubmit={handleSaveProfile}>
                                        <div className="user-form-grid">
                                            <div className="user-form-group">
                                                <label className="user-form-label">
                                                    Aadhaar Card Number <span style={{ color: '#dc2626', fontWeight: 800 }}>* (Mandatory 12-Digits)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="user-input"
                                                    placeholder="XXXX XXXX XXXX (12 Digits)"
                                                    maxLength={14}
                                                    value={aadharNumber}
                                                    onChange={e => {
                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                        const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                                                        setAadharNumber(formatted);
                                                    }}
                                                    required
                                                />
                                                <small style={{ color: '#64748b', fontSize: 11, marginTop: 4, display: 'block' }}>
                                                    Statutory 12-digit UIDAI identification required for all registered trust members.
                                                </small>
                                            </div>

                                            <div className="user-form-group">
                                                <label className="user-form-label">PAN Card Number <span style={{ color: '#64748b', fontWeight: 500 }}>(For 80G Tax Deductions)</span></label>
                                                <input
                                                    type="text"
                                                    className="user-input"
                                                    placeholder="ABCDE1234F"
                                                    maxLength={10}
                                                    value={panNumber}
                                                    onChange={e => setPanNumber(e.target.value.toUpperCase())}
                                                />
                                                <small style={{ color: '#64748b', fontSize: 11, marginTop: 4, display: 'block' }}>
                                                    Income Tax Department PAN required for 80G instant tax deduction certificate.
                                                </small>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                            <button
                                                type="submit"
                                                className="user-btn-primary"
                                                disabled={saving}
                                            >
                                                <FaCheckCircle /> {saving ? 'Saving...' : 'Save KYC Details'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: Security & Password Management (Dropdown Accordion) */}
                        <div className="user-card" style={{ marginBottom: 18, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                            <div
                                className="user-card-header"
                                onClick={() => toggleSection('security')}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: '#F8FAFC', padding: '16px 20px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontSize: 16 }}>
                                        <FaLock />
                                    </div>
                                    <div>
                                        <h2 className="user-card-title" style={{ fontSize: 15, margin: 0, fontWeight: 800, color: '#0F172A' }}>Security &amp; Password Management</h2>
                                        <p className="user-card-sub" style={{ fontSize: 12, margin: '2px 0 0', color: '#64748B' }}>
                                            {hasPassword
                                                ? 'Change your existing account password securely.'
                                                : 'Set an account password for direct email + password sign in.'}
                                        </p>
                                    </div>
                                </div>
                                <FaChevronDown style={{ color: '#64748B', fontSize: 13, transform: expandedSections.security ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            </div>

                            {expandedSections.security && (
                                <div className="user-card-body" style={{ padding: '20px' }}>
                                    <form onSubmit={handleUpdatePassword}>
                                        <div className="user-form-grid">
                                            {hasPassword ? (
                                                <div className="user-form-group">
                                                    <label className="user-form-label">Current Password *</label>
                                                    <input
                                                        type="password"
                                                        className="user-input"
                                                        placeholder="Enter existing password"
                                                        value={currentPassword}
                                                        onChange={e => setCurrentPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            ) : null}
                                            <div className="user-form-group">
                                                <label className="user-form-label">
                                                    New Password * (Min 6 characters)
                                                </label>
                                                <input
                                                    type="password"
                                                    className="user-input"
                                                    placeholder="Enter secure new password"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="user-form-group">
                                                <label className="user-form-label">Confirm New Password *</label>
                                                <input
                                                    type="password"
                                                    className="user-input"
                                                    placeholder="Confirm new password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                            <button
                                                type="submit"
                                                className="user-btn-primary"
                                                disabled={pwUpdating}
                                            >
                                                <FaLock /> {pwUpdating ? 'Saving Password...' : (hasPassword ? 'Update Password' : 'Set Account Password')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================
                    SECTION 2: PAYMENT HISTORY & 80G RECEIPTS
                   ======================================================== */}
                {activeTab === 'payments' && (
                    <div>
                        {/* Summary Stats */}
                        <div className="user-stat-grid">
                            <div className="user-stat-box">
                                <div className="user-stat-label">Total Contributions</div>
                                <div className="user-stat-value" style={{ color: '#059669' }}>
                                    ₹{(totalVerifiedAmount || 0).toLocaleString('en-IN')}
                                </div>
                            </div>

                            <div className="user-stat-box">
                                <div className="user-stat-label">Transactions Recorded</div>
                                <div className="user-stat-value" style={{ color: '#2563eb' }}>
                                    {donations.length}
                                </div>
                            </div>

                            <div className="user-stat-box">
                                <div className="user-stat-label">80G Certificates Available</div>
                                <div className="user-stat-value" style={{ color: '#d97706' }}>
                                    {successfulDonations.length}
                                </div>
                            </div>
                        </div>

                        {/* In-Portal Direct Member Contribution Console in Payments Section */}
                        {showPaymentsContribute && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -14, position: 'relative', zIndex: 5 }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentsContribute(false)}
                                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700, color: '#475569' }}
                                    >
                                        ✕ Hide Contribution Form
                                    </button>
                                </div>
                                {renderContributionConsole()}
                            </div>
                        )}

                        {/* Payments Table - Official Contribution History & Receipts */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            padding: '24px',
                            marginBottom: 20
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 12,
                                        background: '#eff6ff',
                                        color: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 22
                                    }}>
                                        <FaReceipt />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Contribution History &amp; Official Receipts</h2>
                                        <p style={{ margin: '3px 0 0', fontSize: 13.5, color: '#64748b' }}>View all your contributions, download official receipts, and 80G tax exemption certificates.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentsContribute(prev => !prev)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#4f46e5',
                                        color: '#ffffff',
                                        borderRadius: 10,
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: 13.5,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <FaHeart /> {showPaymentsContribute ? 'Hide Form' : 'Make a Contribution'}
                                </button>
                            </div>

                            {/* Toolbar: Search, Date Filter, Status Filter, Export */}
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    background: '#ffffff',
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: 10,
                                    padding: '0 14px',
                                    flex: 1,
                                    minWidth: 260,
                                    height: 42
                                }}>
                                    <FaSearch style={{ color: '#94a3b8', fontSize: 14 }} />
                                    <input
                                        type="text"
                                        placeholder="Search by Receipt ID, Purpose or Amount..."
                                        value={paymentSearch}
                                        onChange={e => setPaymentSearch(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13.5, color: '#0f172a' }}
                                    />
                                    {paymentSearch && (
                                        <button type="button" onClick={() => setPaymentSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}>
                                            <FaTimes style={{ fontSize: 12 }} />
                                        </button>
                                    )}
                                </div>

                                <select
                                    value={paymentDateFilter}
                                    onChange={e => setPaymentDateFilter(e.target.value)}
                                    style={{
                                        height: 42,
                                        padding: '0 16px',
                                        borderRadius: 10,
                                        border: '1.5px solid #e2e8f0',
                                        background: '#ffffff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">📅 All Dates</option>
                                    <option value="last30">Last 30 Days</option>
                                    <option value="2026">Year 2026</option>
                                </select>

                                <select
                                    value={paymentStatusFilter}
                                    onChange={e => setPaymentStatusFilter(e.target.value)}
                                    style={{
                                        height: 42,
                                        padding: '0 16px',
                                        borderRadius: 10,
                                        border: '1.5px solid #e2e8f0',
                                        background: '#ffffff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">🔘 All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={handleExportCSV}
                                    style={{
                                        height: 42,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '0 18px',
                                        borderRadius: 10,
                                        border: '1.5px solid #e2e8f0',
                                        background: '#ffffff',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: '#334155',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <FaDownload style={{ color: '#64748b' }} /> Export
                                </button>
                            </div>

                            <div style={{ padding: 0 }}>
                                <div className="user-table-wrap">
                                    <table className="user-table">
                                        <thead>
                                            <tr style={{ background: '#eef2ff', borderBottom: '1.5px solid #e0e7ff' }}>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Receipt ID</th>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Date</th>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Initiative / Purpose</th>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Amount (INR)</th>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Payment Status</th>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155', textAlign: 'center' }}>Tax Exemption (80G)</th>
                                                <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#334155', textAlign: 'center' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDonations.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                                        <FaReceipt style={{ fontSize: 28, color: '#cbd5e1', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                                                        No matching contribution records found.
                                                        <div style={{ marginTop: 12 }}>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setShowPaymentsContribute(true)} 
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    padding: '8px 18px',
                                                                    borderRadius: 8,
                                                                    background: '#4f46e5',
                                                                    color: '#ffffff',
                                                                    border: 'none',
                                                                    fontWeight: 700,
                                                                    fontSize: 13,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <FaHeart /> Make Contribution
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredDonations.map((d, idx) => {
                                                    const sLower = (d.status || '').toLowerCase();
                                                    const isSuccess = sLower === 'completed' || sLower === 'success';
                                                    const isPending = sLower === 'pending';
                                                    const purposeText = d.campaignTitle || d.purpose || 'General Trust Social Welfare & Education';
                                                    const isEducation = purposeText.toLowerCase().includes('education') || purposeText.toLowerCase().includes('scholarship');
                                                    const isAutoPay = purposeText.toLowerCase().includes('autopay') || purposeText.toLowerCase().includes('subscription') || purposeText.toLowerCase().includes('monthly');
                                                    const receiptIdStr = d.receiptNumber || d.transactionId?.substring(0, 18) || `KCT-${idx + 1042}`;

                                                    return (
                                                        <tr key={d._id || d.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '15px 18px' }}>
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    background: '#eff6ff',
                                                                    color: '#1d4ed8',
                                                                    padding: '6px 12px',
                                                                    borderRadius: 8,
                                                                    fontWeight: 700,
                                                                    fontSize: 12.5,
                                                                    fontFamily: 'monospace'
                                                                }}>
                                                                    {receiptIdStr}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '15px 18px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                                                                <FaCalendarAlt style={{ marginRight: 6, color: '#94a3b8' }} />
                                                                {new Date(d.createdAt || Date.now()).toLocaleDateString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td style={{ padding: '15px 18px', fontSize: 13, color: '#1e293b' }}>
                                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                                    {isEducation ? (
                                                                        <FaGraduationCap style={{ color: '#7c3aed', flexShrink: 0, fontSize: 15 }} />
                                                                    ) : isAutoPay ? (
                                                                        <FaCalendarAlt style={{ color: '#7c3aed', flexShrink: 0, fontSize: 15 }} />
                                                                    ) : (
                                                                        <FaUsers style={{ color: '#7c3aed', flexShrink: 0, fontSize: 15 }} />
                                                                    )}
                                                                    <span style={{ fontWeight: 600 }}>{purposeText}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '15px 18px', fontWeight: 800, color: '#059669', fontSize: 14, whiteSpace: 'nowrap' }}>
                                                                ₹{Number(d.amount || 0).toLocaleString('en-IN')}
                                                            </td>
                                                            <td style={{ padding: '15px 18px' }}>
                                                                {isSuccess ? (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700 }}>
                                                                        ✓ Completed
                                                                    </span>
                                                                ) : isPending ? (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 700 }}>
                                                                        ⏳ Pending
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, background: '#fee2e2', color: '#ef4444', fontSize: 12, fontWeight: 700 }}>
                                                                        ✕ Failed
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '15px 18px', textAlign: 'center', color: '#94a3b8' }}>
                                                                —
                                                            </td>
                                                            <td style={{ padding: '15px 18px', textAlign: 'center' }}>
                                                                {isSuccess ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedReceipt(d)}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 6,
                                                                            padding: '6px 14px',
                                                                            borderRadius: 8,
                                                                            background: '#ffffff',
                                                                            border: '1.5px solid #cbd5e1',
                                                                            color: '#334155',
                                                                            fontSize: 12,
                                                                            fontWeight: 700,
                                                                            cursor: 'pointer',
                                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        <FaDownload style={{ fontSize: 11, color: '#64748b' }} /> Print 80G Form
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            borderRadius: 8,
                                                                            background: '#ffffff',
                                                                            border: '1px solid #e2e8f0',
                                                                            color: '#64748b',
                                                                            fontSize: 12,
                                                                            fontWeight: 800,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        •••
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    SECTION 3: NOTIFICATIONS & TRUST UPDATES
                    WITH "MARK AS READ" AND "CLEAR ALL" OPTIONS
                   ======================================================== */}
                {activeTab === 'notifications' && (
                    <div>
                        <div className="user-card">
                            <div className="user-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h2 className="user-card-title"><FaBell style={{ color: '#2563eb' }} /> Notifications &amp; Trust Updates</h2>
                                    <p className="user-card-sub">Stay informed with direct notices, 80G certificate releases, and ground impact reports.</p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {notifications.length > 0 && (
                                        <>
                                            <button
                                                type="button"
                                                className="user-btn-secondary"
                                                onClick={handleMarkAllAsRead}
                                                style={{ fontSize: 12, padding: '6px 12px' }}
                                                title="Mark all notifications as read"
                                            >
                                                <FaCheckDouble style={{ color: '#2563eb' }} /> Mark All as Read
                                            </button>
                                            <button
                                                type="button"
                                                className="user-btn-secondary"
                                                onClick={handleClearAllNotifs}
                                                style={{ fontSize: 12, padding: '6px 12px', color: '#dc2626', borderColor: '#fca5a5' }}
                                                title="Clear all notifications"
                                            >
                                                <FaTrashAlt /> Clear All
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="user-card-body">
                                {notifications.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                                        <FaCheckCircle style={{ fontSize: 36, color: '#10b981', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>All Caught Up!</h3>
                                        <p style={{ fontSize: 13, margin: '0 0 16px' }}>You have cleared all active notifications and updates.</p>
                                        <button
                                            type="button"
                                            onClick={handleResetNotifs}
                                            className="user-btn-secondary"
                                            style={{ fontSize: 12 }}
                                        >
                                            <FaSyncAlt /> Restore Trust Notices
                                        </button>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className="notification-item"
                                            style={{
                                                opacity: n.read ? 0.75 : 1,
                                                background: n.read ? '#ffffff' : '#f0f9ff',
                                                borderLeft: n.read ? '4px solid #cbd5e1' : '4px solid #2563eb',
                                                display: 'flex',
                                                gap: 14,
                                                padding: 16,
                                                borderRadius: 8,
                                                border: '1px solid #e2e8f0',
                                                borderLeftWidth: 4,
                                                marginBottom: 12,
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <div className={`notification-icon-wrap ${n.icon}`}>
                                                {n.icon === 'green' && <FaCheckCircle />}
                                                {n.icon === 'blue' && <FaShieldAlt />}
                                                {n.icon === 'amber' && <FaHeart />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                    <h3 className="notification-title" style={{ margin: 0, fontWeight: n.read ? 600 : 800 }}>
                                                        {n.title}
                                                    </h3>
                                                    {!n.read && (
                                                        <span style={{ fontSize: 10, fontWeight: 800, background: '#2563eb', color: '#ffffff', padding: '2px 6px', borderRadius: 10, letterSpacing: 0.5 }}>
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="notification-desc" style={{ margin: '4px 0 6px', fontSize: 13, color: '#475569' }}>{n.desc}</p>
                                                <div className="notification-time" style={{ fontSize: 11, color: '#94a3b8' }}>{n.time}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleRead(n.id)}
                                                    className="user-btn-secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11 }}
                                                    title={n.read ? 'Mark as Unread' : 'Mark as Read'}
                                                >
                                                    {n.read ? 'Mark Unread' : 'Mark Read'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDismissNotif(n.id)}
                                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', fontSize: 13 }}
                                                    title="Dismiss"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ========================================================
                OFFICIAL FORM 10BE / 80G DONATION TAX RECEIPT MODAL
               ======================================================== */}
            {selectedReceipt && (
                <div className="official-receipt-modal-overlay" onClick={() => setSelectedReceipt(null)}>
                    <div className="official-receipt-modal" onClick={e => e.stopPropagation()}>
                        {/* Top Action Bar (hidden during print) */}
                        <div className="receipt-modal-actions no-print">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>CBDT Form 10BE Official Electronic Receipt Record</span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button
                                    type="button"
                                    className="user-btn-primary"
                                    onClick={() => window.print()}
                                    style={{ padding: '8px 18px', fontSize: 13 }}
                                >
                                    <FaPrint /> Print / Save PDF
                                </button>
                                <button
                                    type="button"
                                    className="receipt-close-btn"
                                    onClick={() => setSelectedReceipt(null)}
                                    title="Close Preview"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* Printable Receipt Area */}
                        <div className="official-receipt-print-area">
                            {/* 1. Top Branding Header */}
                            <div className="receipt-top-brand">
                                <div className="receipt-brand-left">
                                    <img src={KLogo} alt="Kiran Charitable Trust" className="receipt-trust-logo" />
                                    <div>
                                        <h3 className="receipt-brand-title">Kiran Charitable Trust</h3>
                                        <p className="receipt-brand-tagline">Healthcare • Education • Orphan Support • Food Security • Rural Empowerment</p>
                                    </div>
                                </div>
                                <div className="receipt-reg-badge">
                                    Regd. No. 3/2026
                                </div>
                            </div>

                            {/* 2. Navy Hero Banner */}
                            <div className="receipt-navy-banner">
                                <div className="receipt-banner-statutory">
                                    ★ Government of India Recognized NGO • Section 80G &amp; 12A Certified ★
                                </div>
                                <h1 className="receipt-banner-h1">KIRAN CHARITABLE TRUST</h1>
                                <p className="receipt-banner-address">
                                    Registered Office: Mandepudi, Nemalikallu, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
                                </p>
                                <div className="receipt-banner-contacts">
                                    contact@kirancharitabletrust.org &nbsp;|&nbsp; +91 77024 68889 &nbsp;|&nbsp; www.kirancharitabletrust.org
                                </div>
                            </div>

                            {/* 3. Statutory 4-Card Row */}
                            <div className="receipt-statutory-grid">
                                <div className="receipt-statutory-box">
                                    <div className="lbl">Trust PAN</div>
                                    <div className="val">AAGTK5575Q</div>
                                </div>
                                <div className="receipt-statutory-box">
                                    <div className="lbl">12A URN</div>
                                    <div className="val">AAGTK5575QE20261</div>
                                    <div className="sub">(u/s 332)</div>
                                </div>
                                <div className="receipt-statutory-box">
                                    <div className="lbl">80G URN</div>
                                    <div className="val" style={{ color: '#2563eb' }}>AAGTK5575QF20261</div>
                                    <div className="sub">(u/s 354, Form 10G)</div>
                                </div>
                                <div className="receipt-statutory-box">
                                    <div className="lbl">Tax Exemption</div>
                                    <div className="val" style={{ color: '#059669' }}>50% under 80G</div>
                                    <div className="sub">Sec 80G(5)(vi)</div>
                                </div>
                            </div>

                            {/* 4. Official Title Pill */}
                            <div className="receipt-title-pill-wrap">
                                <div className="receipt-title-pill">
                                    ✔ OFFICIAL DONATION &amp; TAX EXEMPTION RECEIPT
                                </div>
                                <div className="receipt-title-sub">
                                    Issued under Rule 18AB of the Income Tax Rules, 1962 (CBDT Form 10BE Format)
                                </div>
                            </div>

                            {/* 5. Identification & Date-Time Bar */}
                            <div className="receipt-meta-bar">
                                <div className="receipt-meta-item">
                                    <span style={{ color: '#64748b' }}>Receipt No: </span>
                                    <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>
                                        {selectedReceipt.receiptNumber || selectedReceipt.receiptNo || ('KCT-' + (selectedReceipt.id || selectedReceipt._id || Date.now()))}
                                    </strong>
                                </div>
                                <div className="receipt-meta-item">
                                    <span style={{ color: '#64748b' }}>Date &amp; Time: </span>
                                    <strong>
                                        {formatReceiptDateTime(selectedReceipt.createdAt || selectedReceipt.created_at || selectedReceipt.date)}
                                    </strong>
                                </div>
                            </div>

                            {/* 6. Donor Identification Particulars */}
                            <div className="receipt-section-title">
                                <FaUser style={{ color: '#2563eb' }} /> Donor Identification Particulars
                            </div>
                            <table className="receipt-particulars-table">
                                <tbody>
                                    <tr>
                                        <td className="lbl">Donor Full Name:</td>
                                        <td className="val">{user?.name || selectedReceipt.fullName || selectedReceipt.name || 'Valued Philanthropist'}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">Email Address:</td>
                                        <td className="val">{user?.email || selectedReceipt.email || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">Contact Mobile:</td>
                                        <td className="val">{user?.phone || selectedReceipt.mobile || selectedReceipt.phone || '+91 9392785230'}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">Residential Address:</td>
                                        <td className="val">{user?.address || selectedReceipt.address || 'Mandepudi, Nemalikallu, Amaravathi, Palnadu, Guntur - 522018'}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">PAN Card Number:</td>
                                        <td className="val">{user?.panNumber || selectedReceipt.panNumber || selectedReceipt.pan || 'Available on IT portal'}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">Contribution Mode:</td>
                                        <td className="val">
                                            {selectedReceipt.donorCategory === 'trust_member_contribution'
                                                ? '🌟 Official Trust Member Monthly Commitment'
                                                : '⭐ One-Time Philanthropic Contribution'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* 7. Description / Cause & Amount Box */}
                            <table className="receipt-table-main">
                                <thead>
                                    <tr>
                                        <th>Description / Charitable Cause</th>
                                        <th className="amt">Amount (INR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="receipt-cause-title">
                                                {selectedReceipt.purpose || 'General Trust Social Welfare & Community Drives'}
                                            </div>
                                            <div className="receipt-cause-sub">
                                                Payment Method / Gateway: {selectedReceipt.paymentMethod || selectedReceipt.paymentMode || 'SabPaisa PG (Canara Bank Verified)'}
                                            </div>
                                        </td>
                                        <td className="receipt-amt-big">
                                            ₹{Number(selectedReceipt.amount || 0).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="receipt-words-row">
                                            <strong>Amount in Words: </strong>
                                            {numberToWordsIndian(selectedReceipt.amount || 0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Transaction Reference & Status Bar */}
                            <div className="receipt-txn-row" style={{ border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16 }}>
                                <div>
                                    <span style={{ color: '#64748b' }}>Transaction Reference / UTR: </span>
                                    <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: 13 }}>
                                        {selectedReceipt.transactionId || selectedReceipt.clientTxnId || selectedReceipt.txnId || '431294380744'}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', marginRight: 8 }}>Payment Status:</span>
                                    <span className="receipt-status-badge">✔ CONFIRMED / PAID</span>
                                </div>
                            </div>

                            {/* 8. Statutory 80G Certification Note */}
                            <div className="receipt-cert-box">
                                <strong>Statutory 80G Certification: </strong>
                                Certified that this donation has been received for the charitable objectives of Kiran Charitable Trust
                                (Healthcare, Education, Orphan Support, Food Security &amp; Rural Empowerment). This donation is eligible
                                for deduction under Section 80G(5)(vi) of the Income Tax Act, 1961. This computer-generated receipt is
                                electronically verified and does not require a physical seal or signature under IT Rules.
                            </div>

                            {/* 9. Signatures & Electronic Verification Footer */}
                            <div className="receipt-footer-row">
                                <div className="receipt-verified-seal">
                                    <div className="receipt-seal-icon">
                                        <FaShieldAlt />
                                    </div>
                                    <div className="receipt-seal-text">
                                        <h4>Computer Verified Certificate</h4>
                                        <p>Form 10BE compliant electronic receipt record.</p>
                                    </div>
                                </div>
                                <div className="receipt-sign-block">
                                    <div className="receipt-sign-name">P. Kiranbabu</div>
                                    <div className="receipt-sign-role">Pallepogu Kiranbabu</div>
                                    <div className="receipt-sign-trust">Founder &amp; Managing Trustee, Kiran Charitable Trust</div>
                                </div>
                            </div>

                            {/* 10. Bottom Assistance Bar */}
                            <div className="receipt-bottom-tip">
                                💡 Tip: You can print or save this document as a PDF for your annual Income Tax filing.
                                Need assistance? Email <strong>contact@kirancharitabletrust.org</strong> or WhatsApp <strong>+91 77024 68889</strong>.
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}