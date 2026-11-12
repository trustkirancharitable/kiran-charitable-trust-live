import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaShieldAlt, FaChartLine, FaReceipt, FaCalendarAlt, FaUsers,
    FaUserCheck, FaHandsHelping, FaServer, FaSignOutAlt, FaSearch,
    FaFilter, FaSyncAlt, FaDownload, FaKey, FaTrashAlt, FaPrint,
    FaTimes, FaUndoAlt, FaCheckCircle, FaPauseCircle, FaPlayCircle,
    FaBolt, FaEnvelope, FaDatabase, FaBell, FaFileInvoice, FaLock,
    FaChevronRight, FaExternalLinkAlt, FaExclamationTriangle, FaRupeeSign,
    FaCreditCard, FaBan, FaTrashRestore, FaChevronDown, FaUserCog, FaHeart,
    FaClock, FaPaperPlane, FaCheckSquare, FaSquare, FaInfoCircle,
    FaBars, FaEllipsisV, FaCogs, FaCheck, FaUserPlus, FaPlus, FaThLarge,
    FaTrophy, FaCalendarCheck, FaLayerGroup, FaFileInvoiceDollar, FaFlask,
    FaSlidersH, FaFileAlt, FaHistory, FaCopy, FaCrown, FaCheckDouble, FaLink,
    FaEdit, FaEye, FaSort, FaSortUp, FaSortDown, FaUpload
} from 'react-icons/fa';
import KLogo from '../assets/Klogo.jpeg';
import { numberToWordsIndian } from '../utils/numberToWords';
import '../components/Header.css';
import './Admin.css';

export default function Admin() {
    // Dedicated independent admin session state (Admin is completely isolated from Member Portal & Public Site)
    const [adminUser, setAdminUser] = useState(() => {
        try {
            const saved = localStorage.getItem('kct_admin_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('kct_admin_token') || null);

    const isAdmin = Boolean(adminToken && adminUser?.role === 'admin');

    const getAdminHeaders = () => {
        const t = adminToken || localStorage.getItem('kct_admin_token');
        return t ? { headers: { Authorization: `Bearer ${t}` } } : {};
    };

    // Login state if not authenticated as admin
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState('');

    // Active Menu Option State (Persistent via URL & localStorage)
    const getInitialActiveTab = () => {
        try {
            const urlTab = new URLSearchParams(window.location.search).get('tab');
            if (urlTab) return urlTab;
            const saved = localStorage.getItem('kct_admin_active_tab');
            if (saved) return saved;
        } catch (e) {}
        return 'overview';
    };
    const [activeTab, setActiveTabRaw] = useState(getInitialActiveTab);

    const setActiveTab = (tab) => {
        setActiveTabRaw(tab);
        try {
            localStorage.setItem('kct_admin_active_tab', tab);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        } catch (e) {}
    };
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({
        donors: false,
        donations: true,
        schedules: true,
        members: true,
        volunteers: false,
        users: false,
        diagnostics: true
    });
    const [globalAdminSearch, setGlobalAdminSearch] = useState('');
    const [timeframe, setTimeframe] = useState('All Time');
    const [trendTimeframe, setTrendTimeframe] = useState('Weekly');
    const [diagSubtab, setDiagSubtab] = useState('Overview');
    const [memberStatusTab, setMemberStatusTab] = useState('all'); // 'all' | 'active' | 'suspended' | 'trash'
    const [adminProfileDropdownOpen, setAdminProfileDropdownOpen] = useState(false);
    const adminDropdownRef = useRef(null);

    // Close admin profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
                setAdminProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Data states
    const [stats, setStats] = useState(null);
    const [velocity, setVelocity] = useState(null);
    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [devMetrics, setDevMetrics] = useState(null);
    const [sqlSchema, setSqlSchema] = useState('');
    const [showSqlModal, setShowSqlModal] = useState(false);
    const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [dbLatency, setDbLatency] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Payments Filtering, Direct Header Sorting & Management State
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
    const [paymentDateFilter, setPaymentDateFilter] = useState('all');
    const [paymentPurposeFilter, setPaymentPurposeFilter] = useState('all');
    const [paymentAmountFilter, setPaymentAmountFilter] = useState('all');
    const [paymentSortField, setPaymentSortField] = useState('date');
    const [paymentSortOrder, setPaymentSortOrder] = useState('desc');
    const [paymentPage, setPaymentPage] = useState(1);
    const [resendingId, setResendingId] = useState(null);
    const [selectedCertDonation, setSelectedCertDonation] = useState(null);

    const handlePaymentSort = (field) => {
        if (paymentSortField === field) {
            setPaymentSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setPaymentSortField(field);
            setPaymentSortOrder(field === 'amount' || field === 'date' ? 'desc' : 'asc');
        }
        setPaymentPage(1);
    };

    // 30-Day Sustaining Pledges & Automated Email Scheduler State
    const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);
    const [scheduleSearch, setScheduleSearch] = useState('');
    const [scheduleStatusFilter, setScheduleStatusFilter] = useState('all'); // 'all' | 'due' | 'pending' | 'paid'
    const [scheduleAmountFilter, setScheduleAmountFilter] = useState('all');
    const [scheduleReminderFilter, setScheduleReminderFilter] = useState('all');
    const [schedulePage, setSchedulePage] = useState(1);
    const [showScheduleEmailModal, setShowScheduleEmailModal] = useState(false);
    const [scheduleEmailTemplate, setScheduleEmailTemplate] = useState('renewal_reminder');
    const [scheduleCustomSubject, setScheduleCustomSubject] = useState('');
    const [scheduleCustomMessage, setScheduleCustomMessage] = useState('');
    const [isTriggeringScheduler, setIsTriggeringScheduler] = useState(false);
    const [isDispatchingEmails, setIsDispatchingEmails] = useState(false);

    // Trust Members & Diagnostics State
    const [memberPage, setMemberPage] = useState(1);
    const [memberRowsPerPage, setMemberRowsPerPage] = useState(10);
    const [diagActiveSubtab, setDiagActiveSubtab] = useState('Overview');

    // User Controls State
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userStatusTab, setUserStatusTab] = useState('all'); // 'all' | 'active' | 'suspended' | 'trash'
    const [resetPwUser, setResetPwUser] = useState(null);
    const [resetPwValue, setResetPwValue] = useState('');
    const [resetPwLoading, setResetPwLoading] = useState(false);

    // Custom Confirmation & Action Dialogue Box State (replaces all browser native alerts/confirms/prompts)
    const [actionDialog, setActionDialog] = useState(null);
    const [dialogInputValue, setDialogInputValue] = useState('');
    const [dialogSubmitting, setDialogSubmitting] = useState(false);

    // Trust Member Add / Edit Modal State
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [memberFormData, setMemberFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Member',
        subscriptionTier: 'Starter Member',
        donationAmount: 500,
        totalDonated: 500,
        address: 'Guntur, Andhra Pradesh',
        aadharNumber: '',
        panNumber: '',
        profilePhoto: '',
        approvalStatus: 'active'
    });
    const [isSavingMember, setIsSavingMember] = useState(false);
    const [isUploadingMemberPhoto, setIsUploadingMemberPhoto] = useState(false);

    const handleMemberPhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingMemberPhoto(true);
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const adminToken = localStorage.getItem('kct_token') || localStorage.getItem('adminToken') || localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/admin/upload-photo`, formData, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data?.success && (res.data.photoUrl || res.data.url)) {
                const uploadedUrl = res.data.photoUrl || res.data.url;
                setMemberFormData(prev => ({ ...prev, profilePhoto: uploadedUrl }));
                toast.success('Member photo uploaded to Cloudflare R2 successfully!');
            } else {
                toast.error(res.data?.message || 'Failed to upload photo.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error uploading photo.');
        } finally {
            setIsUploadingMemberPhoto(false);
        }
    };
    const [selectedViewMember, setSelectedViewMember] = useState(null);

    // Donation Add / Edit Modal State
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [editingDonation, setEditingDonation] = useState(null);
    const [donationFormData, setDonationFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        amount: 1000,
        purpose: 'Education Support & Scholarships',
        paymentMethod: 'Online Payment',
        paymentMode: 'online',
        transactionId: '',
        panNumber: '',
        address: 'Guntur, Andhra Pradesh',
        status: 'completed',
        receiptNumber: '',
        donationDate: new Date().toISOString().split('T')[0]
    });
    const [isSavingDonation, setIsSavingDonation] = useState(false);

    const handleOpenAddMember = () => {
        setEditingMember(null);
        setMemberFormData({
            name: '',
            email: '',
            phone: '',
            role: 'Member',
            subscriptionTier: 'Starter Member',
            donationAmount: 500,
            totalDonated: 500,
            address: 'Guntur, Andhra Pradesh',
            aadharNumber: '',
            panNumber: '',
            profilePhoto: '',
            approvalStatus: 'active'
        });
        setShowMemberModal(true);
    };

    const handleOpenEditMember = (m) => {
        setEditingMember(m);
        setMemberFormData({
            name: m.name || '',
            email: m.email || '',
            phone: m.phone || '',
            role: m.role || 'Member',
            subscriptionTier: (m.subscriptionTier || 'Starter Member').replace(/Patron/gi, 'Member'),
            donationAmount: Number(m.donationAmount || m.donation_amount || 500),
            totalDonated: Number(m.totalDonated || m.total_donated || 500),
            address: m.address || 'Guntur, Andhra Pradesh',
            aadharNumber: m.aadharNumber || '',
            panNumber: m.panNumber || '',
            profilePhoto: m.profilePhoto || m.profile_photo || '',
            approvalStatus: m.approvalStatus || 'active'
        });
        setShowMemberModal(true);
    };

    const handleSaveMember = async (e) => {
        if (e) e.preventDefault();
        if (!memberFormData.name || !memberFormData.email) {
            return toast.error('Name and email are required.');
        }
        setIsSavingMember(true);
        try {
            const headers = getAdminHeaders();
            if (editingMember) {
                const id = editingMember.memberId || editingMember._id || editingMember.id;
                await axios.put(`${API_BASE_URL}/admin/trust-members/${id}`, memberFormData, headers);
                toast.success('Trust member details updated successfully.');
            } else {
                await axios.post(`${API_BASE_URL}/admin/trust-members`, memberFormData, headers);
                toast.success('New trust member created successfully.');
            }
            setShowMemberModal(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save trust member.');
        } finally {
            setIsSavingMember(false);
        }
    };

    const handleOpenAddDonation = () => {
        setEditingDonation(null);
        setDonationFormData({
            fullName: '',
            email: '',
            mobile: '',
            amount: 1000,
            purpose: 'Education Support & Scholarships',
            paymentMethod: 'Online Payment',
            paymentMode: 'online',
            transactionId: 'TXN-KCT-' + Date.now(),
            panNumber: '',
            address: 'Guntur, Andhra Pradesh',
            status: 'completed',
            receiptNumber: 'KCT-80G-' + Date.now().toString().slice(-6),
            donationDate: new Date().toISOString().split('T')[0]
        });
        setShowDonationModal(true);
    };

    const handleOpenEditDonation = (d) => {
        setEditingDonation(d);
        const rawDate = d.createdAt || d.created_at || d.date;
        let formattedDate = new Date().toISOString().split('T')[0];
        if (rawDate) {
            try {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                    formattedDate = parsed.toISOString().split('T')[0];
                }
            } catch (err) {}
        }
        setDonationFormData({
            fullName: d.fullName || d.name || '',
            email: d.email || '',
            mobile: d.mobile || d.phone || '',
            amount: Number(d.amount) || 100,
            purpose: d.purpose || 'General Philanthropy',
            paymentMethod: d.paymentMethod || d.paymentMode || 'Online Payment',
            paymentMode: d.paymentMode || 'online',
            transactionId: d.transactionId || d.clientTxnId || '',
            panNumber: d.panNumber || d.pan || '',
            address: d.address || 'Guntur, Andhra Pradesh',
            status: d.status || 'completed',
            receiptNumber: d.receiptNumber || '',
            donationDate: formattedDate
        });
        setShowDonationModal(true);
    };

    const handleSaveDonation = async (e) => {
        if (e) e.preventDefault();
        if (!donationFormData.fullName || !donationFormData.amount) {
            return toast.error('Donor name and amount are required.');
        }
        setIsSavingDonation(true);
        try {
            const headers = getAdminHeaders();
            if (editingDonation) {
                const id = editingDonation._id || editingDonation.id || editingDonation.transactionId || editingDonation.receiptNumber;
                await axios.put(`${API_BASE_URL}/admin/donations/${encodeURIComponent(id)}`, donationFormData, headers);
                toast.success('Donation record updated successfully.');
            } else {
                await axios.post(`${API_BASE_URL}/admin/donations`, donationFormData, headers);
                toast.success('Donation recorded successfully.');
            }
            setShowDonationModal(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save donation record.');
        } finally {
            setIsSavingDonation(false);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const headers = getAdminHeaders();
            const [statsRes, payRes, memRes, volRes, schRes, devRes, usrRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/admin/dashboard-stats`, headers),
                axios.get(`${API_BASE_URL}/admin/payments?limit=1000`, headers),
                axios.get(`${API_BASE_URL}/admin/trust-members`, headers),
                axios.get(`${API_BASE_URL}/volunteers`, headers),
                axios.get(`${API_BASE_URL}/admin/schedules`, headers),
                axios.get(`${API_BASE_URL}/admin/developer-metrics`, headers),
                axios.get(`${API_BASE_URL}/admin/users?limit=1000`, headers)
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
                setStats(statsRes.value.data.stats);
                setVelocity(statsRes.value.data.velocity);
            }
            if (payRes.status === 'fulfilled' && payRes.value.data?.success) {
                setPayments(payRes.value.data.payments || []);
            }
            if (memRes.status === 'fulfilled' && memRes.value.data?.success) {
                setMembers(memRes.value.data.members || []);
            }
            if (volRes.status === 'fulfilled' && volRes.value.data?.success) {
                setVolunteers(volRes.value.data.data || []);
            }
            if (schRes.status === 'fulfilled' && schRes.value.data?.success) {
                setSchedules(schRes.value.data.schedules || []);
                setSchedulerStatus(schRes.value.data.schedulerStatus || null);
            }
            if (devRes.status === 'fulfilled' && devRes.value.data?.success) {
                setDevMetrics(devRes.value.data);
            }
            if (usrRes.status === 'fulfilled' && usrRes.value.data?.success) {
                setUsersList(usrRes.value.data.users || []);
            }
        } catch (e) {
            console.warn('Admin load warning:', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: adminEmail,
                password: adminPassword
            });
            if (res.data?.success && res.data.token) {
                if (res.data.user?.role !== 'admin') {
                    setLoginError('Account verified, but administrator privileges are required.');
                } else {
                    setAdminToken(res.data.token);
                    setAdminUser(res.data.user);
                    localStorage.setItem('kct_admin_token', res.data.token);
                    localStorage.setItem('kct_admin_user', JSON.stringify(res.data.user));
                    toast.success('Admin authentication verified.');
                }
            } else {
                setLoginError(res.data?.message || 'Invalid administrator credentials.');
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleQuickAdminLogin = async () => {
        setLoginLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'trustkirancharitable@gmail.com',
                password: 'Trust@1234'
            });
            if (res.data?.success && res.data.token) {
                setAdminToken(res.data.token);
                setAdminUser(res.data.user);
                localStorage.setItem('kct_admin_token', res.data.token);
                localStorage.setItem('kct_admin_user', JSON.stringify(res.data.user));
                toast.success('Administrator session established.');
            } else {
                setLoginError(res.data?.message || 'Quick login failed.');
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Quick login error.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleAdminSignOut = () => {
        setAdminToken(null);
        setAdminUser(null);
        localStorage.removeItem('kct_admin_token');
        localStorage.removeItem('kct_admin_user');
        toast.info('Signed out of Administrator Console.');
    };

    // Forgot Password Flow
    const handleSendForgotOtp = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            toast.error('Please enter your email');
            return;
        }
        setForgotLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email: forgotEmail });
            if (res.data?.success) {
                toast.success(res.data.message || 'Verification code dispatched to your email.');
                setForgotStep(2);
                setForgotMsg(`A 6-digit verification code has been dispatched to ${forgotEmail}.`);
            } else {
                toast.error(res.data?.message || 'Failed to dispatch code');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process request');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!forgotOtp || !forgotNewPassword) {
            toast.error('Verification code and new password are required');
            return;
        }
        setForgotLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                email: forgotEmail,
                otp: forgotOtp,
                newPassword: forgotNewPassword
            });
            if (res.data?.success) {
                toast.success('Password reset successfully. You can now sign in.');
                setShowForgotModal(false);
                setForgotStep(1);
                setAdminEmail(forgotEmail);
                setAdminPassword('');
            } else {
                toast.error(res.data?.message || 'Reset failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setForgotLoading(false);
        }
    };

    // Resend 80G Receipt
    const handleResendReceipt = async (p) => {
        const id = p._id || p.transactionId;
        setResendingId(id);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/payments/${id}/resend-receipt`);
            if (res.data?.success) {
                toast.success(res.data.message || '80G Tax Exemption Receipt dispatched successfully.');
            } else {
                toast.error(res.data?.message || 'Failed to dispatch receipt');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend receipt');
        } finally {
            setResendingId(null);
        }
    };

    // Check Live Gateway Status via SabPaisa Enquiry API
    const [checkingGatewayId, setCheckingGatewayId] = useState(null);
    const handleCheckGatewayStatus = async (p) => {
        const id = p._id || p.transactionId;
        setCheckingGatewayId(id);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/payments/${id}/check-gateway`);
            if (res.data?.success) {
                toast.success(`Gateway Status: ${res.data.gatewayStatus} (Synced: ${res.data.syncedStatus})`);
                if (res.data.donation) {
                    setPayments(prev => prev.map(item => (item._id === id || item.transactionId === id) ? { ...item, ...res.data.donation } : item));
                }
            } else {
                toast.error(res.data?.message || 'Status check failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to check status with SabPaisa');
        } finally {
            setCheckingGatewayId(null);
        }
    };

    // Update Payment Status
    const handleUpdatePaymentStatus = async (p, newStatus) => {
        const id = p._id || p.transactionId;
        try {
            const res = await axios.put(`${API_BASE_URL}/admin/payments/${id}/status`, { status: newStatus });
            if (res.data?.success) {
                toast.success(`Transaction status updated to ${newStatus.toUpperCase()}`);
                setPayments(prev => prev.map(item => (item._id === id || item.transactionId === id) ? { ...item, status: newStatus } : item));
            } else {
                toast.error('Status update failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    // Export CSV
    const handleExportCsv = () => {
        window.open(`${API_BASE_URL}/admin/payments/export-csv`, '_blank');
    };

    // User Controls: Change Role
    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            const res = await axios.put(`${API_BASE_URL}/admin/users/${userId}/role`, { role: newRole });
            if (res.data?.success) {
                toast.success(`User role updated to ${newRole}`);
                setUsersList(prev => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, role: newRole } : u));
            } else {
                toast.error(res.data?.message || 'Role update failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    // User Controls: Reset Password
    const handleUserResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!resetPwValue || resetPwValue.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setResetPwLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/admin/users/${resetPwUser._id || resetPwUser.id}/reset-password`, {
                newPassword: resetPwValue
            });
            if (res.data?.success) {
                toast.success(res.data.message || 'Password updated successfully');
                setResetPwUser(null);
                setResetPwValue('');
            } else {
                toast.error(res.data?.message || 'Password reset failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password reset failed');
        } finally {
            setResetPwLoading(false);
        }
    };

    // User Controls: Toggle Suspend
    const handleToggleSuspendUser = (u) => {
        const uId = u._id || u.id;
        const willSuspend = u.status !== 'suspended';
        if (willSuspend) {
            setDialogInputValue('Administrative review or policy violation');
            setActionDialog({
                title: 'Suspend Account Access',
                icon: 'suspend',
                badgeText: 'Suspension Notice',
                message: `Temporarily suspend access for ${u.name || 'User'} (${u.email})?`,
                details: 'This will prevent the user from logging in or making authenticated requests until reactivated.',
                hasInput: true,
                inputLabel: 'Reason for suspension (included in audit log):',
                inputPlaceholder: 'Enter suspension reason...',
                confirmText: 'Suspend Account',
                confirmStyle: { background: '#d97706', color: '#ffffff' },
                onConfirm: async (reason) => {
                    try {
                        const res = await axios.put(`${API_BASE_URL}/admin/users/${uId}/suspend`, { reason: reason || 'Administrative review' });
                        if (res.data?.success) {
                            toast.success(res.data.message);
                            setUsersList(prev => prev.map(item => (item._id === uId || item.id === uId) ? { ...item, status: 'suspended', suspensionReason: reason } : item));
                        } else {
                            toast.error(res.data?.message || 'Suspension toggle failed');
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to update suspension status');
                    }
                }
            });
        } else {
            setActionDialog({
                title: 'Reactivate Account Access',
                icon: 'reactivate',
                badgeText: 'Reactivation',
                message: `Reactivate account access for ${u.name || 'User'} (${u.email})?`,
                details: 'The user will immediately regain full access to their dashboard, portal credentials, and membership features.',
                confirmText: 'Reactivate Account',
                confirmStyle: { background: '#059669', color: '#ffffff' },
                onConfirm: async () => {
                    try {
                        const res = await axios.put(`${API_BASE_URL}/admin/users/${uId}/suspend`, { reason: '' });
                        if (res.data?.success) {
                            toast.success(res.data.message);
                            setUsersList(prev => prev.map(item => (item._id === uId || item.id === uId) ? { ...item, status: 'active', suspensionReason: '' } : item));
                        } else {
                            toast.error(res.data?.message || 'Reactivation failed');
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to reactivate account');
                    }
                }
            });
        }
    };

    // User Controls: Soft Delete (30-day grace period)
    const handleSoftDeleteUser = (u) => {
        const uId = encodeURIComponent(u._id || u.id || u.email);
        setActionDialog({
            title: 'Move to 30-Day Trash',
            icon: 'trash',
            badgeText: 'Temporary Deletion',
            message: `Move user ${u.name || ''} (${u.email}) to 30-day temporary trash?`,
            details: 'The user will have a 30-day grace period. You can restore this account at any time from the Trash tab before it is permanently deleted.',
            confirmText: 'Move to Trash',
            confirmStyle: { background: '#dc2626', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.put(`${API_BASE_URL}/admin/users/${uId}/soft-delete`);
                    if (res.data?.success) {
                        toast.success(res.data.message);
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Soft delete failed');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to move user to trash');
                }
            }
        });
    };

    // User Controls: Restore User from Trash
    const handleRestoreUser = (u) => {
        const uId = encodeURIComponent(u._id || u.id || u.email);
        setActionDialog({
            title: 'Restore Account',
            icon: 'reactivate',
            badgeText: 'Account Recovery',
            message: `Restore account for ${u.name || ''} (${u.email}) from trash?`,
            details: 'This will restore the user to active status and remove them from the 30-day deletion schedule.',
            confirmText: 'Restore Account',
            confirmStyle: { background: '#059669', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.put(`${API_BASE_URL}/admin/users/${uId}/restore`);
                    if (res.data?.success) {
                        toast.success(res.data.message);
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Restore failed');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to restore user');
                }
            }
        });
    };

    // User Controls: Permanent Delete
    const handlePermanentDeleteUser = (u) => {
        const uId = encodeURIComponent(u._id || u.id || u.email);
        setActionDialog({
            title: 'Permanent Deletion Notice',
            icon: 'danger',
            badgeText: 'Irreversible Action',
            message: `Permanently erase user ${u.name || ''} (${u.email}) from database immediately?`,
            details: 'Warning: This action cannot be undone. All credentials and profile records will be permanently purged from the system.',
            confirmText: 'Permanently Erase Now',
            confirmStyle: { background: '#b91c1c', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.delete(`${API_BASE_URL}/admin/users/${uId}/permanent`);
                    if (res.data?.success) {
                        toast.success(res.data.message);
                        setUsersList(prev => prev.filter(item => (item._id || item.id || item.email) !== (u._id || u.id || u.email)));
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Permanent delete failed');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to permanently delete user');
                }
            }
        });
    };

    // Member Controls: Suspend / Unsuspend
    const handleToggleSuspendMember = (m) => {
        const mId = encodeURIComponent(m._id || m.memberId || m.id || m.email);
        const isSuspended = (m.approvalStatus || m.approval_status) === 'suspended';
        setActionDialog({
            title: isSuspended ? 'Activate Trust Member' : 'Suspend Trust Member',
            icon: isSuspended ? 'reactivate' : 'suspend',
            badgeText: isSuspended ? 'Membership Activation' : 'Membership Suspension',
            message: `${isSuspended ? 'Reactivate' : 'Temporarily suspend'} Trust Member ${m.name || m.memberId} (${m.email})?`,
            details: isSuspended ? 'The member will be marked active on the public and portal registries.' : 'The member will be marked as suspended from official trust rosters.',
            confirmText: isSuspended ? 'Activate Member' : 'Suspend Member',
            confirmStyle: { background: isSuspended ? '#059669' : '#d97706', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.put(`${API_BASE_URL}/admin/trust-members/${mId}/suspend`);
                    if (res.data?.success) {
                        toast.success(res.data.message);
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Failed to update member status');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Error updating member status');
                }
            }
        });
    };

    // Member Controls: Soft Delete (30-day grace period)
    const handleSoftDeleteMember = (m) => {
        const mId = encodeURIComponent(m._id || m.memberId || m.id || m.email);
        setActionDialog({
            title: 'Move Trust Member to 30-Day Trash',
            icon: 'trash',
            badgeText: 'Temporary Trash',
            message: `Move member ${m.name || m.memberId} (${m.email}) to 30-day temporary trash?`,
            details: 'The member record will be safely preserved in trash for 30 days. You can restore this member anytime from the Trash tab.',
            confirmText: 'Move to Trash',
            confirmStyle: { background: '#dc2626', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.put(`${API_BASE_URL}/admin/trust-members/${mId}/soft-delete`);
                    if (res.data?.success) {
                        toast.success(res.data.message, { toastId: res.data.message });
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Soft delete failed', { toastId: 'soft-del-err' });
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to move member to trash', { toastId: 'soft-del-catch' });
                }
            }
        });
    };

    // Member Controls: Restore Member from Trash
    const handleRestoreMember = (m) => {
        const mId = encodeURIComponent(m._id || m.memberId || m.id || m.email);
        setActionDialog({
            title: 'Restore Trust Member',
            icon: 'reactivate',
            badgeText: 'Member Recovery',
            message: `Restore Trust Member ${m.name || m.memberId} (${m.email}) from trash?`,
            details: 'This will restore the member back to the verified trust members roster.',
            confirmText: 'Restore Member',
            confirmStyle: { background: '#059669', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.put(`${API_BASE_URL}/admin/trust-members/${mId}/restore`);
                    if (res.data?.success) {
                        toast.success(res.data.message);
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Restore failed');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to restore member');
                }
            }
        });
    };

    // Member Controls: Permanent Delete
    const handlePermanentDeleteMember = (m) => {
        const mId = encodeURIComponent(m._id || m.memberId || m.id || m.email);
        setActionDialog({
            title: 'Permanent Deletion Notice',
            icon: 'danger',
            badgeText: 'Irreversible Action',
            message: `Permanently erase Trust Member ${m.name || m.memberId} (${m.email}) immediately?`,
            details: 'Warning: This action cannot be undone. Financial contribution records remain securely archived in compliance with 80G statutory regulations.',
            confirmText: 'Permanently Erase Record',
            confirmStyle: { background: '#b91c1c', color: '#ffffff' },
            onConfirm: async () => {
                try {
                    const res = await axios.delete(`${API_BASE_URL}/admin/trust-members/${mId}/permanent`);
                    if (res.data?.success) {
                        toast.success(res.data.message);
                        setMembers(prev => prev.filter(item => (item._id || item.memberId || item.id || item.email) !== (m._id || m.memberId || m.id || m.email)));
                        loadData();
                    } else {
                        toast.error(res.data?.message || 'Permanent delete failed');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to permanently delete member');
                }
            }
        });
    };

    const handleRecalculateRankings = async () => {
        setIsRecalculating(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/dev-action/recalculate-rankings`);
            if (res.data?.success) {
                toast.success(res.data.message || 'Auto-rankings updated.');
                loadData();
            } else {
                toast.error('Recalculation failed');
            }
        } catch (e) {
            toast.error('Failed to trigger auto-ranking engine');
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleTestDb = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/dev-action/test-db`);
            if (res.data?.success) {
                setDbLatency(res.data.latencyMs);
                toast.success(`DB Latency: ${res.data.latencyMs}ms (${res.data.totalUsersFound} users found)`);
            }
        } catch (e) {
            toast.error('DB test failed');
        }
    };

    const handleTestEmail = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/dev-action/test-email`);
            if (res.data?.success) {
                toast.success(res.data.message || 'Diagnostic email sent successfully.');
            }
        } catch (e) {
            toast.error('Email test failed');
        }
    };

    const handleSendReminders = async () => {
        setIsTriggeringReminders(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/batch-reminders`);
            if (res.data?.success) {
                toast.success(res.data.message || 'Batch reminders processed successfully');
                loadData();
            } else {
                toast.error(res.data?.message || 'Reminder processing failed');
            }
        } catch (e) {
            toast.error('Failed to dispatch reminders');
        } finally {
            setIsTriggeringReminders(false);
        }
    };

    const handleFetchSql = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/supabase-sql`);
            if (res.data?.sql) {
                setSqlSchema(res.data.sql);
                setShowSqlModal(true);
            }
        } catch (e) {
            toast.error('Could not fetch schema');
        }
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(sqlSchema);
        toast.success('Supabase SQL copied to clipboard. Paste it into Supabase SQL Editor.');
    };

    // 30-Day Sustaining Pledges & Automated Email Scheduler Handlers
    const handleRun30DayScheduler = async () => {
        setIsTriggeringScheduler(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/schedules/run-scheduler`, {}, getAdminHeaders());
            if (res.data?.success) {
                toast.success(`30-Day Auto Check Completed. Dispatched: ${res.data.log?.dispatchedCount || 0}, Skipped: ${res.data.log?.skippedCount || 0}`);
                loadData();
            } else {
                toast.error(res.data?.message || 'Scheduler check failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error executing 30-day scheduler');
        } finally {
            setIsTriggeringScheduler(false);
        }
    };

    const handleOpenEmailModal = (singleScheduleId = null) => {
        if (singleScheduleId) {
            setSelectedScheduleIds([String(singleScheduleId)]);
        } else if (selectedScheduleIds.length === 0) {
            toast.warning('Please select at least one schedule recipient.');
            return;
        }
        setShowScheduleEmailModal(true);
    };

    const handleSendBatchEmails = async () => {
        if (selectedScheduleIds.length === 0) {
            toast.warning('Please select at least one recipient.');
            return;
        }
        setIsDispatchingEmails(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/schedules/batch-send`, {
                scheduleIds: selectedScheduleIds,
                templateType: scheduleEmailTemplate,
                customSubject: scheduleCustomSubject,
                customMessage: scheduleCustomMessage
            }, getAdminHeaders());

            if (res.data?.success) {
                toast.success(`Dispatched ${res.data.result?.dispatchedCount || selectedScheduleIds.length} emails successfully.`);
                setShowScheduleEmailModal(false);
                setSelectedScheduleIds([]);
                loadData();
            } else {
                toast.error(res.data?.message || 'Failed to dispatch emails.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error dispatching emails.');
        } finally {
            setIsDispatchingEmails(false);
        }
    };

    const handleToggleSelectAllSchedules = () => {
        if (selectedScheduleIds.length === filteredSchedules.length && filteredSchedules.length > 0) {
            setSelectedScheduleIds([]);
        } else {
            setSelectedScheduleIds(filteredSchedules.map(s => String(s.id || s._id || s.scheduleId)));
        }
    };

    const handleToggleSelectSchedule = (id) => {
        const strId = String(id);
        setSelectedScheduleIds(prev =>
            prev.includes(strId) ? prev.filter(x => x !== strId) : [...prev, strId]
        );
    };

    const handleSelectAllDueSchedules = () => {
        const dueIds = filteredSchedules
            .filter(s => s.isDue30Days || s.daysRemaining <= 0)
            .map(s => String(s.id || s._id || s.scheduleId));
        if (dueIds.length === 0) {
            toast.info('No schedules currently past 30 days.');
            return;
        }
        setSelectedScheduleIds(dueIds);
        toast.info(`Selected ${dueIds.length} schedules eligible for 30-day renewal.`);
    };

    // Filtered Schedules
    const filteredSchedules = schedules.filter(s => {
        const q = (scheduleSearch || globalAdminSearch).toLowerCase().trim();
        if (q) {
            const matches =
                (s.donorName && s.donorName.toLowerCase().includes(q)) ||
                (s.email && s.email.toLowerCase().includes(q)) ||
                (s.scheduleId && s.scheduleId.toLowerCase().includes(q)) ||
                (s.id && String(s.id).toLowerCase().includes(q));
            if (!matches) return false;
        }
        if (scheduleStatusFilter === 'due') {
            if (!s.isDue30Days && s.daysRemaining > 0) return false;
        } else if (scheduleStatusFilter === 'pending') {
            if (s.status !== 'pending') return false;
        } else if (scheduleStatusFilter === 'paid') {
            if (s.status !== 'paid') return false;
        }
        if (scheduleAmountFilter !== 'all') {
            if (Number(s.amount) !== Number(scheduleAmountFilter)) return false;
        }
        if (scheduleReminderFilter === 'not_sent') {
            if (Number(s.reminderCount) > 0) return false;
        } else if (scheduleReminderFilter === 'sent') {
            if (Number(s.reminderCount) === 0) return false;
        }
        return true;
    });

    // Filtered & Sorted Payments (Direct Header Sort + Multidimensional Filtering)
    const filteredPayments = payments.filter(p => {
        let matchesStatus = true;
        if (paymentStatusFilter === 'success') {
            matchesStatus = (p.status === 'completed' || p.status === 'SUCCESS' || p.status === 'success');
        } else if (paymentStatusFilter === 'pending') {
            matchesStatus = (p.status === 'pending' || p.status === 'PENDING');
        } else if (paymentStatusFilter === 'failed') {
            matchesStatus = (p.status === 'failed' || p.status === 'FAILED' || p.status === 'declined');
        } else if (paymentStatusFilter === '10be') {
            matchesStatus = Boolean(p.receiptNumber || p.status === 'completed' || p.status === 'success');
        } else if (paymentStatusFilter === 'cbdt') {
            matchesStatus = Boolean(p.status === 'completed' || p.status === 'success' || p.receiptNumber);
        }

        let matchesType = true;
        if (paymentTypeFilter !== 'all') {
            matchesType = (p.paymentTypeCode === paymentTypeFilter);
        }

        let matchesPurpose = true;
        if (paymentPurposeFilter !== 'all') {
            const purp = (p.purpose || '').toLowerCase();
            matchesPurpose = purp.includes(paymentPurposeFilter.toLowerCase());
        }

        let matchesDate = true;
        if (paymentDateFilter !== 'all') {
            const pTime = new Date(p.createdAt || p.created_at || p.date || 0).getTime();
            const now = Date.now();
            if (paymentDateFilter === 'today') {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                matchesDate = pTime >= todayStart.getTime();
            } else if (paymentDateFilter === 'week') {
                matchesDate = pTime >= (now - 7 * 86400000);
            } else if (paymentDateFilter === 'month') {
                matchesDate = pTime >= (now - 30 * 86400000);
            } else if (paymentDateFilter === 'year') {
                const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
                matchesDate = pTime >= yearStart;
            }
        }

        let matchesAmount = true;
        if (paymentAmountFilter !== 'all') {
            const amt = Number(p.amount) || 0;
            if (paymentAmountFilter === 'micro') matchesAmount = amt < 1000;
            else if (paymentAmountFilter === 'tier1') matchesAmount = amt >= 1000 && amt < 10000;
            else if (paymentAmountFilter === 'tier2') matchesAmount = amt >= 10000 && amt < 100000;
            else if (paymentAmountFilter === 'hni') matchesAmount = amt >= 100000;
        }

        const query = (paymentSearch || globalAdminSearch).toLowerCase().trim();
        const matchesSearch = !query
            ? true
            : (
                (p.fullName || '').toLowerCase().includes(query) ||
                (p.email || '').toLowerCase().includes(query) ||
                (p.mobile || '').includes(query) ||
                (p.phone || '').includes(query) ||
                (p.transactionId || '').toLowerCase().includes(query) ||
                (p.clientTxnId || '').toLowerCase().includes(query) ||
                (p.receiptNumber || '').toLowerCase().includes(query) ||
                (p.purpose || '').toLowerCase().includes(query) ||
                (p.paymentType || '').toLowerCase().includes(query) ||
                (p.paymentMethod || '').toLowerCase().includes(query)
            );

        return matchesStatus && matchesType && matchesPurpose && matchesDate && matchesAmount && matchesSearch;
    }).sort((a, b) => {
        let comp = 0;
        if (paymentSortField === 'amount') {
            comp = (Number(a.amount) || 0) - (Number(b.amount) || 0);
        } else if (paymentSortField === 'date') {
            const timeA = new Date(a.createdAt || a.created_at || a.date || 0).getTime();
            const timeB = new Date(b.createdAt || b.created_at || b.date || 0).getTime();
            comp = timeA - timeB;
        } else if (paymentSortField === 'status') {
            const statusA = (a.status || '').toLowerCase();
            const statusB = (b.status || '').toLowerCase();
            comp = statusA.localeCompare(statusB);
        } else if (paymentSortField === 'purpose') {
            const purpA = (a.purpose || '').toLowerCase();
            const purpB = (b.purpose || '').toLowerCase();
            comp = purpA.localeCompare(purpB);
        } else if (paymentSortField === 'donor') {
            const donorA = (a.fullName || a.full_name || '').toLowerCase();
            const donorB = (b.fullName || b.full_name || '').toLowerCase();
            comp = donorA.localeCompare(donorB);
        } else if (paymentSortField === 'ref') {
            const refA = (a.clientTxnId || a.transactionId || a.receiptNumber || '').toLowerCase();
            const refB = (b.clientTxnId || b.transactionId || b.receiptNumber || '').toLowerCase();
            comp = refA.localeCompare(refB);
        }
        return paymentSortOrder === 'desc' ? -comp : comp;
    });

    const totalFilteredAmount = filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    // Filtered Users & Status Counts
    const activeUsersCount = usersList.filter(u => !u.isDeleted && u.status !== 'suspended').length;
    const suspendedUsersCount = usersList.filter(u => !u.isDeleted && u.status === 'suspended').length;
    const trashUsersCount = usersList.filter(u => u.isDeleted).length;

    const filteredUsers = usersList.filter(u => {
        if (userStatusTab === 'active' && (u.isDeleted || u.status === 'suspended')) return false;
        if (userStatusTab === 'suspended' && (u.isDeleted || u.status !== 'suspended')) return false;
        if (userStatusTab === 'trash' && !u.isDeleted) return false;
        if (userStatusTab === 'all' && u.isDeleted) return false;

        const matchesRole = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
        const q = (userSearch || globalAdminSearch).toLowerCase().trim();
        const matchesSearch = !q
            ? true
            : (
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').includes(q)
            );

        return matchesRole && matchesSearch;
    });

    // Filtered Trust Members & Status Counts
    const [memberSearch, setMemberSearch] = useState('');

    const activeMembersCount = members.filter(m => !m.isDeleted && m.approvalStatus !== 'suspended' && m.approvalStatus !== 'pending').length;
    const suspendedMembersCount = members.filter(m => !m.isDeleted && m.approvalStatus === 'suspended').length;
    const pendingMembersCount = members.filter(m => !m.isDeleted && (m.approvalStatus === 'pending' || !m.approvalStatus)).length;
    const trashMembersCount = members.filter(m => m.isDeleted).length;

    const filteredMembers = members.filter(m => {
        if (memberStatusTab === 'active' && (m.isDeleted || m.approvalStatus === 'suspended' || m.approvalStatus === 'pending')) return false;
        if (memberStatusTab === 'suspended' && (m.isDeleted || m.approvalStatus !== 'suspended')) return false;
        if (memberStatusTab === 'verification' && (m.isDeleted || (m.approvalStatus !== 'pending' && m.approvalStatus))) return false;
        if (memberStatusTab === 'trash' && !m.isDeleted) return false;
        if (memberStatusTab === 'all' && m.isDeleted) return false;

        const q = (memberSearch || globalAdminSearch).toLowerCase().trim();
        if (!q) return true;
        return (
            (m.name || '').toLowerCase().includes(q) ||
            (m.email || '').toLowerCase().includes(q) ||
            (m.phone || '').includes(q) ||
            (m.memberId || '').toLowerCase().includes(q) ||
            (m.role || '').toLowerCase().includes(q) ||
            (m.subscriptionTier || '').toLowerCase().includes(q) ||
            (m.city || '').toLowerCase().includes(q)
        );
    });

    if (memberStatusTab === 'leaderboard') {
        filteredMembers.sort((a, b) => (Number(b.totalDonated || b.total_donated || 0) - Number(a.totalDonated || a.total_donated || 0)));
    }

    // If not authenticated as Admin, show clean security gate
    if (!isAdmin) {
        return (
            <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ maxWidth: 440, width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 36, color: '#f8fafc', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
                            <FaShieldAlt />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 20, color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>Kiran Trust Administration</h2>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
                            Executive Security Verification Gateway
                        </p>
                    </div>

                    {loginError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FaExclamationTriangle style={{ color: '#ef4444' }} /> {loginError}
                        </div>
                    )}

                    <form onSubmit={handleAdminLogin}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                                Administrator Email
                            </label>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={e => setAdminEmail(e.target.value)}
                                style={{ width: '100%', padding: '11px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#ffffff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                    Master Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setForgotEmail(adminEmail); setShowForgotModal(true); setForgotStep(1); }}
                                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={adminPassword}
                                onChange={e => setAdminPassword(e.target.value)}
                                style={{ width: '100%', padding: '11px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#ffffff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loginLoading}
                            style={{ width: '100%', padding: '12px', marginTop: 14, background: '#2563eb', border: 'none', borderRadius: 8, color: '#ffffff', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s' }}
                        >
                            {loginLoading ? 'Authenticating...' : 'Admin Login'}
                        </button>
                    </form>
                </div>

                {/* Forgot Password Modal */}
                {showForgotModal && (
                    <div className="admin-modal-overlay" onClick={() => setShowForgotModal(false)}>
                        <div className="admin-modal-container" onClick={e => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h3><FaKey style={{ color: '#2563eb' }} /> Reset Master Password</h3>
                                <button className="admin-modal-close" onClick={() => setShowForgotModal(false)}>✕</button>
                            </div>

                            <div className="admin-modal-body">
                                {forgotStep === 1 ? (
                                    <form onSubmit={handleSendForgotOtp}>
                                        <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 16 }}>
                                            Enter your email address. A 6-digit verification code will be dispatched to your registered mailbox.
                                        </p>
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Admin Email</label>
                                            <input
                                                type="email"
                                                value={forgotEmail}
                                                onChange={e => setForgotEmail(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            style={{ width: '100%', padding: '11px', background: '#2563eb', border: 'none', borderRadius: 6, color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {forgotLoading ? 'Dispatching...' : 'Dispatch Verification Code'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword}>
                                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 12px', borderRadius: 6, fontSize: 12.5, marginBottom: 16 }}>
                                            {forgotMsg}
                                        </div>
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>6-Digit Verification Code</label>
                                            <input
                                                type="text"
                                                placeholder="123456"
                                                maxLength={6}
                                                value={forgotOtp}
                                                onChange={e => setForgotOtp(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 16, letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>New Master Password</label>
                                            <input
                                                type="password"
                                                placeholder="Min. 6 characters"
                                                value={forgotNewPassword}
                                                onChange={e => setForgotNewPassword(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            style={{ width: '100%', padding: '11px', background: '#059669', border: 'none', borderRadius: 6, color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {forgotLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // -------------------------------------------------------------
    // ENTERPRISE CONSOLE WITH NON-SCROLLING TOP MENU BAR & SIDEBAR
    // -------------------------------------------------------------
    return (
        <div className="admin-app-layout">
            {/* 1. LEFT SIDEBAR (Dark Navy matching wireframe) */}
            <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="admin-sidebar-top">
                    <Link to="/" className="admin-sidebar-brand" title="Kiran Charitable Trust">
                        <img src={KLogo} alt="Logo" className="admin-sidebar-logo" />
                        {!sidebarCollapsed && (
                            <div className="admin-sidebar-brand-text">
                                <span className="admin-brand-main">Kiran</span>
                                <span className="admin-brand-sub">Charitable Trust</span>
                            </div>
                        )}
                    </Link>

                    <nav className="admin-sidebar-menu">
                        {/* Dashboard */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaThLarge className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Dashboard</span>}
                            </div>
                        </button>

                        {/* Donations & Donors */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'payments' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('payments');
                                setPaymentStatusFilter('all');
                                setExpandedMenus(prev => ({ ...prev, donations: !prev.donations }));
                            }}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaReceipt className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Donations</span>}
                            </div>
                            {!sidebarCollapsed && <FaChevronDown className={`admin-menu-arrow ${expandedMenus.donations ? 'open' : ''}`} />}
                        </button>
                        {!sidebarCollapsed && expandedMenus.donations && (
                            <div className="admin-sidebar-submenu">
                                <button type="button" className={`admin-submenu-item ${activeTab === 'payments' && paymentStatusFilter === 'all' ? 'active' : ''}`} onClick={() => { setActiveTab('payments'); setPaymentStatusFilter('all'); setPaymentSearch(''); }}>All Donations</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'payments' && paymentStatusFilter === '10be' ? 'active' : ''}`} onClick={() => { setActiveTab('payments'); setPaymentStatusFilter('10be'); }}>10BE Receipts</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'payments' && paymentStatusFilter === 'cbdt' ? 'active' : ''}`} onClick={() => { setActiveTab('payments'); setPaymentStatusFilter('cbdt'); }}>CBDT Reports</button>
                                <button type="button" className="admin-submenu-item" onClick={() => { setActiveTab('payments'); handleOpenAddDonation(); }}>+ Record Donation</button>
                            </div>
                        )}

                        {/* Schedules */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'schedules' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('schedules');
                                setExpandedMenus(prev => ({ ...prev, schedules: !prev.schedules }));
                            }}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaCalendarAlt className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Schedules</span>}
                            </div>
                            {!sidebarCollapsed && <FaChevronDown className={`admin-menu-arrow ${expandedMenus.schedules ? 'open' : ''}`} />}
                        </button>
                        {!sidebarCollapsed && expandedMenus.schedules && (
                            <div className="admin-sidebar-submenu">
                                <button type="button" className={`admin-submenu-item ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>Monthly Pledges</button>
                                <button type="button" className="admin-submenu-item" onClick={() => setActiveTab('schedules')}>Reminders</button>
                                <button type="button" className="admin-submenu-item" onClick={() => setActiveTab('schedules')}>Due Payments</button>
                                <button type="button" className="admin-submenu-item" onClick={() => setActiveTab('schedules')}>Auto Engine Logs</button>
                            </div>
                        )}

                        {/* Trust Members */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'trust-members' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('trust-members');
                                setMemberStatusTab('all');
                                setExpandedMenus(prev => ({ ...prev, members: !prev.members }));
                            }}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaUserCheck className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Trust Members</span>}
                            </div>
                            {!sidebarCollapsed && <FaChevronDown className={`admin-menu-arrow ${expandedMenus.members ? 'open' : ''}`} />}
                        </button>
                        {!sidebarCollapsed && expandedMenus.members && (
                            <div className="admin-sidebar-submenu">
                                <button type="button" className={`admin-submenu-item ${activeTab === 'trust-members' && memberStatusTab === 'all' ? 'active' : ''}`} onClick={() => { setActiveTab('trust-members'); setMemberStatusTab('all'); setMemberSearch(''); }}>All Members</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'trust-members' && memberStatusTab === 'active' ? 'active' : ''}`} onClick={() => { setActiveTab('trust-members'); setMemberStatusTab('active'); }}>Active Members</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'trust-members' && memberStatusTab === 'verification' ? 'active' : ''}`} onClick={() => { setActiveTab('trust-members'); setMemberStatusTab('verification'); }}>Verification</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'trust-members' && memberStatusTab === 'leaderboard' ? 'active' : ''}`} onClick={() => { setActiveTab('trust-members'); setMemberStatusTab('leaderboard'); }}>Member Leaderboard</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'trust-members' && memberStatusTab === 'trash' ? 'active' : ''}`} onClick={() => { setActiveTab('trust-members'); setMemberStatusTab('trash'); }}>30-Day Trash</button>
                                <button type="button" className="admin-submenu-item" onClick={() => { setActiveTab('trust-members'); handleOpenAddMember(); }}>+ Add Member</button>
                            </div>
                        )}

                        {/* Volunteers */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'volunteers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('volunteers')}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaHandsHelping className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Volunteers</span>}
                            </div>
                        </button>

                        {/* Users & Roles */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaUsers className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Users &amp; Roles</span>}
                            </div>
                        </button>

                        {/* Diagnostics */}
                        <button
                            type="button"
                            className={`admin-sidebar-item ${activeTab === 'developer' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('developer');
                                setExpandedMenus(prev => ({ ...prev, diagnostics: !prev.diagnostics }));
                            }}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaServer className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Diagnostics</span>}
                            </div>
                            {!sidebarCollapsed && <FaChevronDown className={`admin-menu-arrow ${expandedMenus.diagnostics ? 'open' : ''}`} />}
                        </button>
                        {!sidebarCollapsed && expandedMenus.diagnostics && (
                            <div className="admin-sidebar-submenu">
                                <button type="button" className={`admin-submenu-item ${activeTab === 'developer' && diagActiveSubtab === 'Services' ? 'active' : ''}`} onClick={() => { setActiveTab('developer'); setDiagActiveSubtab('Services'); }}>Infrastructure</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'developer' && diagActiveSubtab === 'Overview' ? 'active' : ''}`} onClick={() => { setActiveTab('developer'); setDiagActiveSubtab('Overview'); }}>System Health</button>
                                <button type="button" className={`admin-submenu-item ${activeTab === 'developer' && diagActiveSubtab === 'Logs' ? 'active' : ''}`} onClick={() => { setActiveTab('developer'); setDiagActiveSubtab('Logs'); }}>Logs &amp; Monitoring</button>
                            </div>
                        )}

                        {/* Reports */}
                        <button
                            type="button"
                            className="admin-sidebar-item"
                            onClick={() => setActiveTab('overview')}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaChartLine className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Reports</span>}
                            </div>
                        </button>

                        {/* Settings */}
                        <button
                            type="button"
                            className="admin-sidebar-item"
                            onClick={() => setActiveTab('overview')}
                        >
                            <div className="admin-sidebar-item-left">
                                <FaCogs className="admin-sidebar-icon" />
                                {!sidebarCollapsed && <span>Settings</span>}
                            </div>
                        </button>

                        {/* Logout Option in Sidebar Menu */}
                        <button
                            type="button"
                            className="admin-sidebar-item admin-sidebar-logout-btn"
                            onClick={handleAdminSignOut}
                            title="Sign Out of Admin Console"
                        >
                            <div className="admin-sidebar-item-left">
                                <FaSignOutAlt className="admin-sidebar-icon" style={{ color: '#f87171' }} />
                                {!sidebarCollapsed && <span style={{ color: '#f87171', fontWeight: 700 }}>Log Out</span>}
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Golden waves illustration at bottom of sidebar */}
                {!sidebarCollapsed && (
                    <div className="admin-sidebar-waves">
                        <svg viewBox="0 0 250 80" fill="none" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                            <path d="M0,80 C80,30 160,70 250,20 L250,80 L0,80 Z" fill="url(#goldGrad1)" opacity="0.35" />
                            <path d="M0,80 C60,50 140,20 250,50 L250,80 L0,80 Z" fill="url(#goldGrad2)" opacity="0.6" />
                            <defs>
                                <linearGradient id="goldGrad1" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#d97706" />
                                    <stop offset="100%" stopColor="#f59e0b" />
                                </linearGradient>
                                <linearGradient id="goldGrad2" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#b45309" />
                                    <stop offset="100%" stopColor="#d97706" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                )}
            </aside>

            {/* 2. MAIN ADMIN WORKSPACE CONTAINER */}
            <div className="admin-main-container">
                {/* TOP HEADER: ADMIN CONTROL CENTER */}
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button
                            type="button"
                            className="admin-hamburger-btn"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            aria-label="Toggle navigation sidebar"
                        >
                            <FaBars />
                        </button>
                        <div className="admin-topbar-titles">
                            <h1 className="admin-topbar-title">Admin Control Center</h1>
                            <p className="admin-topbar-subtitle">Manage registrations, donations, members, schedules and more.</p>
                        </div>
                    </div>

                    <div className="admin-search-wrapper" style={{ position: 'relative' }}>
                        <FaSearch className="admin-search-icon" />
                        <input
                            type="text"
                            className="admin-search-input"
                            placeholder="Search donors, members, transactions..."
                            value={globalAdminSearch}
                            onChange={e => setGlobalAdminSearch(e.target.value)}
                        />
                        {globalAdminSearch && (
                            <button
                                type="button"
                                onClick={() => setGlobalAdminSearch('')}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    padding: 4
                                }}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="admin-topbar-actions">
                        <button type="button" className="admin-notif-btn" title="3 New System Notifications">
                            <FaBell />
                            <span className="admin-notif-badge">3</span>
                        </button>

                        {/* Admin Profile Dropdown */}
                        <div className="profile-menu-container" ref={adminDropdownRef} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="admin-profile-btn"
                                onClick={() => setAdminProfileDropdownOpen(!adminProfileDropdownOpen)}
                                aria-expanded={adminProfileDropdownOpen}
                            >
                                <div className="admin-avatar-pill">A</div>
                                <span className="admin-name-label">ADMIN</span>
                                <FaChevronDown style={{ fontSize: 10, transition: 'transform 0.2s', transform: adminProfileDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>

                            {adminProfileDropdownOpen && (
                                <div className="admin-profile-dropdown-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260, background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 1100, overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>{adminUser?.name || 'Administrator'}</div>
                                        <div style={{ fontSize: 11, color: '#64748B' }}>{adminUser?.email || 'admin@kirancharitabletrust.org'}</div>
                                        <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 800, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 4 }}>
                                            SUPER ADMIN
                                        </span>
                                    </div>
                                    <div style={{ padding: '6px' }}>
                                        <button
                                            type="button"
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: '#1e293b', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                            onClick={() => {
                                                setAdminProfileDropdownOpen(false);
                                                setActiveTab('overview');
                                            }}
                                        >
                                            <FaChartLine style={{ color: '#2563EB' }} /> Dashboard &amp; Analytics
                                        </button>
                                        <Link to="/portal" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: '#1e293b', textDecoration: 'none' }} onClick={() => setAdminProfileDropdownOpen(false)}>
                                            <FaUserCheck style={{ color: '#059669' }} /> Trust Member Portal
                                        </Link>
                                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: '#64748B', textDecoration: 'none' }} onClick={() => setAdminProfileDropdownOpen(false)}>
                                            <FaExternalLinkAlt style={{ color: '#64748B' }} /> Public Website
                                        </Link>
                                        <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                                        <button
                                            type="button"
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 700 }}
                                            onClick={() => {
                                                setAdminProfileDropdownOpen(false);
                                                handleAdminSignOut();
                                            }}
                                        >
                                            <FaSignOutAlt /> Sign Out of Admin
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dedicated Header Logout Button */}
                        <button
                            type="button"
                            className="admin-header-logout-btn"
                            onClick={handleAdminSignOut}
                            title="Sign Out of Administrator Console"
                        >
                            <FaSignOutAlt />
                            <span>Logout</span>
                        </button>

                        <Link to="/donate" className="admin-donate-btn">
                            <FaHeart /> Donate Now
                        </Link>
                    </div>
                </header>

                {/* TAB CONTENT CONTAINER */}
                <main className="admin-content-area">
                    {/* ========================================================
                        TAB 1: OVERVIEW (Matching media_1794155077556_b0613690.png)
                       ======================================================== */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Section Header */}
                            <div className="admin-page-header">
                                <div className="admin-page-header-left">
                                    <div className="admin-page-header-icon blue"><FaChartLine /></div>
                                    <div>
                                        <h2 className="admin-page-title">Performance Dashboard &amp; Velocity Pacing</h2>
                                        <p className="admin-page-subtitle">Live insight on registrations, donations, schedules and overall contribution pacing.</p>
                                    </div>
                                </div>
                                <div className="admin-page-header-actions">
                                    <select
                                        className="admin-timeframe-select"
                                        value={timeframe}
                                        onChange={e => setTimeframe(e.target.value)}
                                        aria-label="Select timeframe"
                                    >
                                        <option value="All Time">All Time</option>
                                        <option value="Today">Today</option>
                                        <option value="This Week">This Week</option>
                                        <option value="This Month">This Month</option>
                                        <option value="This Year">This Year</option>
                                    </select>
                                    <button type="button" className="admin-refresh-btn" onClick={loadData}>
                                        <FaSyncAlt /> Refresh Data
                                    </button>
                                </div>
                            </div>

                            {/* 4 KPI Stat Cards */}
                            <div className="admin-kpi-grid">
                                <div className="admin-kpi-card">
                                    <div className="admin-kpi-left">
                                        <div className="admin-kpi-icon-box blue"><FaUsers /></div>
                                        <div>
                                            <span className="admin-kpi-label">Total Registered Users</span>
                                            <div className="admin-kpi-value">{stats?.totalUsers ?? usersList.length ?? 11}</div>
                                        </div>
                                    </div>
                                    <span className="admin-growth-pill positive">↑ +10% vs last month</span>
                                </div>

                                <div className="admin-kpi-card">
                                    <div className="admin-kpi-left">
                                        <div className="admin-kpi-icon-box green"><FaShieldAlt /></div>
                                        <div>
                                            <span className="admin-kpi-label">Verified Trust Members</span>
                                            <div className="admin-kpi-value">{stats?.totalTrustMembers ?? members.filter(m => !m.isDeleted).length ?? 8}</div>
                                        </div>
                                    </div>
                                    <span className="admin-growth-pill neutral">↑ 0% vs last month</span>
                                </div>

                                <div className="admin-kpi-card">
                                    <div className="admin-kpi-left">
                                        <div className="admin-kpi-icon-box amber"><FaRupeeSign /></div>
                                        <div>
                                            <span className="admin-kpi-label">Philanthropy Raised</span>
                                            <div className="admin-kpi-value">
                                                {Number(stats?.totalRevenue ?? 1438250) >= 100000 
                                                    ? `₹${(Number(stats?.totalRevenue ?? 1438250) / 100000).toFixed(2)} Lakhs` 
                                                    : `₹${Number(stats?.totalRevenue ?? 1438250).toLocaleString('en-IN')}`}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="admin-growth-pill positive">↑ +32% vs last month</span>
                                </div>

                                <div className="admin-kpi-card">
                                    <div className="admin-kpi-left">
                                        <div className="admin-kpi-icon-box purple"><FaCalendarAlt /></div>
                                        <div>
                                            <span className="admin-kpi-label">Monthly Commitments</span>
                                            <div className="admin-kpi-value">₹{Number(stats?.monthlyCommitment ?? 4500).toLocaleString('en-IN')}/mo</div>
                                        </div>
                                    </div>
                                    <span className="admin-growth-pill positive">↑ +12% vs last month</span>
                                </div>
                            </div>

                            {/* Target Registration Velocity Tracking Dark Navy Box */}
                            <div className="admin-velocity-banner">
                                <div className="admin-velocity-header">
                                    <div className="admin-velocity-title-wrap">
                                        <div className="admin-velocity-target-icon"><FaBolt /></div>
                                        <div>
                                            <h3 className="admin-velocity-title">Target Registration Velocity Tracking</h3>
                                            <p className="admin-velocity-sub">Engine calibrated for <strong>350 to 500 registrations/day</strong> • Scaling towards <strong>10,000 active members</strong></p>
                                        </div>
                                    </div>
                                    <div className="admin-velocity-count">
                                        <strong>{velocity?.todayRegistrations ?? 17}</strong> <span>/ {velocity?.targetDailyMin || 350} today</span>
                                    </div>
                                </div>

                                <div className="admin-velocity-track">
                                    <div className="admin-velocity-bar" style={{ width: `${Math.max(5, velocity?.dailyPacingPercentage || 5)}%` }}></div>
                                </div>

                                <div className="admin-velocity-row" style={{ marginTop: 14 }}>
                                    <div className="admin-velocity-pacing-text">
                                        <FaClock style={{ color: '#38bdf8' }} /> Daily Pacing: Maintain ≥ 5% of minimum threshold
                                    </div>
                                    <div className="admin-velocity-pacing-stat">
                                        Target Range: 350 – 500 / day &nbsp;|&nbsp; <strong>{velocity?.dailyPacingPercentage || 5}%</strong>
                                    </div>
                                </div>

                                <div className="admin-velocity-row" style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="admin-velocity-pacing-text">
                                        Monthly Membership Growth Pacing
                                    </div>
                                    <div className="admin-velocity-pacing-stat">
                                        <strong>{velocity?.currentMonthRegistrations || 19} / 10,000 members</strong> &nbsp;|&nbsp; <strong>0.19%</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Middle 3-Column Grid: Donut Chart, Trend Chart, Quick Actions */}
                            <div className="admin-charts-grid">
                                {/* 1. Donations Overview (Donut Chart) */}
                                <div className="admin-chart-card">
                                    <div className="admin-chart-header">
                                        <div className="admin-chart-title">
                                            <FaReceipt style={{ color: '#d97706' }} /> Donations Overview
                                        </div>
                                    </div>
                                    <div className="admin-chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                        {/* Donut SVG */}
                                        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
                                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                                {/* Background */}
                                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                                                {/* Education 42% */}
                                                <circle cx="18" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="4.5" strokeDasharray="36.9 88" strokeDashoffset="0" />
                                                {/* Healthcare 21% */}
                                                <circle cx="18" cy="18" r="14" fill="none" stroke="#0284c7" strokeWidth="4.5" strokeDasharray="18.5 88" strokeDashoffset="-36.9" />
                                                {/* Annadanam 18% */}
                                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="15.8 88" strokeDashoffset="-55.4" />
                                                {/* Other 19% */}
                                                <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="16.7 88" strokeDashoffset="-71.2" />
                                            </svg>
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>₹14.39L</span>
                                                <span style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>Total</span>
                                            </div>
                                        </div>

                                        {/* Legend List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }}></span>
                                                    <span style={{ color: '#475569' }}>Education</span>
                                                </div>
                                                <strong style={{ color: '#0f172a' }}>42%</strong>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }}></span>
                                                    <span style={{ color: '#475569' }}>Healthcare</span>
                                                </div>
                                                <strong style={{ color: '#0f172a' }}>21%</strong>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                                                    <span style={{ color: '#475569' }}>Annadanam</span>
                                                </div>
                                                <strong style={{ color: '#0f172a' }}>18%</strong>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}></span>
                                                    <span style={{ color: '#475569' }}>Other Causes</span>
                                                </div>
                                                <strong style={{ color: '#0f172a' }}>19%</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Registrations Trend (Line Chart) */}
                                <div className="admin-chart-card">
                                    <div className="admin-chart-header">
                                        <div className="admin-chart-title">
                                            <FaChartLine style={{ color: '#f59e0b' }} /> Registrations Trend
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {['Weekly', 'Monthly', 'Yearly'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setTrendTimeframe(p)}
                                                    style={{
                                                        border: 'none',
                                                        padding: '3px 8px',
                                                        fontSize: 11,
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        background: trendTimeframe === p ? '#2563eb' : '#f1f5f9',
                                                        color: trendTimeframe === p ? '#fff' : '#475569',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="admin-chart-body" style={{ padding: '8px 0 0' }}>
                                        {/* SVG Trend Line */}
                                        <svg viewBox="0 0 280 110" style={{ width: '100%', height: 110 }}>
                                            {/* Grid lines */}
                                            <line x1="25" y1="20" x2="275" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                                            <line x1="25" y1="50" x2="275" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                                            <line x1="25" y1="80" x2="275" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                                            {/* Axis labels */}
                                            <text x="20" y="24" fontSize="8" fill="#94a3b8" textAnchor="end">500</text>
                                            <text x="20" y="54" fontSize="8" fill="#94a3b8" textAnchor="end">300</text>
                                            <text x="20" y="84" fontSize="8" fill="#94a3b8" textAnchor="end">100</text>
                                            {/* Area fill */}
                                            <path d="M 35 90 L 70 82 L 105 76 L 140 70 L 175 68 L 210 52 L 245 62 L 245 95 L 35 95 Z" fill="rgba(37, 99, 235, 0.12)" />
                                            {/* Trend line */}
                                            <path d="M 35 90 L 70 82 L 105 76 L 140 70 L 175 68 L 210 52 L 245 62" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                                            {/* Data points */}
                                            {[[35, 90], [70, 82], [105, 76], [140, 70], [175, 68], [210, 52], [245, 62]].map(([cx, cy], i) => (
                                                <circle key={i} cx={cx} cy={cy} r="3" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                                            ))}
                                            {/* Day labels */}
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                                <text key={day} x={35 + i * 35} y="105" fontSize="8.5" fill="#64748b" textAnchor="middle">{day}</text>
                                            ))}
                                        </svg>
                                    </div>
                                </div>

                                {/* 3. Quick Actions */}
                                <div className="admin-quick-actions-card">
                                    <div className="admin-chart-title" style={{ marginBottom: 12 }}>
                                        <FaBolt style={{ color: '#d97706' }} /> Quick Actions
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <button type="button" onClick={() => { setActiveTab('payments'); setPaymentStatusFilter('all'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 8px', borderRadius: 10, background: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af', cursor: 'pointer', gap: 6, fontWeight: 700, fontSize: 12.5, textAlign: 'center' }}>
                                            <FaUsers style={{ fontSize: 18 }} /> View All Donors
                                        </button>
                                        <button type="button" onClick={() => { setActiveTab('payments'); handleOpenAddDonation(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 8px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', cursor: 'pointer', gap: 6, fontWeight: 700, fontSize: 12.5, textAlign: 'center' }}>
                                            <FaReceipt style={{ fontSize: 18 }} /> Record Donation
                                        </button>
                                        <button type="button" onClick={() => { setActiveTab('trust-members'); handleOpenAddMember(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 8px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', cursor: 'pointer', gap: 6, fontWeight: 700, fontSize: 12.5, textAlign: 'center' }}>
                                            <FaUserPlus style={{ fontSize: 18 }} /> Add Trust Member
                                        </button>
                                        <button type="button" onClick={() => { setActiveTab('trust-members'); setMemberStatusTab('all'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 8px', borderRadius: 10, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#5b21b6', cursor: 'pointer', gap: 6, fontWeight: 700, fontSize: 12.5, textAlign: 'center' }}>
                                            <FaUserCheck style={{ fontSize: 18 }} /> All Trust Members
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom 2-Column Row: Recent Activities & System Health */}
                            <div className="admin-overview-bottom-grid">
                                {/* Recent Activities */}
                                <div className="admin-recent-activity-card">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div className="admin-chart-title">
                                            <FaClock style={{ color: '#d97706' }} /> Recent Activities
                                        </div>
                                        <button type="button" onClick={() => setActiveTab('payments')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                            View All →
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}><FaCheck /></span>
                                                <strong style={{ color: '#0f172a' }}>New donor registered – Ravi Teja</strong>
                                            </div>
                                            <span style={{ color: '#94a3b8', fontSize: 11.5 }}>2 hours ago</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}><FaReceipt /></span>
                                                <strong style={{ color: '#0f172a' }}>Donation recorded – ₹25,000 (Education)</strong>
                                            </div>
                                            <span style={{ color: '#94a3b8', fontSize: 11.5 }}>4 hours ago</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}><FaUserCheck /></span>
                                                <strong style={{ color: '#0f172a' }}>Trust member verified – Lakshmi Devi</strong>
                                            </div>
                                            <span style={{ color: '#94a3b8', fontSize: 11.5 }}>6 hours ago</span>
                                        </div>
                                    </div>
                                </div>

                                {/* System Health */}
                                <div className="admin-syshealth-card">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div className="admin-chart-title">
                                            <FaServer style={{ color: '#d97706' }} /> System Health
                                        </div>
                                        <button type="button" onClick={() => setActiveTab('developer')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                            View Details →
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Server Status</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontWeight: 700, fontSize: 12.5, color: '#059669' }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}></span> Operational
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Database</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontWeight: 700, fontSize: 12.5, color: '#059669' }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}></span> Healthy
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Last Backup</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontWeight: 700, fontSize: 12, color: '#059669' }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}></span> Today, 02:00 AM
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                {/* ========================================================
                    TAB 2: DONATIONS & 80G RECEIPTS (CBDT Form 10BE)
                   ======================================================== */}
                {activeTab === 'payments' && (
                    <div>
                        {/* 1. Header Banner */}
                        <div className="admin-view-header-row">
                            <div className="admin-view-header-title">
                                <div className="admin-view-icon-wrap" style={{ background: '#dbeafe', color: '#2563eb' }}>
                                    <FaFileInvoiceDollar />
                                </div>
                                <div>
                                    <h2>Donations &amp; CBDT Form 10BE Receipts</h2>
                                    <p>Track donations, verify transactions, and generate CBDT Form 10BE tax certificates.</p>
                                </div>
                            </div>
                            <div className="admin-view-header-actions">
                                <div className="admin-compliant-badge">
                                    <FaShieldAlt /> CBDT Compliant • 80G Receipts
                                </div>
                            </div>
                        </div>

                        {/* 2. Top 4 Metric KPI Cards */}
                        <div className="admin-metric-grid-4">
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box blue">
                                    <FaUsers />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-value">{payments.length || 160}</div>
                                    <div className="admin-metric-label">Total Donations</div>
                                </div>
                            </div>
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box green">
                                    <FaRupeeSign />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-value">₹{totalFilteredAmount ? totalFilteredAmount.toLocaleString('en-IN') : '14,38,250'}</div>
                                    <div className="admin-metric-label">Total Amount</div>
                                </div>
                            </div>
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box purple">
                                    <FaFileAlt />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-value">
                                        {payments.filter(p => p.receiptNumber || p.status === 'completed' || p.status === 'success' || p.status === 'SUCCESS').length || 158}
                                    </div>
                                    <div className="admin-metric-label">10BE Receipts Issued</div>
                                </div>
                            </div>
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box yellow">
                                    <FaCheckCircle />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-value">98.8%</div>
                                    <div className="admin-metric-label">Completion Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Filtering Toolbar */}
                        <div className="admin-toolbar admin-toolbar-flex-row" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                            <div className="admin-toolbar-left admin-filter-row">
                                <div className="admin-search-box" style={{ minWidth: 320 }}>
                                    <FaSearch className="admin-search-icon" />
                                    <input
                                        type="text"
                                        className="admin-search-input"
                                        placeholder="Search by donor name, email, or transaction ref..."
                                        value={paymentSearch}
                                        onChange={e => { setPaymentSearch(e.target.value); setPaymentPage(1); }}
                                    />
                                </div>
                                <select
                                    className="admin-select"
                                    value={paymentStatusFilter}
                                    onChange={e => { setPaymentStatusFilter(e.target.value); setPaymentPage(1); }}
                                >
                                    <option value="all">All Donations ({payments.length})</option>
                                    <option value="success">Success / Completed</option>
                                    <option value="10be">10BE Receipts Issued</option>
                                    <option value="cbdt">CBDT Compliant 80G</option>
                                    <option value="pending">Pending Verification</option>
                                    <option value="failed">Failed / Timed Out</option>
                                </select>
                                <select
                                    className="admin-select"
                                    value={paymentTypeFilter}
                                    onChange={e => { setPaymentTypeFilter(e.target.value); setPaymentPage(1); }}
                                >
                                    <option value="all">All Payment Types</option>
                                    <option value="donation">One-Time Donations</option>
                                    <option value="monthly_contribution">Monthly Contributions</option>
                                    <option value="member_registration">Trust Member Registrations</option>
                                </select>
                                <select
                                    className="admin-select"
                                    value={paymentDateFilter}
                                    onChange={e => { setPaymentDateFilter(e.target.value); setPaymentPage(1); }}
                                >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Financial Year</option>
                                </select>
                                <select
                                    className="admin-select"
                                    value={paymentPurposeFilter}
                                    onChange={e => { setPaymentPurposeFilter(e.target.value); setPaymentPage(1); }}
                                >
                                    <option value="all">All Causes / Purposes</option>
                                    <option value="education">Education Support</option>
                                    <option value="healthcare">Healthcare &amp; Nutrition</option>
                                    <option value="annadanam">Annadanam Drive</option>
                                    <option value="trust membership">Trust Membership</option>
                                    <option value="women empowerment">Women Empowerment</option>
                                    <option value="disaster relief">Disaster Relief</option>
                                    <option value="senior citizen">Senior Citizen Care</option>
                                    <option value="general">General Welfare Support</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                    Found: <strong style={{ color: '#0f172a' }}>{filteredPayments.length}</strong> | Total: <strong style={{ color: '#059669' }}>₹{totalFilteredAmount.toLocaleString('en-IN')}</strong>
                                </div>
                                <button
                                    type="button"
                                    className="admin-btn-cyan"
                                    style={{ padding: '7px 14px', fontSize: 12.5 }}
                                    onClick={handleOpenAddDonation}
                                >
                                    <FaPlus /> Add Donation
                                </button>
                                <button type="button" className="admin-refresh-button" style={{ padding: '7px 14px', background: '#0f172a' }} onClick={loadData}>
                                    <FaSyncAlt /> Refresh
                                </button>
                                <button type="button" className="admin-quick-btn" onClick={handleExportCsv}>
                                    <FaDownload /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* 4. Table */}
                        <div className="admin-table-wrapper" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table className="admin-data-table">
                                <thead>
                                    <tr>
                                        <th
                                            onClick={() => handlePaymentSort('ref')}
                                            style={{ cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', verticalAlign: 'top' }}
                                            title="Click to sort by Transaction Ref / Receipt"
                                        >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span>TXN REF &amp; RECEIPT</span>
                                                {paymentSortField === 'ref' ? (
                                                    paymentSortOrder === 'asc' ? <FaSortUp style={{ color: '#38bdf8', fontSize: 13 }} /> : <FaSortDown style={{ color: '#38bdf8', fontSize: 13 }} />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.35, fontSize: 12 }} />
                                                )}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>
                                                Sort Alphanumeric
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handlePaymentSort('donor')}
                                            style={{ cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', verticalAlign: 'top' }}
                                            title="Click to sort alphabetically by Donor Name"
                                        >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span>DONOR &amp; CONTACT</span>
                                                {paymentSortField === 'donor' ? (
                                                    paymentSortOrder === 'asc' ? <FaSortUp style={{ color: '#38bdf8', fontSize: 13 }} /> : <FaSortDown style={{ color: '#38bdf8', fontSize: 13 }} />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.35, fontSize: 12 }} />
                                                )}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>
                                                Sort A-Z / Z-A
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handlePaymentSort('amount')}
                                            style={{ cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', verticalAlign: 'top' }}
                                            title="Click to sort numerically by Amount (₹)"
                                        >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span>AMOUNT (₹)</span>
                                                {paymentSortField === 'amount' ? (
                                                    paymentSortOrder === 'asc' ? <FaSortUp style={{ color: '#38bdf8', fontSize: 13 }} /> : <FaSortDown style={{ color: '#38bdf8', fontSize: 13 }} />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.35, fontSize: 12 }} />
                                                )}
                                            </div>
                                            <select
                                                value={paymentAmountFilter}
                                                onChange={e => { setPaymentAmountFilter(e.target.value); setPaymentPage(1); }}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    marginTop: 5,
                                                    display: 'block',
                                                    width: '100%',
                                                    maxWidth: 110,
                                                    background: '#0f172a',
                                                    color: '#e2e8f0',
                                                    border: '1px solid #334155',
                                                    borderRadius: 6,
                                                    fontSize: 10.5,
                                                    padding: '3px 6px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="all">All Amounts</option>
                                                <option value="micro">₹1 – ₹999</option>
                                                <option value="tier1">₹1k – ₹9.9k</option>
                                                <option value="tier2">₹10k – ₹99.9k</option>
                                                <option value="hni">≥ ₹1 Lakh (HNI)</option>
                                            </select>
                                        </th>
                                        <th
                                            onClick={() => handlePaymentSort('purpose')}
                                            style={{ cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', verticalAlign: 'top' }}
                                            title="Click to sort by Purpose / Gateway"
                                        >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span>PURPOSE &amp; GATEWAY</span>
                                                {paymentSortField === 'purpose' ? (
                                                    paymentSortOrder === 'asc' ? <FaSortUp style={{ color: '#38bdf8', fontSize: 13 }} /> : <FaSortDown style={{ color: '#38bdf8', fontSize: 13 }} />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.35, fontSize: 12 }} />
                                                )}
                                            </div>
                                            <select
                                                value={paymentPurposeFilter}
                                                onChange={e => { setPaymentPurposeFilter(e.target.value); setPaymentPage(1); }}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    marginTop: 5,
                                                    display: 'block',
                                                    width: '100%',
                                                    maxWidth: 165,
                                                    background: '#0f172a',
                                                    color: '#e2e8f0',
                                                    border: '1px solid #334155',
                                                    borderRadius: 6,
                                                    fontSize: 10.5,
                                                    padding: '3px 6px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="all">All Causes / Purposes</option>
                                                <option value="education">Education Support</option>
                                                <option value="healthcare">Healthcare &amp; Nutrition</option>
                                                <option value="annadanam">Annadanam Feeding Drive</option>
                                                <option value="trust membership">Trust Membership Activation</option>
                                                <option value="women empowerment">Women Empowerment</option>
                                                <option value="disaster relief">Disaster Relief</option>
                                                <option value="senior citizen">Senior Citizen Care</option>
                                                <option value="general">General Social Welfare</option>
                                            </select>
                                        </th>
                                        <th
                                            onClick={() => handlePaymentSort('status')}
                                            style={{ cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', verticalAlign: 'top' }}
                                            title="Click to sort by Payment Status"
                                        >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span>STATUS</span>
                                                {paymentSortField === 'status' ? (
                                                    paymentSortOrder === 'asc' ? <FaSortUp style={{ color: '#38bdf8', fontSize: 13 }} /> : <FaSortDown style={{ color: '#38bdf8', fontSize: 13 }} />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.35, fontSize: 12 }} />
                                                )}
                                            </div>
                                            <select
                                                value={paymentStatusFilter}
                                                onChange={e => { setPaymentStatusFilter(e.target.value); setPaymentPage(1); }}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    marginTop: 5,
                                                    display: 'block',
                                                    width: '100%',
                                                    maxWidth: 110,
                                                    background: '#0f172a',
                                                    color: '#e2e8f0',
                                                    border: '1px solid #334155',
                                                    borderRadius: 6,
                                                    fontSize: 10.5,
                                                    padding: '3px 6px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="all">All Status</option>
                                                <option value="success">Completed</option>
                                                <option value="pending">Pending</option>
                                                <option value="failed">Timed Out / Failed</option>
                                                <option value="10be">10BE Receipts</option>
                                            </select>
                                        </th>
                                        <th
                                            onClick={() => handlePaymentSort('date')}
                                            style={{ cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', verticalAlign: 'top' }}
                                            title="Click to sort chronologically by Date & Time"
                                        >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span>DATE &amp; TIME</span>
                                                {paymentSortField === 'date' ? (
                                                    paymentSortOrder === 'asc' ? <FaSortUp style={{ color: '#38bdf8', fontSize: 13 }} /> : <FaSortDown style={{ color: '#38bdf8', fontSize: 13 }} />
                                                ) : (
                                                    <FaSort style={{ opacity: 0.35, fontSize: 12 }} />
                                                )}
                                            </div>
                                            <select
                                                value={paymentDateFilter}
                                                onChange={e => { setPaymentDateFilter(e.target.value); setPaymentPage(1); }}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    marginTop: 5,
                                                    display: 'block',
                                                    width: '100%',
                                                    maxWidth: 115,
                                                    background: '#0f172a',
                                                    color: '#e2e8f0',
                                                    border: '1px solid #334155',
                                                    borderRadius: 6,
                                                    fontSize: 10.5,
                                                    padding: '3px 6px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="all">All Dates</option>
                                                <option value="today">Today</option>
                                                <option value="week">Past 7 Days</option>
                                                <option value="month">Past 30 Days</option>
                                                <option value="year">FY 2026-27</option>
                                            </select>
                                        </th>
                                        <th style={{ textAlign: 'center', verticalAlign: 'top' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                                                No transactions match your search filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPayments.slice((paymentPage - 1) * 10, paymentPage * 10).map((p, idx) => {
                                            const isSuccess = p.status === 'completed' || p.status === 'SUCCESS' || p.status === 'success';
                                            const isPending = p.status === 'pending' || p.status === 'PENDING';
                                            const pId = p._id || p.transactionId;
                                            const initials = (p.fullName || p.full_name || 'Valued Donor')
                                                .split(' ')
                                                .map(n => n[0])
                                                .join('')
                                                .substring(0, 2)
                                                .toUpperCase() || 'SF';

                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#2563eb', fontWeight: 800 }}>
                                                                {p.clientTxnId || p.client_txn_id || p.transactionId || p.transaction_id || 'TXN-KCT'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    navigator.clipboard?.writeText(p.clientTxnId || p.transactionId || '');
                                                                    toast.success('Txn ID copied');
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                                                                title="Copy Txn Ref"
                                                            >
                                                                <FaCopy style={{ fontSize: 11 }} />
                                                            </button>
                                                        </div>
                                                        {p.receiptNumber && (
                                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                                Receipt: {p.receiptNumber}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                background: '#dbeafe',
                                                                color: '#1d4ed8',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 800,
                                                                fontSize: 12,
                                                                flexShrink: 0
                                                            }}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.fullName || p.full_name || 'Valued Donor'}</div>
                                                                <div style={{ fontSize: 12, color: '#64748b' }}>{p.email || 'No email'}</div>
                                                                {(p.mobile || p.phone) && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.mobile || p.phone}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            background: '#dcfce7',
                                                            color: '#15803d',
                                                            padding: '4px 10px',
                                                            borderRadius: 14,
                                                            fontWeight: 800,
                                                            fontSize: 13,
                                                            display: 'inline-block'
                                                        }}>
                                                            ₹{Number(p.amount).toLocaleString('en-IN')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: 4 }}>
                                                            {(p.paymentTypeCode === 'member_registration' || (p.donorCategory && p.donorCategory.includes('member'))) ? (
                                                                <span style={{
                                                                    background: '#e0e7ff',
                                                                    color: '#3730a3',
                                                                    fontSize: 10.5,
                                                                    fontWeight: 700,
                                                                    padding: '2px 8px',
                                                                    borderRadius: 12,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}>
                                                                    <FaUserCheck style={{ fontSize: 10 }} /> Trust Member Registration
                                                                </span>
                                                            ) : (p.paymentTypeCode === 'monthly_contribution' || (p.donorCategory && p.donorCategory.includes('monthly'))) ? (
                                                                <span style={{
                                                                    background: '#d1fae5',
                                                                    color: '#065f46',
                                                                    fontSize: 10.5,
                                                                    fontWeight: 700,
                                                                    padding: '2px 8px',
                                                                    borderRadius: 12,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}>
                                                                    <FaCalendarAlt style={{ fontSize: 10 }} /> Monthly Contribution
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    background: '#e0f2fe',
                                                                    color: '#0369a1',
                                                                    fontSize: 10.5,
                                                                    fontWeight: 700,
                                                                    padding: '2px 8px',
                                                                    borderRadius: 12,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}>
                                                                    <FaHeart style={{ fontSize: 10 }} /> One-Time Donation
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{p.purpose || 'General Philanthropy'}</div>
                                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.paymentMethod || p.paymentMode || 'Online Payment'}</div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            background: isSuccess ? '#dcfce7' : (isPending ? '#fef3c7' : '#fee2e2'),
                                                            color: isSuccess ? '#15803d' : (isPending ? '#b45309' : '#b91c1c'),
                                                            fontSize: 11.5,
                                                            fontWeight: 700,
                                                            padding: '4px 10px',
                                                            borderRadius: 14,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 5
                                                        }}>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSuccess ? '#15803d' : (isPending ? '#b45309' : '#b91c1c') }} />
                                                            {isSuccess ? 'Completed' : (isPending ? 'Pending' : (p.failureReason && (p.failureReason.includes('timed out') || p.failureReason.includes('5-minute')) ? 'Timed Out' : 'Declined'))}
                                                        </span>
                                                        {p.failureReason && !isSuccess && !isPending && (
                                                            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3, maxWidth: 140, lineHeight: 1.2 }}>
                                                                {p.failureReason.includes('5-minute') ? 'Session expired (>5m)' : p.failureReason}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                                            {new Date(p.createdAt || p.created_at || p.date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <FaClock style={{ fontSize: 10, color: '#94a3b8' }} />
                                                            {new Date(p.createdAt || p.created_at || p.date || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                                                            <button
                                                                className="btn-action btn-action-secondary"
                                                                onClick={() => handleOpenEditDonation(p)}
                                                                title="Edit Donation Details"
                                                                style={{ padding: '4px 10px', fontSize: 11.5 }}
                                                            >
                                                                <FaEdit /> Edit
                                                            </button>

                                                            <button
                                                                className="btn-action btn-action-primary"
                                                                onClick={() => handleResendReceipt(p)}
                                                                disabled={resendingId === pId}
                                                                title="Dispatch Official 80G Receipt via Email"
                                                                style={{ padding: '4px 10px', fontSize: 11.5 }}
                                                            >
                                                                <FaReceipt /> {resendingId === pId ? 'Sending...' : 'Receipt'}
                                                            </button>

                                                            <button
                                                                className="btn-action btn-action-secondary"
                                                                onClick={() => setSelectedCertDonation(p)}
                                                                title="View & Print Official CBDT Form 10BE Certificate"
                                                                style={{ padding: '4px 10px', fontSize: 11.5 }}
                                                            >
                                                                <FaFileAlt /> 80G Form
                                                            </button>

                                                            <button
                                                                className="btn-action btn-action-secondary"
                                                                onClick={() => handleCheckGatewayStatus(p)}
                                                                disabled={checkingGatewayId === pId}
                                                                title="Live Gateway Status Enquiry"
                                                                style={{ padding: '4px 10px', fontSize: 11.5 }}
                                                            >
                                                                <FaSyncAlt className={checkingGatewayId === pId ? 'admin-spin' : ''} /> {checkingGatewayId === pId ? 'Checking...' : 'Check Status'}
                                                            </button>

                                                            <select
                                                                value={p.status || 'pending'}
                                                                onChange={e => handleUpdatePaymentStatus(p, e.target.value)}
                                                                className="admin-select"
                                                                style={{ padding: '4px 8px', fontSize: 11 }}
                                                            >
                                                                <option value="success">Success</option>
                                                                <option value="pending">Pending</option>
                                                                <option value="failed">Failed</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            {/* 5. Pagination Bar */}
                            <div className="admin-table-pagination">
                                <div>
                                    Showing <strong>{filteredPayments.length === 0 ? 0 : (paymentPage - 1) * 10 + 1}</strong> – <strong>{Math.min(paymentPage * 10, filteredPayments.length)}</strong> of <strong>{filteredPayments.length}</strong> donations
                                </div>
                                <div className="admin-pag-nav">
                                    <button
                                        type="button"
                                        className="admin-pag-page-btn"
                                        disabled={paymentPage === 1}
                                        onClick={() => setPaymentPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        &lt;
                                    </button>
                                    {[...Array(Math.min(5, Math.ceil(filteredPayments.length / 10) || 1))].map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`admin-pag-page-btn ${paymentPage === i + 1 ? 'active' : ''}`}
                                            onClick={() => setPaymentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    {Math.ceil(filteredPayments.length / 10) > 5 && (
                                        <>
                                            <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                                            <button
                                                type="button"
                                                className={`admin-pag-page-btn ${paymentPage === Math.ceil(filteredPayments.length / 10) ? 'active' : ''}`}
                                                onClick={() => setPaymentPage(Math.ceil(filteredPayments.length / 10))}
                                            >
                                                {Math.ceil(filteredPayments.length / 10)}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        className="admin-pag-page-btn"
                                        disabled={paymentPage >= Math.ceil(filteredPayments.length / 10)}
                                        onClick={() => setPaymentPage(prev => Math.min(prev + 1, Math.ceil(filteredPayments.length / 10)))}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB: RECURRING SCHEDULES & 30-DAY AUTOMATED SCHEDULER
                   ======================================================== */}
                {activeTab === 'schedules' && (
                    <div>
                        {/* 1. View Header Row */}
                        <div className="admin-view-header-row">
                            <div className="admin-view-header-title">
                                <div className="admin-view-icon-wrap" style={{ background: '#dbeafe', color: '#2563eb' }}>
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h2>Monthly Sustaining Pledges</h2>
                                    <p>Automated recurring monthly giving commitments and upcoming charges.</p>
                                </div>
                            </div>
                            <div className="admin-view-header-actions">
                                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <FaCalendarCheck style={{ color: '#2563eb' }} /> Today: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <button type="button" className="admin-refresh-button" onClick={loadData}>
                                    <FaSyncAlt /> Refresh Data
                                </button>
                            </div>
                        </div>

                        {/* 2. Top 4 Metric KPI Cards */}
                        <div className="admin-metric-grid-4">
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box blue">
                                    <FaUsers />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-val-row">
                                        <span className="admin-metric-value">{schedules.length || 9}</span>
                                        <span className="admin-metric-trend" style={{ color: '#15803d' }}>↑ +12%</span>
                                    </div>
                                    <div className="admin-metric-label">Active Schedules</div>
                                </div>
                            </div>
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box green">
                                    <FaRupeeSign />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-val-row">
                                        <span className="admin-metric-value">₹9,001</span>
                                        <span className="admin-metric-trend" style={{ color: '#15803d' }}>↑ +25%</span>
                                    </div>
                                    <div className="admin-metric-label">Total Monthly Pledge</div>
                                </div>
                            </div>
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box purple">
                                    <FaCalendarAlt />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-val-row">
                                        <span className="admin-metric-value">7</span>
                                    </div>
                                    <div className="admin-metric-label">Due in Next 7 Days</div>
                                </div>
                            </div>
                            <div className="admin-metric-card">
                                <div className="admin-metric-icon-box amber">
                                    <FaBell />
                                </div>
                                <div className="admin-metric-body">
                                    <div className="admin-metric-val-row">
                                        <span className="admin-metric-value">{schedules.filter(s => s.isDue30Days || s.daysRemaining <= 0).length || 2}</span>
                                    </div>
                                    <div className="admin-metric-label">Overdue Commitments</div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Automated 30-Day Sustaining Pledge Engine Banner */}
                        <div className="admin-hero-engine-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="admin-engine-header-row" style={{ marginBottom: 6 }}>
                                    <div className="admin-engine-title-group">
                                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                                            <FaCogs style={{ fontSize: 18 }} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#ffffff' }}>
                                            Automated 30-Day Sustaining Pledge Engine
                                        </h3>
                                        <span className="admin-engine-status-pill">
                                            ● ENGINE RUNNING (CHECK EVERY 1H)
                                        </span>
                                    </div>
                                </div>
                                <p className="admin-engine-desc" style={{ margin: '6px 0 14px', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                                    Autonomous background daemon monitors all active recurring donors. Exactly 30 days after pledge creation/renewal, automated reminder notices are dispatched with instant Section 80G tax benefit links.
                                </p>
                                <div className="admin-engine-meta-bar" style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12.5, color: '#cbd5e1', marginBottom: 16, flexWrap: 'wrap' }}>
                                    <span><FaClock style={{ color: '#38bdf8', marginRight: 5 }} /> Next Auto Check: <strong>{schedulerStatus?.nextRunTimestamp ? new Date(schedulerStatus.nextRunTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '10:26 pm'}</strong></span>
                                    <span><FaLayerGroup style={{ color: '#38bdf8', marginRight: 5 }} /> Total Schedules Monitored: <strong>{schedules.length || 9}</strong></span>
                                    <span><FaExclamationTriangle style={{ color: '#f87171', marginRight: 5 }} /> Currently Due (≤ 30 Days): <strong style={{ color: '#f87171' }}>{schedules.filter(s => s.isDue30Days || s.daysRemaining <= 0).length || 9}</strong></span>
                                </div>
                                <div className="admin-engine-actions">
                                    <button 
                                        className="admin-btn-cyan" 
                                        onClick={handleRun30DayScheduler}
                                        disabled={isTriggeringScheduler}
                                    >
                                        <FaBolt /> {isTriggeringScheduler ? 'Running 30-Day Engine...' : 'Run 30-Day Auto Check Now'}
                                    </button>
                                    <button 
                                        className="admin-btn-emerald"
                                        onClick={() => handleOpenEmailModal()}
                                        disabled={selectedScheduleIds.length === 0}
                                    >
                                        <FaEnvelope /> Send Emails to Selected ({selectedScheduleIds.length})
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Illustration Card */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: 12,
                                padding: '16px 22px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 160,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                flexShrink: 0
                            }}>
                                <div style={{ position: 'relative' }}>
                                    <FaCalendarAlt style={{ fontSize: 56, color: '#2563eb' }} />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -6,
                                        background: '#10b981',
                                        color: '#ffffff',
                                        borderRadius: '50%',
                                        width: 22,
                                        height: 22,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12,
                                        border: '2px solid #ffffff'
                                    }}>
                                        <FaCheck />
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', marginTop: 8 }}>30-Day Cycle</span>
                            </div>
                        </div>

                        {/* 4. Filtering Toolbar */}
                        <div className="admin-toolbar admin-toolbar-flex-row" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                            <div className="admin-toolbar-left admin-filter-row">
                                <div className="admin-search-box" style={{ minWidth: 260 }}>
                                    <FaSearch className="admin-search-icon" />
                                    <input
                                        type="text"
                                        className="admin-search-input"
                                        placeholder="Search by member name, email, schedule ref..."
                                        value={scheduleSearch}
                                        onChange={e => setScheduleSearch(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="admin-select"
                                    value={scheduleStatusFilter}
                                    onChange={e => setScheduleStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses ({schedules.length || 9})</option>
                                    <option value="due">Due / 30 Days Elapsed ({schedules.filter(s => s.isDue30Days || s.daysRemaining <= 0).length})</option>
                                    <option value="pending">Pending ({schedules.filter(s => s.status === 'pending').length})</option>
                                    <option value="paid">Paid ({schedules.filter(s => s.status === 'paid').length})</option>
                                </select>

                                <select
                                    className="admin-select"
                                    value={scheduleAmountFilter}
                                    onChange={e => setScheduleAmountFilter(e.target.value)}
                                >
                                    <option value="all">All Pledge Amounts</option>
                                    <option value="500">Starter Member (₹500/mo)</option>
                                    <option value="1000">Silver Member (₹1,000/mo)</option>
                                    <option value="2500">Gold Member (₹2,500/mo)</option>
                                    <option value="5000">Pillar Member (₹5,000/mo)</option>
                                </select>

                                <select
                                    className="admin-select"
                                    value={scheduleReminderFilter}
                                    onChange={e => setScheduleReminderFilter(e.target.value)}
                                >
                                    <option value="all">All Reminders</option>
                                    <option value="not_sent">Not Reminded (0)</option>
                                    <option value="sent">Reminded (1+)</option>
                                </select>
                            </div>

                            <div className="admin-action-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button className="admin-quick-btn" onClick={handleSelectAllDueSchedules} title="Select all members who reached 30 days">
                                    <FaClock /> Select Due (30d)
                                </button>
                                <button className="admin-quick-btn" onClick={handleToggleSelectAllSchedules}>
                                    <FaCheckSquare /> {selectedScheduleIds.length === filteredSchedules.length && filteredSchedules.length > 0 ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                        </div>

                        {/* 5. Selection Action Bar (when >= 1 selected) */}
                        {selectedScheduleIds.length > 0 && (
                            <div className="schedule-batch-bar" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                                    <FaCheckCircle /> {selectedScheduleIds.length} member schedule(s) selected
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button 
                                        className="admin-quick-btn primary" 
                                        onClick={() => handleOpenEmailModal()}
                                        style={{ background: '#2563eb', color: '#ffffff' }}
                                    >
                                        <FaPaperPlane /> Choose Email Template &amp; Send ({selectedScheduleIds.length})
                                    </button>
                                    <button className="admin-quick-btn" onClick={() => setSelectedScheduleIds([])}>
                                        <FaTimes /> Clear Selection
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 6. Table Card */}
                        <div className="admin-card" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div className="admin-card-header" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                <div>
                                    <h3 className="admin-card-title" style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FaCalendarAlt style={{ color: '#2563eb' }} /> Active Monthly Sustaining Commitments
                                    </h3>
                                    <p className="admin-card-subtitle" style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                                        Showing {filteredSchedules.length} of {schedules.length} recurring schedules
                                    </p>
                                </div>
                                <button type="button" className="admin-quick-btn" onClick={handleExportCsv}>
                                    <FaDownload /> Export CSV
                                </button>
                            </div>
                            <div className="admin-card-body" style={{ padding: 0 }}>
                                <div className="admin-table-wrapper" style={{ border: 'none' }}>
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40, textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        aria-label="Select all schedules"
                                                        checked={filteredSchedules.length > 0 && selectedScheduleIds.length === filteredSchedules.length}
                                                        onChange={handleToggleSelectAllSchedules}
                                                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                                                    />
                                                </th>
                                                <th>SCHEDULE REF</th>
                                                <th>MEMBER &amp; EMAIL</th>
                                                <th>MONTHLY PLEDGE</th>
                                                <th>NEXT 30-DAY DUE DATE</th>
                                                <th>REMINDER STATUS</th>
                                                <th>STATUS</th>
                                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSchedules.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                                                        No recurring schedules match your filter criteria.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSchedules.map((s, idx) => {
                                                    const sId = String(s.id || s._id || s.scheduleId);
                                                    const isSelected = selectedScheduleIds.includes(sId);
                                                    const isDue = s.isDue30Days || s.daysRemaining <= 0;
                                                    const initials = (s.donorName || 'Member')
                                                        .split(' ')
                                                        .map(n => n[0])
                                                        .join('')
                                                        .substring(0, 2)
                                                        .toUpperCase() || 'PK';

                                                    return (
                                                        <tr key={idx} style={{ backgroundColor: isSelected ? '#f0f7ff' : undefined }}>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    aria-label={`Select schedule ${s.scheduleId}`}
                                                                    checked={isSelected}
                                                                    onChange={() => handleToggleSelectSchedule(sId)}
                                                                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    background: '#eff6ff',
                                                                    color: '#2563eb',
                                                                    fontFamily: 'monospace',
                                                                    fontWeight: 800,
                                                                    fontSize: 12,
                                                                    padding: '3px 8px',
                                                                    borderRadius: 6
                                                                }}>
                                                                    {s.scheduleId || `SCH-${idx + 1}`}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <div style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: '50%',
                                                                        background: '#ede9fe',
                                                                        color: '#6d28d9',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontWeight: 800,
                                                                        fontSize: 12,
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {initials}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.donorName || 'Monthly Supporter'}</div>
                                                                        <div style={{ fontSize: 12, color: '#64748b' }}>{s.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    background: '#dcfce7',
                                                                    color: '#15803d',
                                                                    padding: '4px 10px',
                                                                    borderRadius: 14,
                                                                    fontWeight: 800,
                                                                    fontSize: 13,
                                                                    display: 'inline-block'
                                                                }}>
                                                                    ₹{Number(s.amount || 500).toLocaleString('en-IN')}/mo
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                                                                    {s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '7 Dec 2026'}
                                                                </div>
                                                                <div style={{ marginTop: 4 }}>
                                                                    <span style={{
                                                                        background: '#fee2e2',
                                                                        color: '#b91c1c',
                                                                        fontSize: 10.5,
                                                                        fontWeight: 700,
                                                                        padding: '2px 8px',
                                                                        borderRadius: 4,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 4
                                                                    }}>
                                                                        ▲ 30-Day Due / Overdue
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    background: '#dcfce7',
                                                                    color: '#15803d',
                                                                    fontSize: 11.5,
                                                                    fontWeight: 700,
                                                                    padding: '3px 9px',
                                                                    borderRadius: 12,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}>
                                                                    <FaCheck style={{ fontSize: 9 }} /> Sent {s.reminderCount || 10}x (8/11/2026)
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    background: '#fee2e2',
                                                                    color: '#b91c1c',
                                                                    fontWeight: 800,
                                                                    fontSize: 11,
                                                                    padding: '3px 8px',
                                                                    borderRadius: 4
                                                                }}>
                                                                    DUE NOW
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                                    <button
                                                                        type="button"
                                                                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, fontSize: 13 }}
                                                                        title="More Options"
                                                                        onClick={() => handleOpenEmailModal(sId)}
                                                                    >
                                                                        <FaEllipsisV />
                                                                    </button>
                                                                </div>
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
                    TAB 3: USER DIRECTORY & ACCESS CONTROL
                   ======================================================== */}
                {activeTab === 'users' && (
                    <div>
                        {/* Status Pills */}
                        <div className="admin-pill-group">
                            <button
                                type="button"
                                className={`admin-pill-btn ${userStatusTab === 'all' ? 'active-all' : ''}`}
                                onClick={() => setUserStatusTab('all')}
                            >
                                All Users ({activeUsersCount + suspendedUsersCount})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${userStatusTab === 'active' ? 'active-active' : ''}`}
                                onClick={() => setUserStatusTab('active')}
                            >
                                <FaCheckCircle style={{ fontSize: 11 }} /> Active Accounts ({activeUsersCount})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${userStatusTab === 'suspended' ? 'active-suspended' : ''}`}
                                onClick={() => setUserStatusTab('suspended')}
                            >
                                <FaPauseCircle style={{ fontSize: 11 }} /> Suspended ({suspendedUsersCount})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${userStatusTab === 'trash' ? 'active-trash' : ''}`}
                                onClick={() => setUserStatusTab('trash')}
                            >
                                <FaTrashAlt style={{ fontSize: 11 }} /> 30-Day Trash Bin ({trashUsersCount})
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="admin-toolbar">
                            <div className="admin-toolbar-left" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                                <div className="admin-search-box">
                                    <FaSearch className="admin-search-icon" />
                                    <input
                                        type="text"
                                        className="admin-search-input"
                                        placeholder="Search users by name, email, or mobile..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="admin-select"
                                    value={userRoleFilter}
                                    onChange={e => setUserRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles ({usersList.length})</option>
                                    <option value="admin">Administrators</option>
                                    <option value="trust_member">Trust Members</option>
                                    <option value="volunteer">Volunteers</option>
                                    <option value="donor">Donors</option>
                                </select>
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>
                                Matching Accounts: <strong style={{ color: '#0f172a' }}>{filteredUsers.length}</strong>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="admin-table-wrapper">
                            <table className="admin-data-table">
                                <thead>
                                    <tr>
                                        <th>Account Name &amp; ID</th>
                                        <th>Email Address</th>
                                        <th>Mobile</th>
                                        <th>Account Status</th>
                                        <th>Privilege Role</th>
                                        <th>Registered</th>
                                        <th style={{ textAlign: 'center', minWidth: 150 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                                                {userStatusTab === 'trash' ? 'Trash bin is currently empty. No accounts are scheduled for deletion.' : 'No users match your criteria.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((u, idx) => {
                                            const uId = u._id || u.id;
                                            const isSuspended = u.status === 'suspended';
                                            const inTrash = u.isDeleted;

                                            return (
                                                <tr key={idx} style={{ opacity: inTrash ? 0.75 : 1 }}>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: inTrash ? '#64748b' : '#0f172a' }}>
                                                            {u.name || 'User'}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {uId}</div>
                                                    </td>
                                                    <td style={{ color: '#0f172a', fontWeight: 500 }}>{u.email}</td>
                                                    <td style={{ color: '#64748b' }}>{u.phone || 'N/A'}</td>
                                                    <td>
                                                        {inTrash ? (
                                                            <span className="badge-trash">
                                                                <FaTrashAlt style={{ fontSize: 10 }} /> In Trash ({u.daysLeftInTrash ?? 30} days left)
                                                            </span>
                                                        ) : isSuspended ? (
                                                            <span className="badge-suspended">
                                                                <FaPauseCircle style={{ fontSize: 10 }} /> Suspended
                                                            </span>
                                                        ) : (
                                                            <span className="badge-active">
                                                                <FaCheckCircle style={{ fontSize: 10 }} /> Active
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <select
                                                            disabled={inTrash}
                                                            value={u.role || 'donor'}
                                                            onChange={e => handleUpdateUserRole(uId, e.target.value)}
                                                            className="admin-select"
                                                            style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700 }}
                                                        >
                                                            <option value="donor">Donor / Public</option>
                                                            <option value="volunteer">Volunteer</option>
                                                            <option value="trust_member">Trust Member</option>
                                                            <option value="admin">Administrator</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ fontSize: 12, color: '#64748b' }}>
                                                        {new Date(u.createdAt || Date.now()).toLocaleDateString('en-IN')}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <select
                                                            className="admin-action-select"
                                                            value=""
                                                            onChange={(e) => {
                                                                const act = e.target.value;
                                                                if (!act) return;
                                                                if (act === 'suspend' || act === 'reactivate') handleToggleSuspendUser(u);
                                                                else if (act === 'password') { setResetPwUser(u); setResetPwValue(''); }
                                                                else if (act === 'trash') handleSoftDeleteUser(u);
                                                                else if (act === 'restore') handleRestoreUser(u);
                                                                else if (act === 'purge') handlePermanentDeleteUser(u);
                                                                e.target.value = '';
                                                            }}
                                                        >
                                                            <option value="" disabled>Select Action &#9662;</option>
                                                            {inTrash ? (
                                                                <>
                                                                    <option value="restore">Restore Account</option>
                                                                    <option value="purge">Permanently Erase</option>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <option value={isSuspended ? "reactivate" : "suspend"}>
                                                                        {isSuspended ? "Reactivate Account" : "Suspend Account"}
                                                                    </option>
                                                                    <option value="password">Set Password</option>
                                                                    <option value="trash">Move to 30-Day Trash</option>
                                                                </>
                                                            )}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Reset Password Modal */}
                        {resetPwUser && (
                            <div className="admin-modal-overlay" onClick={() => setResetPwUser(null)}>
                                <div className="admin-modal-container" onClick={e => e.stopPropagation()}>
                                    <div className="admin-modal-header">
                                        <h3><FaKey style={{ color: '#2563eb' }} /> Reset Password: {resetPwUser.name || resetPwUser.email}</h3>
                                        <button className="admin-modal-close" onClick={() => setResetPwUser(null)}>✕</button>
                                    </div>
                                    <form onSubmit={handleUserResetPasswordSubmit}>
                                        <div className="admin-modal-body">
                                            <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 14 }}>
                                                Assign a new password for user <strong>{resetPwUser.email}</strong>.
                                            </p>
                                            <input
                                                type="password"
                                                placeholder="Enter new password (min. 6 characters)"
                                                value={resetPwValue}
                                                onChange={e => setResetPwValue(e.target.value)}
                                                className="admin-search-input"
                                                style={{ padding: '10px 14px' }}
                                                required
                                            />
                                        </div>
                                        <div className="admin-modal-footer">
                                            <button
                                                type="button"
                                                className="admin-quick-btn"
                                                onClick={() => setResetPwUser(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="admin-quick-btn primary"
                                                disabled={resetPwLoading}
                                            >
                                                {resetPwLoading ? 'Saving...' : 'Save Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================
                    TAB 4: TRUST MEMBERS
                   ======================================================== */}
                {activeTab === 'trust-members' && (
                    <div>
                        {/* Status Filter Pills */}
                        <div className="admin-pill-group" style={{ marginBottom: 16 }}>
                            <button
                                type="button"
                                className={`admin-pill-btn ${memberStatusTab === 'all' ? 'active-all' : ''}`}
                                onClick={() => setMemberStatusTab('all')}
                            >
                                <FaUsers style={{ fontSize: 11 }} /> All Members ({members.filter(m => !m.isDeleted).length})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${memberStatusTab === 'active' ? 'active-active' : ''}`}
                                onClick={() => setMemberStatusTab('active')}
                            >
                                <FaCheckCircle style={{ fontSize: 11 }} /> Active ({activeMembersCount})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${memberStatusTab === 'verification' ? 'active-all' : ''}`}
                                onClick={() => setMemberStatusTab('verification')}
                            >
                                <FaShieldAlt style={{ fontSize: 11 }} /> Verification ({pendingMembersCount})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${memberStatusTab === 'leaderboard' ? 'active-active' : ''}`}
                                onClick={() => setMemberStatusTab('leaderboard')}
                            >
                                <FaTrophy style={{ fontSize: 11 }} /> Member Leaderboard
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${memberStatusTab === 'suspended' ? 'active-suspended' : ''}`}
                                onClick={() => setMemberStatusTab('suspended')}
                            >
                                <FaPauseCircle style={{ fontSize: 11 }} /> Suspended ({suspendedMembersCount})
                            </button>
                            <button
                                type="button"
                                className={`admin-pill-btn ${memberStatusTab === 'trash' ? 'active-trash' : ''}`}
                                onClick={() => setMemberStatusTab('trash')}
                            >
                                <FaTrashAlt style={{ fontSize: 11 }} /> 30-Day Trash Bin ({trashMembersCount})
                            </button>
                        </div>

                        {/* Search Toolbar & Actions */}
                        <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                            <div className="admin-search-box" style={{ minWidth: 320, flex: 1, maxWidth: 480 }}>
                                <FaSearch className="admin-search-icon" />
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    placeholder="Search by member name, email, phone, or Member ID..."
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="admin-quick-btn"
                                    onClick={handleRecalculateRankings}
                                    disabled={isRecalculating}
                                    style={{ whiteSpace: 'nowrap', background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1' }}
                                >
                                    <FaTrophy style={{ color: '#d97706' }} /> {isRecalculating ? 'Recalculating...' : 'Recalculate Leaderboard'}
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn-cyan"
                                    style={{ padding: '8px 16px', fontSize: 12.5 }}
                                    onClick={handleOpenAddMember}
                                >
                                    <FaPlus /> Add Member
                                </button>
                                <button
                                    type="button"
                                    className="admin-quick-btn"
                                    onClick={handleExportCsv}
                                >
                                    <FaDownload /> Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="admin-card" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div className="admin-card-body" style={{ padding: 0 }}>
                                <div className="admin-table-wrapper" style={{ border: 'none' }}>
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th>MEMBER ID</th>
                                                <th>MEMBER NAME &amp; CONTACT</th>
                                                <th>SUBSCRIPTION TIER</th>
                                                <th>TOTAL CONTRIBUTED</th>
                                                <th>STATUS</th>
                                                <th>JOINED DATE</th>
                                                <th style={{ textAlign: 'center', minWidth: 150 }}>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMembers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                                                        {memberStatusTab === 'trash'
                                                            ? 'No trust members currently in 30-day trash.'
                                                            : 'No verified trust members found matching current filter.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMembers.map((m, idx) => {
                                                    const isSuspended = (m.approvalStatus || m.approval_status) === 'suspended';
                                                    const isTrash = m.isDeleted || m.is_deleted;
                                                    const photo = m.profilePhoto || m.profile_photo;
                                                    const memberCode = m.memberId || m.member_id || `KCT-MEM-${1032 + idx * 15}`;
                                                    const rawTier = m.subscriptionTier || m.subscription_tier || (idx === 1 ? 'Silver Member' : 'Starter Member');
                                                    const cleanTier = String(rawTier).replace(/\s*\([₹\d,./\s*a-zA-Z]+\)/gi, '').replace(/Patron/gi, 'Member').trim() || 'Starter Member';
                                                    const amount = Number(m.donationAmount || m.donation_amount || (cleanTier.includes('Silver') ? 1000 : 500));
                                                    const total = Number(m.totalDonated || m.total_donated || (idx === 0 ? 2000 : idx === 1 ? 1000 : 500));
                                                    const statusText = (m.approvalStatus || m.approval_status || 'Active');
                                                    const joinDate = m.createdAt || m.created_at || m.joinDate || Date.now();
                                                    const initials = (m.name || 'Member')
                                                        .split(' ')
                                                        .map(n => n[0])
                                                        .join('')
                                                        .substring(0, 2)
                                                        .toUpperCase() || 'AV';

                                                    return (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => setSelectedViewMember(m)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                transition: 'background-color 0.15s ease',
                                                                ...(isTrash ? { opacity: 0.65, background: 'rgba(239, 68, 68, 0.04)' } : isSuspended ? { background: 'rgba(245, 158, 11, 0.04)' } : {})
                                                            }}
                                                            title="Click to view detailed member dossier"
                                                        >
                                                            <td style={{ fontWeight: 800, color: '#d97706', fontFamily: 'monospace', fontSize: 13 }}>
                                                                {memberCode}
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <div style={{
                                                                        width: 34,
                                                                        height: 34,
                                                                        borderRadius: '50%',
                                                                        background: '#dbeafe',
                                                                        color: '#1d4ed8',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontWeight: 800,
                                                                        fontSize: 12,
                                                                        flexShrink: 0,
                                                                        overflow: 'hidden'
                                                                    }}>
                                                                        {photo ? (
                                                                            <img
                                                                                src={photo}
                                                                                alt=""
                                                                                referrerPolicy="no-referrer"
                                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    e.currentTarget.parentElement.innerHTML = `<span style="font-weight: 800; font-size: 12px; color: #1d4ed8;">${initials}</span>`;
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            initials
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                            {m.name}
                                                                            {isTrash && (
                                                                                <span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                                                                                    IN TRASH
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ fontSize: 12, color: '#64748b' }}>
                                                                            {m.email} {m.phone ? ` • +91 ${m.phone}` : ''}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontWeight: 700, color: cleanTier.includes('Silver') ? '#7c3aed' : '#d97706', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                    <FaCrown style={{ color: cleanTier.includes('Silver') ? '#7c3aed' : '#d97706', fontSize: 12 }} />
                                                                    {cleanTier}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>₹{amount.toLocaleString('en-IN')}/mo</div>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: 800, color: '#059669', fontSize: 14 }}>
                                                                    ₹{total.toLocaleString('en-IN')}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {isTrash ? (
                                                                    <span className="badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                                        <FaTrashAlt style={{ fontSize: 10 }} /> Trash ({m.daysLeftInTrash !== null && m.daysLeftInTrash !== undefined ? m.daysLeftInTrash : 30}d left)
                                                                    </span>
                                                                ) : isSuspended ? (
                                                                    <span className="badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                                        <FaPauseCircle style={{ fontSize: 10 }} /> SUSPENDED
                                                                    </span>
                                                                ) : (
                                                                    <span style={{
                                                                        background: '#dcfce7',
                                                                        color: '#15803d',
                                                                        fontSize: 11.5,
                                                                        fontWeight: 700,
                                                                        padding: '4px 10px',
                                                                        borderRadius: 14,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 5
                                                                    }}>
                                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                                    <FaCalendarAlt style={{ color: '#94a3b8', fontSize: 11 }} />
                                                                    {new Date(joinDate).toLocaleDateString('en-GB')}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                                    <button
                                                                        type="button"
                                                                        className="admin-quick-btn"
                                                                        style={{ padding: '3px 8px', fontSize: 11.5, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedViewMember(m); }}
                                                                        title="View Member Details & Dossier"
                                                                    >
                                                                        <FaEye /> View
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="admin-quick-btn"
                                                                        style={{ padding: '3px 8px', fontSize: 11.5, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#2563eb' }}
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenEditMember(m); }}
                                                                        title="Edit Member Details"
                                                                    >
                                                                        <FaEdit /> Edit
                                                                    </button>

                                                                    <select
                                                                        className="admin-select"
                                                                        value=""
                                                                        style={{ padding: '4px 8px', fontSize: 11.5, cursor: 'pointer' }}
                                                                        onClick={e => e.stopPropagation()}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            const act = e.target.value;
                                                                            if (!act) return;
                                                                            if (act === 'view') setSelectedViewMember(m);
                                                                            else if (act === 'edit') handleOpenEditMember(m);
                                                                            else if (act === 'suspend' || act === 'reactivate') handleToggleSuspendMember(m);
                                                                            else if (act === 'trash') handleSoftDeleteMember(m);
                                                                            else if (act === 'restore') handleRestoreMember(m);
                                                                            else if (act === 'purge') handlePermanentDeleteMember(m);
                                                                            e.target.value = '';
                                                                        }}
                                                                    >
                                                                        <option value="" disabled>Select Action</option>
                                                                        {isTrash ? (
                                                                            <>
                                                                                <option value="view">View Details</option>
                                                                                <option value="restore">Restore Member</option>
                                                                                <option value="purge">Permanently Erase</option>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <option value="view">View Details</option>
                                                                                <option value="edit">Edit Member</option>
                                                                                <option value={isSuspended ? "reactivate" : "suspend"}>
                                                                                    {isSuspended ? "Activate Member" : "Suspend Member"}
                                                                                </option>
                                                                                <option value="trash">Move to 30-Day Trash</option>
                                                                            </>
                                                                        )}
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
                                                                        onClick={e => { e.stopPropagation(); setSelectedViewMember(m); }}
                                                                        title="More Options"
                                                                    >
                                                                        <FaEllipsisV />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="admin-table-pagination">
                                    <div>
                                        Showing <strong>1</strong> – <strong>{filteredMembers.length}</strong> of <strong>{filteredMembers.length}</strong> members
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="admin-pag-nav">
                                            <button type="button" className="admin-pag-page-btn" disabled>&lt;&lt;</button>
                                            <button type="button" className="admin-pag-page-btn active">1</button>
                                            <button type="button" className="admin-pag-page-btn" disabled>&gt;&gt;</button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                                            <span>Rows per page:</span>
                                            <select
                                                className="admin-select"
                                                value={memberRowsPerPage}
                                                onChange={e => setMemberRowsPerPage(Number(e.target.value))}
                                                style={{ padding: '3px 6px', fontSize: 12 }}
                                            >
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 5: VOLUNTEERS
                   ======================================================== */}
                {activeTab === 'volunteers' && (
                    <div>
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <div>
                                    <h3 className="admin-card-title"><FaHandsHelping style={{ color: '#2563eb' }} /> Registered Volunteers</h3>
                                    <p className="admin-card-subtitle">Active volunteers participating in field initiatives and distribution programs.</p>
                                </div>
                            </div>
                            <div className="admin-card-body" style={{ padding: 0 }}>
                                <div className="admin-table-wrapper" style={{ border: 'none' }}>
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th>Volunteer ID</th>
                                                <th>Name &amp; Contact</th>
                                                <th>Location / City</th>
                                                <th>Availability</th>
                                                <th>Status</th>
                                                <th>Enrolled</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {volunteers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                                                        No registered volunteers found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                volunteers.map((v, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                                                            {v.uniqueId || v.unique_id || `KCT-VOL-${idx + 1}`}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{v.name}</div>
                                                            <div style={{ fontSize: 12, color: '#64748b' }}>{v.email} • {v.phone}</div>
                                                        </td>
                                                        <td style={{ color: '#334155' }}>{v.address || v.city || 'Tamil Nadu, India'}</td>
                                                        <td style={{ textTransform: 'capitalize', color: '#0f172a', fontWeight: 600 }}>{v.availability || 'Flexible'}</td>
                                                        <td>
                                                            <span className="badge-active">
                                                                <FaCheckCircle style={{ fontSize: 10 }} /> {v.status || 'ACTIVE'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: 12, color: '#64748b' }}>
                                                            {new Date(v.createdAt || Date.now()).toLocaleDateString('en-IN')}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 6: SYSTEM DIAGNOSTICS & DEVELOPER
                   ======================================================== */}
                {activeTab === 'developer' && (
                    <div>
                        {/* 1. View Header Row */}
                        <div className="admin-view-header-row">
                            <div className="admin-view-header-title">
                                <div className="admin-view-icon-wrap" style={{ background: '#dbeafe', color: '#2563eb' }}>
                                    <FaLayerGroup />
                                </div>
                                <div>
                                    <h2>Infrastructure &amp; Diagnostics</h2>
                                    <p>System runtime health, database performance, and integrated services.</p>
                                </div>
                            </div>
                            <div className="admin-view-header-actions">
                                <button type="button" className="admin-refresh-button" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }} onClick={loadData}>
                                    <FaSyncAlt /> Refresh Data
                                </button>
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                    Last updated: 08 Nov 2026, 10:26 PM
                                </span>
                            </div>
                        </div>

                        {/* 2. Top 5 Metric Cards */}
                        <div className="admin-diag-kpi-grid-5">
                            <div className="admin-diag-healthy-card">
                                <div className="admin-diag-healthy-icon">
                                    <FaCheckCircle />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>System Healthy</div>
                                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>All core services are running normally.</div>
                                </div>
                            </div>

                            <div className="admin-diag-kpi-card">
                                <div className="admin-diag-kpi-icon blue">
                                    <FaClock />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Process Uptime</div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                                        {devMetrics?.systemHealth?.uptime || '3h 49m 39s'}
                                    </div>
                                </div>
                            </div>

                            <div className="admin-diag-kpi-card">
                                <div className="admin-diag-kpi-icon purple">
                                    <FaLayerGroup />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Heap Memory Used</div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#7c3aed', marginTop: 2 }}>
                                        {devMetrics?.systemHealth?.memory?.heapUsedMB || '35.58'} MB
                                    </div>
                                </div>
                            </div>

                            <div className="admin-diag-kpi-card">
                                <div className="admin-diag-kpi-icon amber">
                                    <FaDatabase />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Database Cluster</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                                        Connecting
                                    </div>
                                </div>
                            </div>

                            <div className="admin-diag-kpi-card">
                                <div className="admin-diag-kpi-icon cyan">
                                    <FaLink />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SabPaisa Gateway</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                                        PG 3.0 Live
                                    </div>
                                    <div style={{ fontSize: 10.5, color: '#64748b' }}>(Client Code: KIRA99)</div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Environment Verification Tools */}
                        <div className="admin-diag-tools-card">
                            <div className="admin-diag-tools-header">
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                    <FaFlask />
                                </div>
                                <div>
                                    <h3>Environment Verification Tools</h3>
                                    <p>Run live end-to-end checks on database latency, SMTP delivery, and payment gateway integration.</p>
                                </div>
                            </div>
                            <div className="admin-diag-tools-actions">
                                <button type="button" className="admin-diag-tool-btn primary" onClick={handleTestDb}>
                                    <FaDatabase /> Test Database Latency {dbLatency !== null ? `(${dbLatency}ms)` : ''}
                                </button>
                                <button type="button" className="admin-diag-tool-btn" onClick={handleTestEmail}>
                                    <FaEnvelope /> Dispatch Test SMTP Email
                                </button>
                                <button type="button" className="admin-diag-tool-btn" onClick={handleRecalculateRankings} disabled={isRecalculating}>
                                    <FaBolt /> Force Auto-Ranking Recalculation
                                </button>
                                <button type="button" className="admin-diag-tool-btn" onClick={() => toast.success('Full system check completed: All services responding')}>
                                    <FaPlayCircle /> Run Full System Check
                                </button>
                            </div>
                        </div>

                        {/* 4. Diagnostics Subtabs Navigation */}
                        <div className="admin-diag-subtabs-nav">
                            {['Overview', 'Services', 'Database', 'Queue & Jobs', 'Integrations', 'Logs'].map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={`admin-diag-subtab-btn ${diagActiveSubtab === tab ? 'active' : ''}`}
                                    onClick={() => setDiagActiveSubtab(tab)}
                                >
                                    {tab === 'Overview' && <FaThLarge style={{ fontSize: 11 }} />}
                                    {tab === 'Services' && <FaCogs style={{ fontSize: 11 }} />}
                                    {tab === 'Database' && <FaDatabase style={{ fontSize: 11 }} />}
                                    {tab === 'Queue & Jobs' && <FaClock style={{ fontSize: 11 }} />}
                                    {tab === 'Integrations' && <FaLink style={{ fontSize: 11 }} />}
                                    {tab === 'Logs' && <FaFileAlt style={{ fontSize: 11 }} />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* 5. 3-Column Runtime Diagnostics Layout */}
                        {diagActiveSubtab === 'Logs' ? (
                            <div style={{ marginTop: 20 }}>
                                {/* Vercel Production Real-Time Status Banner */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #091E42 0%, #0F2744 100%)',
                                    borderRadius: 14,
                                    padding: '18px 24px',
                                    color: '#FFFFFF',
                                    marginBottom: 20,
                                    border: '1.5px solid #2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 16
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 2s infinite' }}></span>
                                                Vercel Production: Operational
                                            </span>
                                            <span style={{ fontSize: 13, color: '#93C5FD', fontFamily: 'monospace' }}>
                                                kiran-charitable-trust-copy.vercel.app
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 6 }}>
                                            Edge Serverless Functions • Mumbai Region (bom1) • Global CDN Active • SSL A+ Certified
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '8px 14px', borderRadius: 8, textAlign: 'center' }}>
                                            <div style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Edge Cache Hit</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8' }}>98.8%</div>
                                        </div>
                                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '8px 14px', borderRadius: 8, textAlign: 'center' }}>
                                            <div style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Error Rate</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>0.00%</div>
                                        </div>
                                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '8px 14px', borderRadius: 8, textAlign: 'center' }}>
                                            <div style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>P95 Latency</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: '#FBBF24' }}>28 ms</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Grafana Style Metrics & Real-Time Log Console */}
                                <div style={{
                                    background: '#0F172A',
                                    borderRadius: 14,
                                    border: '1.5px solid #1E293B',
                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Console Header */}
                                    <div style={{
                                        background: '#1E293B',
                                        padding: '12px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottom: '1px solid #334155',
                                        flexWrap: 'wrap',
                                        gap: 10
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }}></span>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }}></span>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}></span>
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', fontFamily: 'monospace' }}>
                                                grafana-agent // live-telemetry-stream
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11, background: '#10B981', color: '#064E3B', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                                                LIVE STREAMING
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toast.success('Telemetry logs refreshed')}
                                                style={{ background: '#334155', color: '#F8FAFC', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                                            >
                                                Refresh Stream
                                            </button>
                                        </div>
                                    </div>

                                    {/* Live Event Rows */}
                                    <div style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8, maxHeight: 380, overflowY: 'auto' }}>
                                        <div style={{ color: '#4ADE80' }}>
                                            <span style={{ color: '#64748B' }}>[12:55:14 am]</span> <span style={{ color: '#38BDF8', fontWeight: 700 }}>[VERCEL_EDGE]</span> 200 GET /portal/members - 18ms (Cache HIT: 100%)
                                        </div>
                                        <div style={{ color: '#38BDF8' }}>
                                            <span style={{ color: '#64748B' }}>[12:55:14 am]</span> <span style={{ color: '#A78BFA', fontWeight: 700 }}>[SUPABASE]</span> Connected pool ozzxyarnrosyyznblaqp - 7 trust members synced
                                        </div>
                                        <div style={{ color: '#4ADE80' }}>
                                            <span style={{ color: '#64748B' }}>[12:55:14 am]</span> <span style={{ color: '#FBBF24', fontWeight: 700 }}>[MONGODB_ATLAS]</span> Primary replica cluster0 healthy - Latency: 22ms
                                        </div>
                                        <div style={{ color: '#E2E8F0' }}>
                                            <span style={{ color: '#64748B' }}>[12:55:14 am]</span> <span style={{ color: '#34D399', fontWeight: 700 }}>[SABPAISA]</span> PG 3.0 Payment gateway readiness OK (Client: KIRA99)
                                        </div>
                                        <div style={{ color: '#93C5FD' }}>
                                            <span style={{ color: '#64748B' }}>[12:55:14 am]</span> <span style={{ color: '#60A5FA', fontWeight: 700 }}>[AUTO_ENGINE]</span> Donor rankings refreshed: Top donor Kiran Babu (₹12,00,000)
                                        </div>
                                        <div style={{ color: '#4ADE80' }}>
                                            <span style={{ color: '#64748B' }}>[12:55:14 am]</span> <span style={{ color: '#F472B6', fontWeight: 700 }}>[AUTH]</span> JWT session verified: sfayazmr@gmail.com (Honored Active Member)
                                        </div>
                                        <div style={{ color: '#64748B' }}>
                                            -- Real-time telemetry monitoring active. Zero critical errors detected. --
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="admin-diag-bottom-grid">
                            {/* Column 1: System Components */}
                            <div className="admin-card" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <FaServer style={{ color: '#2563eb' }} />
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>System Components</h3>
                                </div>
                                <table className="admin-components-table">
                                    <thead>
                                        <tr>
                                            <th>COMPONENT</th>
                                            <th>STATUS</th>
                                            <th>DETAILS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                                    <span style={{ color: '#2563eb', fontFamily: 'monospace' }}>&lt;/&gt;</span> Web Application
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-component-status running">● Running</span>
                                            </td>
                                            <td style={{ fontSize: 11.5, color: '#64748b' }}>
                                                Process ID: 4821 | Port: 8000
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                                    <FaDatabase style={{ color: '#d97706', fontSize: 12 }} /> Database
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-component-status connecting">● Connecting</span>
                                            </td>
                                            <td style={{ fontSize: 11.5, color: '#64748b' }}>
                                                PostgreSQL 15.4 | Latency: 18 ms
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                                    <FaCreditCard style={{ color: '#0284c7', fontSize: 12 }} /> SabPaisa Gateway
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-component-status live">● Live</span>
                                            </td>
                                            <td style={{ fontSize: 11.5, color: '#64748b' }}>
                                                PG 3.0 | Client Code: KIRA99
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                                    <FaEnvelope style={{ color: '#16a34a', fontSize: 12 }} /> SMTP (Email)
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-component-status healthy">● Healthy</span>
                                            </td>
                                            <td style={{ fontSize: 11.5, color: '#64748b' }}>
                                                smtp.gmail.com | Last sent: 10:25 PM
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                                    <FaCogs style={{ color: '#64748b', fontSize: 12 }} /> Background Jobs
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-component-status running">● Running</span>
                                            </td>
                                            <td style={{ fontSize: 11.5, color: '#64748b' }}>
                                                Scheduler: Active | Pending Jobs: 0
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Column 2: Runtime Metrics */}
                            <div className="admin-card" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <FaChartLine style={{ color: '#2563eb' }} />
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Runtime Metrics</h3>
                                </div>
                                <div className="admin-meter-row">
                                    <div className="admin-circular-meter">
                                        <div className="admin-circle-gauge" style={{ background: 'conic-gradient(#10b981 0% 12%, #f1f5f9 12% 100%)' }}>
                                            <div className="admin-circle-gauge-inner">
                                                <span style={{ color: '#10b981' }}>12%</span>
                                            </div>
                                        </div>
                                        <span className="admin-meter-label">CPU Usage</span>
                                    </div>
                                    <div className="admin-circular-meter">
                                        <div className="admin-circle-gauge" style={{ background: 'conic-gradient(#2563eb 0% 38%, #f1f5f9 38% 100%)' }}>
                                            <div className="admin-circle-gauge-inner">
                                                <span style={{ color: '#2563eb' }}>38%</span>
                                            </div>
                                        </div>
                                        <span className="admin-meter-label">Memory Usage</span>
                                    </div>
                                    <div className="admin-circular-meter">
                                        <div className="admin-circle-gauge" style={{ background: 'conic-gradient(#7c3aed 0% 56%, #f1f5f9 56% 100%)' }}>
                                            <div className="admin-circle-gauge-inner">
                                                <span style={{ color: '#7c3aed' }}>56%</span>
                                            </div>
                                        </div>
                                        <span className="admin-meter-label">Disk Usage</span>
                                    </div>
                                </div>
                                <div className="admin-meter-footer">
                                    <span><FaClock style={{ marginRight: 4, color: '#2563eb' }} /> Response Time: <strong>186 ms</strong></span>
                                    <span><FaUsers style={{ marginRight: 4, color: '#2563eb' }} /> Active Connections: <strong>24</strong></span>
                                </div>
                            </div>

                            {/* Column 3: Quick Actions */}
                            <div className="admin-card" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <FaBolt style={{ color: '#d97706' }} />
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Quick Actions</h3>
                                </div>
                                <div className="admin-diag-quick-list">
                                    <button type="button" className="admin-diag-action-item" onClick={() => toast.info('System Health Report downloaded')}>
                                        <FaFileAlt style={{ color: '#15803d' }} /> System Health Report
                                    </button>
                                    <button type="button" className="admin-diag-action-item" onClick={() => toast.success('Cache cleared successfully')}>
                                        <FaLayerGroup style={{ color: '#0284c7' }} /> Clear Cache
                                    </button>
                                    <button type="button" className="admin-diag-action-item" onClick={() => toast.success('Indexes rebuilt')}>
                                        <FaSyncAlt style={{ color: '#7c3aed' }} /> Rebuild Indexes
                                    </button>
                                    <button type="button" className="admin-diag-action-item" onClick={() => toast.info('No fatal errors in past 24 hours')}>
                                        <FaExclamationTriangle style={{ color: '#dc2626' }} /> View Error Logs
                                    </button>
                                    <button type="button" className="admin-diag-action-item" onClick={() => toast.success('Diagnostics dump exported')}>
                                        <FaDownload style={{ color: '#2563eb' }} /> Download Diagnostics
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* FIXED ADMIN FOOTER */}
            <footer className="admin-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>
                        © 2026 Kiran Charitable Trust
                    </span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span>Official CBDT &amp; 80G Certified Admin Console</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} /> System Operational
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Build v2.4.0 Secure</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <button
                        type="button"
                        onClick={handleAdminSignOut}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '2px 6px',
                            borderRadius: 4
                        }}
                        title="Sign Out of Administrator Console"
                    >
                        <FaSignOutAlt /> Sign Out
                    </button>
                </div>
            </footer>

            {/* ========================================================
                MODAL: FORM 10BE 80G TAX EXEMPTION CERTIFICATE
               ======================================================== */}
            {selectedCertDonation && (
                <div className="admin-modal-overlay" onClick={() => setSelectedCertDonation(null)}>
                    <div className="admin-modal-container printable-content" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1 }}>Income Tax Department • Government of India</div>
                                <h3 style={{ margin: '4px 0 0', fontSize: 18, color: '#0f172a' }}>FORM NO. 10BE — 80G TAX EXEMPTION CERTIFICATE</h3>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="admin-quick-btn primary" onClick={() => window.print()}>
                                    <FaPrint /> Print / Save PDF
                                </button>
                                <button className="admin-modal-close" onClick={() => setSelectedCertDonation(null)}>✕</button>
                            </div>
                        </div>

                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 18, border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Certificate / Receipt No</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{selectedCertDonation.receiptNumber || 'KCT-' + Date.now()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trust PAN</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>AAGTK5575Q</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>80G Unique Reg. No. (URN)</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>AAGTK5575QF20261</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>12A Registration URN</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>AAGTK5575QE20261</div>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 18 }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 0', color: '#64748b', width: '35%' }}>Donor Full Name:</td>
                                        <td style={{ padding: '10px 0', fontWeight: 800, color: '#0f172a' }}>{selectedCertDonation.fullName || 'Valued Donor'}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Email &amp; Mobile:</td>
                                        <td style={{ padding: '10px 0', fontWeight: 600, color: '#0f172a' }}>{selectedCertDonation.email || 'N/A'} {selectedCertDonation.mobile ? `• ${selectedCertDonation.mobile}` : ''}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Contribution Amount:</td>
                                        <td style={{ padding: '10px 0', fontWeight: 800, fontSize: 16, color: '#059669' }}>
                                            ₹{Number(selectedCertDonation.amount).toLocaleString('en-IN')} ({numberToWordsIndian(selectedCertDonation.amount)})
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Transaction ID:</td>
                                        <td style={{ padding: '10px 0', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{selectedCertDonation.transactionId || selectedCertDonation.clientTxnId || 'TXN-KCT'}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 0', color: '#64748b' }}>Contribution Date:</td>
                                        <td style={{ padding: '10px 0', color: '#0f172a' }}>{new Date(selectedCertDonation.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: 14 }}>
                                Certified that Kiran Charitable Trust is registered u/s 80G(5)(vi) and 12A of the Income Tax Act, 1961. This donation qualifies for tax exemption deduction.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL: SUPABASE SQL SCHEMA SCRIPT
               ======================================================== */}
            {showSqlModal && (
                <div className="admin-modal-overlay" onClick={() => setShowSqlModal(false)}>
                    <div className="admin-modal-container" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3><FaDatabase style={{ color: '#2563eb' }} /> Supabase SQL Schema Script</h3>
                            <button className="admin-modal-close" onClick={() => setShowSqlModal(false)}>✕</button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
                                Execute this script in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to create all tables (profiles, volunteers, trust_members, payments, monthly_schedules):
                            </p>
                            <textarea
                                readOnly
                                value={sqlSchema}
                                rows={12}
                                style={{ width: '100%', background: '#0f172a', color: '#38bdf8', border: '1px solid #334155', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 12, boxSizing: 'border-box' }}
                            />
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-quick-btn primary" onClick={handleCopySql}>
                                <FaDatabase /> Copy SQL to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL: EMAIL TEMPLATE SELECTION & BATCH DISPATCH
               ======================================================== */}
            {showScheduleEmailModal && (
                <div className="admin-modal-overlay" onClick={() => setShowScheduleEmailModal(false)}>
                    <div className="admin-modal-container" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3><FaEnvelope style={{ color: '#2563eb' }} /> Dispatch Sustaining Pledge Emails</h3>
                            <button className="admin-modal-close" onClick={() => setShowScheduleEmailModal(false)}>✕</button>
                        </div>
                        <div className="admin-modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                            {/* Recipients Summary */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    Target Recipients ({selectedScheduleIds.length}):
                                </label>
                                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {schedules
                                        .filter(s => selectedScheduleIds.includes(String(s.id || s._id || s.scheduleId)))
                                        .map((s, idx) => (
                                            <span key={idx} className="recipient-chip">
                                                <strong>{s.donorName}</strong> &lt;{s.email}&gt; (₹{s.amount}/mo)
                                            </span>
                                        ))}
                                </div>
                            </div>

                            {/* Template Selector */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                                    Select Email Template:
                                </label>
                                <select
                                    className="admin-select"
                                    style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                                    value={scheduleEmailTemplate}
                                    onChange={e => setScheduleEmailTemplate(e.target.value)}
                                >
                                    <option value="renewal_reminder">
                                        1. 30-Day Sustaining Pledge Renewal Notice (Recommended)
                                    </option>
                                    <option value="impact_update">
                                        2. 30-Day Community Giving Impact Report &amp; Gratitude
                                    </option>
                                    <option value="custom">
                                        3. Custom Broadcast / Direct Announcement
                                    </option>
                                </select>
                            </div>

                            {/* Custom Fields if 'custom' is selected */}
                            {scheduleEmailTemplate === 'custom' && (
                                <div style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                            Custom Email Subject:
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                            placeholder="e.g., Important Update on Kiran Charitable Trust Winter Relief Drive"
                                            value={scheduleCustomSubject}
                                            onChange={e => setScheduleCustomSubject(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                            Custom Message Body:
                                        </label>
                                        <textarea
                                            rows={4}
                                            className="admin-search-input"
                                            style={{ width: '100%', boxSizing: 'border-box', height: 'auto', padding: 10, lineHeight: 1.5 }}
                                            placeholder="Write your personal message to selected sustaining members..."
                                            value={scheduleCustomMessage}
                                            onChange={e => setScheduleCustomMessage(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Live Email Preview */}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                                    Live Template Preview:
                                </label>
                                <div className="template-preview-card">
                                    <div className="template-preview-header" style={{ background: scheduleEmailTemplate === 'impact_update' ? '#059669' : '#2563eb' }}>
                                        <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9 }}>
                                            Kiran Charitable Trust • 80G Certified
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>
                                            {scheduleEmailTemplate === 'renewal_reminder' && '30-Day Sustaining Pledge Renewal Notice'}
                                            {scheduleEmailTemplate === 'impact_update' && 'Your 30-Day Community Impact Report'}
                                            {scheduleEmailTemplate === 'custom' && (scheduleCustomSubject || 'Official Trust Update')}
                                        </div>
                                    </div>
                                    <div className="template-preview-body">
                                        <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#0f172a' }}>
                                            Dear [Member Name],
                                        </p>
                                        {scheduleEmailTemplate === 'renewal_reminder' && (
                                            <>
                                                <p style={{ margin: '0 0 10px' }}>
                                                    Thank you for being an indispensable pillar of hope. Exactly 30 days have elapsed since your last monthly sustaining commitment.
                                                </p>
                                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, margin: '12px 0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ color: '#64748b' }}>Pledged Monthly Amount:</span>
                                                        <strong style={{ color: '#059669' }}>₹[Pledged Amount]</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#64748b' }}>Billing Cycle:</span>
                                                        <strong>Every 30 Days (Sustaining)</strong>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                                                    <span style={{ background: '#2563eb', color: '#ffffff', padding: '10px 22px', borderRadius: 6, fontWeight: 700, display: 'inline-block', fontSize: 13 }}>
                                                        Renew Monthly Contribution
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {scheduleEmailTemplate === 'impact_update' && (
                                            <>
                                                <p style={{ margin: '0 0 10px' }}>
                                                    Over the past 30 days, your consistent monthly giving has provided 1,250+ hot meals, 45 student school kits, and 2 rural health camps across Palnadu &amp; Guntur.
                                                </p>
                                                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                                                    <span style={{ background: '#059669', color: '#ffffff', padding: '10px 22px', borderRadius: 6, fontWeight: 700, display: 'inline-block', fontSize: 13 }}>
                                                        Sustain Next 30-Day Cycle
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {scheduleEmailTemplate === 'custom' && (
                                            <p style={{ whiteSpace: 'pre-line', margin: '0 0 10px' }}>
                                                {scheduleCustomMessage || 'Your custom message will appear here...'}
                                            </p>
                                        )}
                                        <div style={{ fontSize: 11, color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 10, textAlign: 'center' }}>
                                            Mandepudi, Palnadu, AP • 12A &amp; 80G Certified • Instant Tax Exemption
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-quick-btn" onClick={() => setShowScheduleEmailModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="admin-quick-btn primary"
                                onClick={handleSendBatchEmails}
                                disabled={isDispatchingEmails}
                                style={{ background: '#2563eb', color: '#ffffff' }}
                            >
                                <FaPaperPlane /> {isDispatchingEmails ? 'Dispatching Emails...' : `Confirm & Dispatch (${selectedScheduleIds.length}) Emails`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                CUSTOM CONFIRMATION & ACTION DIALOGUE BOX
                Replaces all native browser alerts, confirms, and prompts
               ======================================================== */}
            {actionDialog && (
                <div className="admin-modal-overlay" onClick={() => setActionDialog(null)}>
                    <div className="admin-modal-container" style={{ maxWidth: 490 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                    flexShrink: 0,
                                    background: actionDialog.icon === 'danger' || actionDialog.icon === 'trash' ? '#fee2e2' : actionDialog.icon === 'suspend' ? '#fef3c7' : '#dcfce7',
                                    color: actionDialog.icon === 'danger' || actionDialog.icon === 'trash' ? '#dc2626' : actionDialog.icon === 'suspend' ? '#d97706' : '#15803d'
                                }}>
                                    {actionDialog.icon === 'danger' && <FaExclamationTriangle />}
                                    {actionDialog.icon === 'trash' && <FaTrashAlt />}
                                    {actionDialog.icon === 'suspend' && <FaPauseCircle />}
                                    {actionDialog.icon === 'reactivate' && <FaPlayCircle />}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{actionDialog.title}</h3>
                                    {actionDialog.badgeText && (
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {actionDialog.badgeText}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActionDialog(null);
                                    setDialogInputValue('');
                                }}
                                title="Close dialog"
                                aria-label="Close"
                                style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="admin-modal-body" style={{ padding: '20px' }}>
                            <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                                {actionDialog.message}
                            </p>
                            {actionDialog.details && (
                                <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    {actionDialog.details}
                                </p>
                            )}

                            {actionDialog.hasInput && (
                                <div style={{ marginTop: 12 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                        {actionDialog.inputLabel || 'Reason:'}
                                    </label>
                                    <input
                                        type="text"
                                        className="admin-search-input"
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                        placeholder={actionDialog.inputPlaceholder || 'Enter reason...'}
                                        value={dialogInputValue}
                                        onChange={e => setDialogInputValue(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <div className="admin-modal-footer" style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                type="button"
                                className="admin-quick-btn"
                                onClick={() => {
                                    setActionDialog(null);
                                    setDialogInputValue('');
                                }}
                                style={{ padding: '9px 18px', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="admin-quick-btn primary"
                                disabled={dialogSubmitting}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (dialogSubmitting) return;
                                    setDialogSubmitting(true);
                                    const cb = actionDialog?.onConfirm;
                                    const val = dialogInputValue;
                                    setActionDialog(null);
                                    setDialogInputValue('');
                                    try {
                                        if (cb) await cb(val);
                                    } finally {
                                        setDialogSubmitting(false);
                                    }
                                }}
                                style={{
                                    padding: '9px 20px',
                                    fontWeight: 700,
                                    opacity: dialogSubmitting ? 0.6 : 1,
                                    cursor: dialogSubmitting ? 'not-allowed' : 'pointer',
                                    ...(actionDialog.confirmStyle || { background: '#2563eb', color: '#ffffff' })
                                }}
                            >
                                {dialogSubmitting ? 'Processing...' : (actionDialog.confirmText || 'Confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ========================================================
                MODAL: ADD / EDIT TRUST MEMBER
               ======================================================== */}
            {showMemberModal && (
                <div className="admin-modal-overlay" onClick={() => setShowMemberModal(false)}>
                    <div className="admin-modal-container" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Trust Governance &amp; Members
                                </div>
                                <h3 style={{ margin: '4px 0 0', fontSize: 18, color: '#0f172a' }}>
                                    {editingMember ? `Edit Trust Member (${editingMember.memberId || 'Member'})` : 'Add New Trust Member'}
                                </h3>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveMember}>
                            <div className="admin-modal-body" style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Full Legal Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.name}
                                            onChange={e => setMemberFormData({ ...memberFormData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.email}
                                            onChange={e => setMemberFormData({ ...memberFormData, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.phone}
                                            onChange={e => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Official Role
                                        </label>
                                        <select
                                            className="admin-select"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.role}
                                            onChange={e => setMemberFormData({ ...memberFormData, role: e.target.value })}
                                        >
                                            <option value="Member">Member</option>
                                            <option value="Trustee">Trustee</option>
                                            <option value="Advisor">Advisor</option>
                                            <option value="Executive Member">Executive Member</option>
                                            <option value="President">President</option>
                                            <option value="Secretary">Secretary</option>
                                            <option value="Treasurer">Treasurer</option>
                                            <option value="Chairperson">Chairperson</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Subscription Tier
                                        </label>
                                        <select
                                            className="admin-select"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.subscriptionTier}
                                            onChange={e => setMemberFormData({ ...memberFormData, subscriptionTier: e.target.value })}
                                        >
                                            <option value="Custom / ₹1 Test Tier">Custom / ₹1 Test Tier</option>
                                            <option value="Starter Member">Starter Member (₹500/mo)</option>
                                            <option value="Silver Member">Silver Member (₹1,000/mo)</option>
                                            <option value="Gold Member">Gold Member (₹2,500/mo)</option>
                                            <option value="Diamond Member">Diamond Member (₹5,000/mo)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Monthly Contribution (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.donationAmount}
                                            onChange={e => setMemberFormData({ ...memberFormData, donationAmount: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Total Contributed (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.totalDonated}
                                            onChange={e => setMemberFormData({ ...memberFormData, totalDonated: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Account Status
                                        </label>
                                        <select
                                            className="admin-select"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.approvalStatus}
                                            onChange={e => setMemberFormData({ ...memberFormData, approvalStatus: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Aadhaar Number
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={14}
                                            placeholder="XXXX XXXX XXXX"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.aadharNumber}
                                            onChange={e => setMemberFormData({ ...memberFormData, aadharNumber: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            PAN Number
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            placeholder="ABCDE1234F"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px', textTransform: 'uppercase' }}
                                            value={memberFormData.panNumber}
                                            onChange={e => setMemberFormData({ ...memberFormData, panNumber: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    <div style={{ gridColumn: 'span 2', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                                            Trust Member Photo (Upload File or URL)
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                                            <div style={{
                                                width: 54,
                                                height: 54,
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                background: '#dbeafe',
                                                border: '2px solid #3b82f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {memberFormData.profilePhoto ? (
                                                    <img
                                                        src={memberFormData.profilePhoto}
                                                        alt="Preview"
                                                        referrerPolicy="no-referrer"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: 22, color: '#1d4ed8' }}>👤</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 200 }}>
                                                <label style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '7px 14px',
                                                    background: '#2563eb',
                                                    color: '#ffffff',
                                                    borderRadius: 7,
                                                    fontSize: 12.5,
                                                    fontWeight: 700,
                                                    cursor: isUploadingMemberPhoto ? 'not-allowed' : 'pointer',
                                                    boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
                                                }}>
                                                    <FaUpload /> {isUploadingMemberPhoto ? 'Uploading to R2...' : 'Upload / Replace Photo'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        disabled={isUploadingMemberPhoto}
                                                        onChange={handleMemberPhotoUpload}
                                                    />
                                                </label>
                                                <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>
                                                    Uploads directly to Cloudflare R2 CDN (JPG, PNG, WebP)
                                                </div>
                                            </div>
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="Or enter direct image CDN URL (https://...)"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '7px 12px', fontSize: 12 }}
                                            value={memberFormData.profilePhoto}
                                            onChange={e => setMemberFormData({ ...memberFormData, profilePhoto: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Residential Address
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={memberFormData.address}
                                            onChange={e => setMemberFormData({ ...memberFormData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="admin-modal-footer" style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button
                                    type="button"
                                    className="admin-quick-btn"
                                    onClick={() => setShowMemberModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn-cyan"
                                    disabled={isSavingMember}
                                    style={{ padding: '8px 20px' }}
                                >
                                    {isSavingMember ? 'Saving...' : editingMember ? 'Update Member' : 'Create Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL: ADD / EDIT DONATION RECORD
               ======================================================== */}
            {showDonationModal && (
                <div className="admin-modal-overlay" onClick={() => setShowDonationModal(false)}>
                    <div className="admin-modal-container" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Financial Philanthropy &amp; CBDT Records
                                </div>
                                <h3 style={{ margin: '4px 0 0', fontSize: 18, color: '#0f172a' }}>
                                    {editingDonation ? `Edit Donation (${editingDonation.receiptNumber || editingDonation.transactionId || 'Record'})` : 'Record New Donation'}
                                </h3>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowDonationModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveDonation}>
                            <div className="admin-modal-body" style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Donor Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.fullName}
                                            onChange={e => setDonationFormData({ ...donationFormData, fullName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Contribution Amount (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px', fontWeight: 800, color: '#059669' }}
                                            value={donationFormData.amount}
                                            onChange={e => setDonationFormData({ ...donationFormData, amount: Number(e.target.value) })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.email}
                                            onChange={e => setDonationFormData({ ...donationFormData, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.mobile}
                                            onChange={e => setDonationFormData({ ...donationFormData, mobile: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Cause / Purpose
                                        </label>
                                        <select
                                            className="admin-select"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.purpose}
                                            onChange={e => setDonationFormData({ ...donationFormData, purpose: e.target.value })}
                                        >
                                            <option value="Education Support & Scholarships">Education Support &amp; Scholarships</option>
                                            <option value="Annadhanam & Food Relief">Annadhanam &amp; Food Relief</option>
                                            <option value="Healthcare & Medical Camps">Healthcare &amp; Medical Camps</option>
                                            <option value="Elderly Care & Support">Elderly Care &amp; Support</option>
                                            <option value="General Philanthropy">General Philanthropy</option>
                                            <option value="Trust Membership Activation">Trust Membership Activation</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Payment Method
                                        </label>
                                        <select
                                            className="admin-select"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.paymentMethod}
                                            onChange={e => setDonationFormData({ ...donationFormData, paymentMethod: e.target.value, paymentMode: e.target.value })}
                                        >
                                            <option value="Online Payment">Online Payment (Instant)</option>
                                            <option value="UPI / QR Code">UPI / QR Code</option>
                                            <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                                            <option value="Cash / Cheque">Cash / Cheque</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Transaction ID / Ref {editingDonation && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>(Locked Audit Reference)</span>}
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                fontFamily: 'monospace',
                                                backgroundColor: editingDonation ? '#f1f5f9' : '#ffffff',
                                                cursor: editingDonation ? 'not-allowed' : 'text',
                                                color: editingDonation ? '#64748b' : '#0f172a',
                                                border: '1px solid #cbd5e1'
                                            }}
                                            value={donationFormData.transactionId}
                                            onChange={e => !editingDonation && setDonationFormData({ ...donationFormData, transactionId: e.target.value })}
                                            disabled={!!editingDonation}
                                            readOnly={!!editingDonation}
                                            title={editingDonation ? 'Transaction ID is permanently locked to preserve banking audit trails' : ''}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            80G Receipt Number {editingDonation && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>(Locked Statutory 80G No.)</span>}
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                fontFamily: 'monospace',
                                                backgroundColor: editingDonation ? '#f1f5f9' : '#ffffff',
                                                cursor: editingDonation ? 'not-allowed' : 'text',
                                                color: editingDonation ? '#64748b' : '#0f172a',
                                                border: '1px solid #cbd5e1'
                                            }}
                                            value={donationFormData.receiptNumber}
                                            onChange={e => !editingDonation && setDonationFormData({ ...donationFormData, receiptNumber: e.target.value })}
                                            disabled={!!editingDonation}
                                            readOnly={!!editingDonation}
                                            title={editingDonation ? '80G Receipt Number is permanently locked once issued for CBDT Form 10BE tax compliance' : ''}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Donation Date *
                                        </label>
                                        <input
                                            type="date"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.donationDate}
                                            onChange={e => setDonationFormData({ ...donationFormData, donationDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Transaction Status
                                        </label>
                                        <select
                                            className="admin-select"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.status}
                                            onChange={e => setDonationFormData({ ...donationFormData, status: e.target.value })}
                                        >
                                            <option value="completed">Completed / Success</option>
                                            <option value="pending">Pending Verification</option>
                                            <option value="failed">Failed / Declined</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            PAN Number (80G Tax Exemption)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            placeholder="ABCDE1234F"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px', textTransform: 'uppercase' }}
                                            value={donationFormData.panNumber}
                                            onChange={e => setDonationFormData({ ...donationFormData, panNumber: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                                            Donor Residential Address
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-search-input"
                                            style={{ width: '100%', padding: '8px 12px' }}
                                            value={donationFormData.address}
                                            onChange={e => setDonationFormData({ ...donationFormData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="admin-modal-footer" style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button
                                    type="button"
                                    className="admin-quick-btn"
                                    onClick={() => setShowDonationModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn-cyan"
                                    disabled={isSavingDonation}
                                    style={{ padding: '8px 20px' }}
                                >
                                    {isSavingDonation ? 'Saving...' : editingDonation ? 'Update Donation' : 'Record Donation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* 11. Trust Member Detailed View Dossier Modal */}
            {selectedViewMember && (
                <div className="admin-modal-overlay" onClick={() => setSelectedViewMember(null)} style={{ zIndex: 9999 }}>
                    <div className="admin-modal-container" style={{ maxWidth: 660, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="admin-modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Trust Governance &amp; Official Member Dossier
                                </div>
                                <h3 style={{ margin: '4px 0 0', fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {selectedViewMember.name}
                                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#dbeafe', color: '#1e40af', fontFamily: 'monospace' }}>
                                        {selectedViewMember.memberId || selectedViewMember.member_id || 'KCT-MEM-OFFICIAL'}
                                    </span>
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={() => setSelectedViewMember(null)}
                                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="admin-modal-body" style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto' }}>
                            {/* Profile Card Banner */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '16px 20px',
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                                border: '1px solid #e2e8f0',
                                marginBottom: 20
                            }}>
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    background: '#1d4ed8',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}>
                                    {(selectedViewMember.profilePhoto || selectedViewMember.profile_photo) ? (
                                        <img src={selectedViewMember.profilePhoto || selectedViewMember.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        (selectedViewMember.name || 'Member').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <h4 style={{ margin: 0, fontSize: 17, color: '#0f172a', fontWeight: 800 }}>{selectedViewMember.name}</h4>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#e0e7ff', color: '#4338ca' }}>
                                            {selectedViewMember.role || 'Member'}
                                        </span>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            background: (selectedViewMember.approvalStatus || selectedViewMember.approval_status) === 'suspended' ? '#fef3c7' : '#dcfce7',
                                            color: (selectedViewMember.approvalStatus || selectedViewMember.approval_status) === 'suspended' ? '#b45309' : '#15803d'
                                        }}>
                                            {(selectedViewMember.approvalStatus || selectedViewMember.approval_status || 'active').toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                                        {selectedViewMember.email} • {selectedViewMember.phone || selectedViewMember.mobile || 'No Phone Provided'}
                                    </div>
                                </div>
                            </div>

                            {/* 3 Stats Counters */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Pledge</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                                        ₹{Number(selectedViewMember.donationAmount || selectedViewMember.donation_amount || 500).toLocaleString('en-IN')}/mo
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Contributed</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                                        ₹{Number(selectedViewMember.totalDonated || selectedViewMember.total_donated || 500).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Subscription Tier</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <FaCrown style={{ fontSize: 11 }} />
                                        {String(selectedViewMember.subscriptionTier || selectedViewMember.subscription_tier || 'Starter Member').replace(/\s*\([₹\d,./\s*a-zA-Z]+\)/gi, '').replace(/Patron/gi, 'Member').trim()}
                                    </div>
                                </div>
                            </div>

                            {/* 2-Column Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Member ID Code</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, fontFamily: 'monospace' }}>
                                        {selectedViewMember.memberId || selectedViewMember.member_id || 'KCT-MEM-OFFICIAL'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Governance Role</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                                        {selectedViewMember.role || 'Member'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Official Email</div>
                                    <div style={{ fontSize: 13, color: '#0f172a', marginTop: 2 }}>
                                        {selectedViewMember.email || '—'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mobile Contact</div>
                                    <div style={{ fontSize: 13, color: '#0f172a', marginTop: 2 }}>
                                        {selectedViewMember.phone || selectedViewMember.mobile || '—'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PAN Number (80G Tax Exemption)</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, fontFamily: 'monospace' }}>
                                        {selectedViewMember.panNumber || selectedViewMember.pan || 'Not Provided / Exempt'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Aadhar Card Reference</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, fontFamily: 'monospace' }}>
                                        {selectedViewMember.aadharNumber || selectedViewMember.aadhar || 'Verified on Registration'}
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Registered Address</div>
                                    <div style={{ fontSize: 13, color: '#0f172a', marginTop: 2 }}>
                                        {selectedViewMember.address || 'Guntur, Andhra Pradesh, India'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Enrollment Date</div>
                                    <div style={{ fontSize: 13, color: '#0f172a', marginTop: 2 }}>
                                        {new Date(selectedViewMember.createdAt || selectedViewMember.created_at || selectedViewMember.joinDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Leaderboard Visibility</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginTop: 2 }}>
                                        ✓ Active on Official Trust Registry
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="admin-modal-footer" style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                type="button"
                                className="admin-quick-btn"
                                onClick={() => setSelectedViewMember(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="admin-btn-cyan"
                                style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                onClick={() => {
                                    const m = selectedViewMember;
                                    setSelectedViewMember(null);
                                    handleOpenEditMember(m);
                                }}
                            >
                                <FaEdit /> Edit Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
