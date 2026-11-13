const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const TrustMember = require('../models/TrustMember');
const MonthlySchedule = require('../models/MonthlySchedule');
const Donation = require('../models/Donation');
const PerformanceMetric = require('../models/PerformanceMetric');
const { memoryStore, getSupabaseSchemaSQL, persistMemoryStore } = require('../services/supabaseService');
const { 
    sendMonthlyReminderEmail, 
    sendOtpEmail, 
    sendVolunteerWelcomeEmail,
    sendTrustMemberWelcomeEmail,
    sendPaymentSuccessEmail, 
    sendPaymentPendingEmail, 
    sendPaymentFailureEmail,
    send30DayRenewalReminderEmail,
    send30DayImpactUpdateEmail,
    sendCustomDonorAnnouncementEmail,
    renderTemplate,
    getMockDataForTemplate
} = require('../services/emailService');
const { autoRankDonors, getCachedLeaderboard } = require('../services/rankingService');
const { 
    getNormalizedSchedules, 
    run30DayReminderCheck, 
    sendBatchCustomReminders, 
    getSchedulerStatus 
} = require('../services/schedulerService');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/supabase-sql — Returns Supabase setup SQL
router.get('/supabase-sql', (req, res) => {
    res.json({
        success: true,
        sql: getSupabaseSchemaSQL()
    });
});

// GET /api/admin/dashboard-stats — Financial & Registration Dashboard
router.get('/dashboard-stats', async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // 1. Gather all unique registered users (excluding hard deleted)
        const userEmailSet = new Set();
        let totalUsers = 0;
        let todayUsersCount = 0;
        let monthUsersCount = 0;

        if (mongoose.connection.readyState === 1) {
            try {
                const dbUsers = await User.find({ isDeleted: { $ne: true } }).select('email createdAt').lean().maxTimeMS(800);
                for (const u of dbUsers) {
                    if (u.email) {
                        const em = u.email.toLowerCase().trim();
                        if (!userEmailSet.has(em)) {
                            userEmailSet.add(em);
                            totalUsers++;
                            const cDate = new Date(u.createdAt);
                            if (cDate >= todayStart) todayUsersCount++;
                            if (cDate >= monthStart) monthUsersCount++;
                        }
                    }
                }
            } catch (e) {}
        }
        for (const p of (memoryStore.profiles || [])) {
            if (p.email && !p.isDeleted && p.status !== 'deleted') {
                const em = p.email.toLowerCase().trim();
                if (!userEmailSet.has(em)) {
                    userEmailSet.add(em);
                    totalUsers++;
                    const cDate = new Date(p.created_at || p.createdAt || Date.now());
                    if (cDate >= todayStart) todayUsersCount++;
                    if (cDate >= monthStart) monthUsersCount++;
                }
            }
        }
        for (const u of (memoryStore.users || [])) {
            if (u.email && !u.isDeleted && u.status !== 'deleted') {
                const em = u.email.toLowerCase().trim();
                if (!userEmailSet.has(em)) {
                    userEmailSet.add(em);
                    totalUsers++;
                    const cDate = new Date(u.created_at || u.createdAt || Date.now());
                    if (cDate >= todayStart) todayUsersCount++;
                    if (cDate >= monthStart) monthUsersCount++;
                }
            }
        }

        // 2. Gather all unique verified Trust Members (active standing)
        const tmEmailSet = new Set();
        let totalTrustMembers = 0;
        let activeTrustMembers = 0;
        let monthlyCommitment = 0;
        let todayTmCount = 0;
        let monthTmCount = 0;

        if (mongoose.connection.readyState === 1) {
            try {
                const dbMembers = await TrustMember.find({ isDeleted: { $ne: true } }).lean().maxTimeMS(800);
                for (const m of dbMembers) {
                    const em = (m.email || '').toLowerCase().trim();
                    const key = em || m.memberId;
                    if (key && !tmEmailSet.has(key)) {
                        tmEmailSet.add(key);
                        totalTrustMembers++;
                        if (m.approvalStatus !== 'suspended' && m.approvalStatus !== 'deleted') {
                            activeTrustMembers++;
                            monthlyCommitment += Number(m.donationAmount || 0);
                        }
                        const cDate = new Date(m.createdAt);
                        if (cDate >= todayStart) todayTmCount++;
                        if (cDate >= monthStart) monthTmCount++;
                    }
                }
            } catch (e) {}
        }
        for (const tm of (memoryStore.trust_members || [])) {
            if (!tm.isDeleted && tm.approvalStatus !== 'deleted') {
                const em = (tm.email || '').toLowerCase().trim();
                const key = em || tm.memberId;
                if (key && !tmEmailSet.has(key)) {
                    tmEmailSet.add(key);
                    totalTrustMembers++;
                    if (tm.approvalStatus !== 'suspended') {
                        activeTrustMembers++;
                        monthlyCommitment += Number(tm.donationAmount || 500);
                    }
                    const cDate = new Date(tm.createdAt || Date.now());
                    if (cDate >= todayStart) todayTmCount++;
                    if (cDate >= monthStart) monthTmCount++;
                }
            }
        }
        for (const p of (memoryStore.profiles || [])) {
            if (p.role === 'trust_member' && !p.isDeleted && p.status !== 'deleted') {
                const em = (p.email || '').toLowerCase().trim();
                const key = em || p.memberId;
                if (key && !tmEmailSet.has(key)) {
                    tmEmailSet.add(key);
                    totalTrustMembers++;
                    activeTrustMembers++;
                    monthlyCommitment += Number(p.donationAmount || 500);
                    const cDate = new Date(p.created_at || p.createdAt || Date.now());
                    if (cDate >= todayStart) todayTmCount++;
                    if (cDate >= monthStart) monthTmCount++;
                }
            }
        }

        // 3. Gather Volunteers
        const volEmailSet = new Set();
        let totalVolunteers = 0;
        let todayVolCount = 0;
        let monthVolCount = 0;

        if (mongoose.connection.readyState === 1) {
            try {
                const dbVols = await Volunteer.find({ isDeleted: { $ne: true } }).select('email createdAt').lean().maxTimeMS(800);
                for (const v of dbVols) {
                    if (v.email) {
                        const em = v.email.toLowerCase().trim();
                        if (!volEmailSet.has(em)) {
                            volEmailSet.add(em);
                            totalVolunteers++;
                            const cDate = new Date(v.createdAt);
                            if (cDate >= todayStart) todayVolCount++;
                            if (cDate >= monthStart) monthVolCount++;
                        }
                    }
                }
            } catch (e) {}
        }
        for (const v of (memoryStore.volunteers || [])) {
            if (v.email && !v.isDeleted) {
                const em = v.email.toLowerCase().trim();
                if (!volEmailSet.has(em)) {
                    volEmailSet.add(em);
                    totalVolunteers++;
                    const cDate = new Date(v.created_at || v.createdAt || Date.now());
                    if (cDate >= todayStart) todayVolCount++;
                    if (cDate >= monthStart) monthVolCount++;
                }
            }
        }

        // 4. Gather Real Completed Donations & Revenue
        const txnIdSet = new Set();
        let totalDonationsCount = 0;
        let totalRevenue = 0;
        let generalDonationsTotal = 0;
        let trustMemberMonthlyTotal = 0;
        let volunteerFeesTotal = 0;

        if (mongoose.connection.readyState === 1) {
            try {
                const dbDonations = await Donation.find({ status: { $in: ['completed', 'success'] } }).lean().maxTimeMS(800);
                for (const d of dbDonations) {
                    const tid = d.transactionId || d.clientTxnId || String(d._id);
                    if (!txnIdSet.has(tid)) {
                        txnIdSet.add(tid);
                        const amt = Number(d.amount || 0);
                        totalDonationsCount++;
                        totalRevenue += amt;
                        if (d.donorCategory === 'trust_member_contribution' || d.purpose?.includes('Trust Member')) {
                            trustMemberMonthlyTotal += amt;
                        } else if (d.donorCategory === 'volunteer_registration') {
                            volunteerFeesTotal += amt;
                        } else {
                            generalDonationsTotal += amt;
                        }
                    }
                }
            } catch (e) {}
        }
        for (const p of (memoryStore.payments || [])) {
            const tid = p.transactionId || p.clientTxnId;
            if (tid && !txnIdSet.has(tid) && (p.status === 'completed' || p.status === 'success')) {
                txnIdSet.add(tid);
                const amt = Number(p.amount || 0);
                totalDonationsCount++;
                totalRevenue += amt;
                if (p.donorCategory === 'trust_member_contribution' || p.purpose?.includes('Trust Member')) {
                    trustMemberMonthlyTotal += amt;
                } else if (p.donorCategory === 'volunteer_registration') {
                    volunteerFeesTotal += amt;
                } else {
                    generalDonationsTotal += amt;
                }
            }
        }

        // 5. Velocity Calculations
        const todayRegistrations = todayUsersCount + todayTmCount + todayVolCount;
        const currentMonthRegistrations = monthUsersCount + monthTmCount + monthVolCount;
        const targetDailyMin = 350;
        const targetDailyMax = 500;
        const targetMonthly = 10000;

        const dailyPacingPercentage = Math.min(100, Math.round((todayRegistrations / targetDailyMin) * 100));
        const monthlyPacingPercentage = Math.min(100, Math.round((currentMonthRegistrations / targetMonthly) * 100));

        return res.json({
            success: true,
            stats: {
                totalUsers,
                totalVolunteers,
                totalTrustMembers,
                activeTrustMembers,
                totalDonationsCount,
                totalRevenue,
                generalDonationsTotal,
                volunteerFeesTotal,
                trustMemberMonthlyTotal,
                monthlyCommitment
            },
            velocity: {
                todayRegistrations,
                targetDailyMin,
                targetDailyMax,
                dailyPacingPercentage,
                currentMonthRegistrations,
                targetMonthly,
                monthlyPacingPercentage,
                daysRemainingInMonth: 30 - new Date().getDate()
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to compute dashboard stats' });
    }
});

// GET /api/admin/developer-metrics — Website Training & Developer Performance Panel
router.get('/developer-metrics', async (req, res) => {
    try {
        const mem = process.memoryUsage();
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        // System Health
        const systemHealth = {
            status: 'HEALTHY',
            nodeVersion: process.version,
            platform: `${process.platform} (${process.arch})`,
            uptime: `${hours}h ${minutes}m ${seconds}s`,
            uptimeSeconds: Math.floor(uptimeSeconds),
            memory: {
                heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
                heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
                rssMB: (mem.rss / 1024 / 1024).toFixed(2)
            },
            database: {
                mongodb: mongoose.connection.readyState === 1 ? 'CONNECTED (Cluster0)' : mongoose.connection.readyState === 2 ? 'CONNECTING' : 'OFFLINE',
                supabase: process.env.SUPABASE_URL ? 'CONFIGURED & SYNCED' : 'LOCAL SIMULATION'
            },
            gateways: {
                sabpaisa: 'ACTIVE (PG 3.0 Live - KIRA99)',
                titanSmtp: process.env.EMAIL_USER ? `ACTIVE (${process.env.EMAIL_USER})` : 'OFFLINE'
            }
        };

        // Webhook & Payment Audit Log
        let recentPayments = [];
        try {
            if (mongoose.connection.readyState === 1) {
                recentPayments = await Donation.find()
                    .sort({ createdAt: -1 })
                    .limit(15)
                    .select('clientTxnId transactionId amount status fullName email paymentMode createdAt')
                    .lean();
            }
        } catch (e) {}

        // Training & Performance Metrics
        let metricsHistory = [];
        try {
            if (mongoose.connection.readyState === 1) {
                metricsHistory = await PerformanceMetric.find()
                    .sort({ date: -1 })
                    .limit(7)
                    .lean();
            }
        } catch (e) {}

        // Auto-Ranking Status
        const leaderboard = getCachedLeaderboard();

        return res.json({
            success: true,
            systemHealth,
            recentPayments,
            metricsHistory,
            rankingEngine: {
                status: 'AUTO_ENGINE_ACTIVE',
                lastRankedAt: leaderboard.lastUpdated,
                evaluatedDonorsCount: leaderboard.stats.totalDonationsEvaluated,
                topRankedAmount: leaderboard.stats.topDonorAmount,
                allTimeCount: leaderboard.allTimeTop.length,
                monthlyCount: leaderboard.monthlyTop.length
            }
        });
    } catch (err) {
        console.error('developer-metrics error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch developer metrics' });
    }
});

// POST /api/admin/dev-action/recalculate-rankings — Force Auto-Ranking from Developer Panel
router.post('/dev-action/recalculate-rankings', async (req, res) => {
    try {
        const start = Date.now();
        const result = await autoRankDonors();
        const durationMs = Date.now() - start;

        return res.json({
            success: true,
            message: `Auto-ranking completed in ${durationMs}ms`,
            durationMs,
            lastRankedAt: result.lastUpdated,
            rankedDonors: result.stats.totalDonorsRanked,
            topAmount: result.stats.topDonorAmount
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to execute auto-ranking' });
    }
});

// POST /api/admin/dev-action/test-db — Diagnostic DB Latency Test
router.post('/dev-action/test-db', async (req, res) => {
    try {
        const start = Date.now();
        let count = 0;
        let mode = 'memory';
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            count = await User.countDocuments().maxTimeMS(1000);
            mode = 'mongodb';
        } else {
            count = (memoryStore.profiles?.length || 0) + (memoryStore.users?.length || 0);
        }
        const latencyMs = Date.now() - start;

        return res.json({
            success: true,
            message: `Database diagnostic query succeeded (${mode})`,
            latencyMs,
            totalUsersFound: count,
            mode
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'DB diagnostic test failed: ' + err.message });
    }
});

// POST /api/admin/dev-action/test-email — Diagnostic SMTP Test & Multi-Template Dispatcher
router.post('/dev-action/test-email', async (req, res) => {
    try {
        const targetEmail = req.body.email || process.env.EMAIL_USER || 'contact@kirancharitabletrust.org';
        const templateId = String(req.body.templateId || '1').toLowerCase();
        const previewOnly = Boolean(req.body.previewOnly);
        const customData = req.body.data || {};
        const mockData = getMockDataForTemplate(templateId, { email: targetEmail, ...customData });

        // Map template IDs to dispatch functions and filenames
        const templateMap = {
            '1': { file: '01_otp_verification.html', name: 'OTP Verification', fn: () => sendOtpEmail(targetEmail, mockData.otp, mockData.full_name) },
            '01': { file: '01_otp_verification.html', name: 'OTP Verification', fn: () => sendOtpEmail(targetEmail, mockData.otp, mockData.full_name) },
            'otp': { file: '01_otp_verification.html', name: 'OTP Verification', fn: () => sendOtpEmail(targetEmail, mockData.otp, mockData.full_name) },

            '2': { file: '02_volunteer_welcome.html', name: 'Volunteer Welcome', fn: () => sendVolunteerWelcomeEmail({ name: mockData.full_name, email: targetEmail, uniqueId: mockData.volunteer_id, phone: mockData.phone, membershipFee: '100' }) },
            '02': { file: '02_volunteer_welcome.html', name: 'Volunteer Welcome', fn: () => sendVolunteerWelcomeEmail({ name: mockData.full_name, email: targetEmail, uniqueId: mockData.volunteer_id, phone: mockData.phone, membershipFee: '100' }) },
            'volunteer': { file: '02_volunteer_welcome.html', name: 'Volunteer Welcome', fn: () => sendVolunteerWelcomeEmail({ name: mockData.full_name, email: targetEmail, uniqueId: mockData.volunteer_id, phone: mockData.phone, membershipFee: '100' }) },

            '3': { file: '03_trust_member_welcome.html', name: 'Trust Member Welcome', fn: () => sendTrustMemberWelcomeEmail({ name: mockData.full_name, email: targetEmail, memberId: mockData.member_id, idCardNo: mockData.id_card_number }) },
            '03': { file: '03_trust_member_welcome.html', name: 'Trust Member Welcome', fn: () => sendTrustMemberWelcomeEmail({ name: mockData.full_name, email: targetEmail, memberId: mockData.member_id, idCardNo: mockData.id_card_number }) },
            'member': { file: '03_trust_member_welcome.html', name: 'Trust Member Welcome', fn: () => sendTrustMemberWelcomeEmail({ name: mockData.full_name, email: targetEmail, memberId: mockData.member_id, idCardNo: mockData.id_card_number }) },

            '4': { file: '04_payment_success_80g_receipt.html', name: 'Successful Donation 80G Receipt', fn: () => sendPaymentSuccessEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, receiptNumber: mockData.receipt_number, transactionId: mockData.transaction_id, purpose: mockData.purpose }) },
            '04': { file: '04_payment_success_80g_receipt.html', name: 'Successful Donation 80G Receipt', fn: () => sendPaymentSuccessEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, receiptNumber: mockData.receipt_number, transactionId: mockData.transaction_id, purpose: mockData.purpose }) },
            'payment_success': { file: '04_payment_success_80g_receipt.html', name: 'Successful Donation 80G Receipt', fn: () => sendPaymentSuccessEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, receiptNumber: mockData.receipt_number, transactionId: mockData.transaction_id, purpose: mockData.purpose }) },

            '5': { file: '05_payment_failure.html', name: 'Payment Failed Notice', fn: () => sendPaymentFailureEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, reason: mockData.failure_reason, transactionId: mockData.transaction_id }) },
            '05': { file: '05_payment_failure.html', name: 'Payment Failed Notice', fn: () => sendPaymentFailureEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, reason: mockData.failure_reason, transactionId: mockData.transaction_id }) },
            'payment_failure': { file: '05_payment_failure.html', name: 'Payment Failed Notice', fn: () => sendPaymentFailureEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, reason: mockData.failure_reason, transactionId: mockData.transaction_id }) },

            '6': { file: '06_payment_pending.html', name: 'Payment Pending Notice', fn: () => sendPaymentPendingEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, transactionId: mockData.transaction_id, purpose: mockData.purpose }) },
            '06': { file: '06_payment_pending.html', name: 'Payment Pending Notice', fn: () => sendPaymentPendingEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, transactionId: mockData.transaction_id, purpose: mockData.purpose }) },
            'payment_pending': { file: '06_payment_pending.html', name: 'Payment Pending Notice', fn: () => sendPaymentPendingEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, transactionId: mockData.transaction_id, purpose: mockData.purpose }) },

            '7': { file: '07_monthly_reminder.html', name: 'Monthly AutoPay Reminder', fn: () => sendMonthlyReminderEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, dueDate: new Date(), subscriptionId: mockData.subscription_id, autopayStatus: mockData.autopay_status }) },
            '07': { file: '07_monthly_reminder.html', name: 'Monthly AutoPay Reminder', fn: () => sendMonthlyReminderEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, dueDate: new Date(), subscriptionId: mockData.subscription_id, autopayStatus: mockData.autopay_status }) },
            'monthly_reminder': { file: '07_monthly_reminder.html', name: 'Monthly AutoPay Reminder', fn: () => sendMonthlyReminderEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, dueDate: new Date(), subscriptionId: mockData.subscription_id, autopayStatus: mockData.autopay_status }) },

            '8': { file: '08_30day_renewal_reminder.html', name: '30-Day Renewal Reminder', fn: () => send30DayRenewalReminderEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, dueDate: new Date(), memberId: mockData.member_id }) },
            '08': { file: '08_30day_renewal_reminder.html', name: '30-Day Renewal Reminder', fn: () => send30DayRenewalReminderEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, dueDate: new Date(), memberId: mockData.member_id }) },
            'renewal': { file: '08_30day_renewal_reminder.html', name: '30-Day Renewal Reminder', fn: () => send30DayRenewalReminderEmail({ name: mockData.full_name, email: targetEmail, amount: mockData.amount, dueDate: new Date(), memberId: mockData.member_id }) },

            '9': { file: '09_30day_impact_update.html', name: '30-Day Impact Update', fn: () => send30DayImpactUpdateEmail({ name: mockData.full_name, email: targetEmail, educationImpact: mockData.education_impact_update, nutritionImpact: mockData.nutrition_impact_update, communityImpact: mockData.community_impact_update, studentsSupported: mockData.students_supported, mealsDistributed: mockData.meals_distributed, activitiesCompleted: mockData.activities_completed, volunteersInvolved: mockData.volunteers_involved }) },
            '09': { file: '09_30day_impact_update.html', name: '30-Day Impact Update', fn: () => send30DayImpactUpdateEmail({ name: mockData.full_name, email: targetEmail, educationImpact: mockData.education_impact_update, nutritionImpact: mockData.nutrition_impact_update, communityImpact: mockData.community_impact_update, studentsSupported: mockData.students_supported, mealsDistributed: mockData.meals_distributed, activitiesCompleted: mockData.activities_completed, volunteersInvolved: mockData.volunteers_involved }) },
            'impact': { file: '09_30day_impact_update.html', name: '30-Day Impact Update', fn: () => send30DayImpactUpdateEmail({ name: mockData.full_name, email: targetEmail, educationImpact: mockData.education_impact_update, nutritionImpact: mockData.nutrition_impact_update, communityImpact: mockData.community_impact_update, studentsSupported: mockData.students_supported, mealsDistributed: mockData.meals_distributed, activitiesCompleted: mockData.activities_completed, volunteersInvolved: mockData.volunteers_involved }) },

            '10': { file: '10_custom_donor_announcement.html', name: 'Custom Donor Announcement', fn: () => sendCustomDonorAnnouncementEmail({ name: mockData.full_name, email: targetEmail, title: mockData.announcement_title, description: mockData.announcement_description, programName: mockData.program_name, eventDate: mockData.event_date, eventTime: mockData.event_time, eventLocation: mockData.event_location, purpose: mockData.initiative_purpose }) },
            'custom': { file: '10_custom_donor_announcement.html', name: 'Custom Donor Announcement', fn: () => sendCustomDonorAnnouncementEmail({ name: mockData.full_name, email: targetEmail, title: mockData.announcement_title, description: mockData.announcement_description, programName: mockData.program_name, eventDate: mockData.event_date, eventTime: mockData.event_time, eventLocation: mockData.event_location, purpose: mockData.initiative_purpose }) }
        };

        // If previewOnly is requested, render and return HTML without sending SMTP
        if (previewOnly) {
            const entry = templateMap[templateId] || templateMap['1'];
            const renderedHtml = renderTemplate(entry.file, mockData);
            return res.json({
                success: true,
                previewOnly: true,
                templateName: entry.name,
                fileName: entry.file,
                html: renderedHtml,
                data: mockData
            });
        }

        // If 'all' is requested, sequentially dispatch all 10 templates
        if (templateId === 'all') {
            const distinctKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            const results = [];
            for (const key of distinctKeys) {
                const entry = templateMap[key];
                try {
                    const result = await entry.fn();
                    results.push({ id: key, name: entry.name, success: !!result.success, result });
                } catch (err) {
                    results.push({ id: key, name: entry.name, success: false, error: err.message });
                }
            }
            return res.json({
                success: results.every(r => r.success),
                targetEmail,
                totalDispatched: results.length,
                results
            });
        }

        const selected = templateMap[templateId] || templateMap['1'];
        const dispatchResult = await selected.fn();

        return res.json({
            success: !!dispatchResult.success,
            templateName: selected.name,
            targetEmail,
            dispatchResult,
            message: dispatchResult.success
                ? `Diagnostic test email ("${selected.name}") dispatched to ${targetEmail}`
                : `SMTP dispatch notice: ${dispatchResult.error || 'Check server logs'}`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Email diagnostic failed: ' + err.message });
    }
});

// GET /api/admin/payments — Payments and Transaction History
router.get('/payments', async (req, res) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;
        let payments = [];
        let total = 0;

        try {
            if (mongoose.connection.readyState === 1) {
                const filter = status ? { status } : {};
                const skip = (Number(page) - 1) * Number(limit);
                payments = await Donation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).maxTimeMS(1000);
                total = await Donation.countDocuments(filter).maxTimeMS(1000);
            }
        } catch (e) {
            console.warn('DB payments fetch notice:', e.message);
        }

        if (payments.length === 0 && memoryStore.payments) {
            const filtered = status ? memoryStore.payments.filter(p => p.status === status) : memoryStore.payments;
            const skip = (Number(page) - 1) * Number(limit);
            payments = filtered.slice(skip, skip + Number(limit));
            total = filtered.length;
        }

        return res.json({
            success: true,
            total,
            page: Number(page),
            payments
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
});

// GET /api/admin/trust-members — Manage Trust Members (with trash & suspension metadata)
router.get('/trust-members', async (req, res) => {
    try {
        let members = [];
        try {
            if (mongoose.connection.readyState === 1) {
                // Auto-cleanup: remove members in trash beyond 30 days
                await TrustMember.deleteMany({
                    isDeleted: true,
                    scheduledPermanentDeleteAt: { $lte: new Date() }
                }).catch(() => {});

                members = await TrustMember.find().sort({ isDeleted: 1, createdAt: -1 }).maxTimeMS(1000);
            }
        } catch (e) {
            members = memoryStore.trust_members || [];
        }

        // Add memory store fallback members if not in DB
        if (memoryStore.trust_members && memoryStore.trust_members.length > 0) {
            const existingEmails = new Set(members.map(m => m.email?.toLowerCase()));
            for (const mem of memoryStore.trust_members) {
                if (!existingEmails.has(mem.email?.toLowerCase())) {
                    members.push(mem);
                    existingEmails.add(mem.email?.toLowerCase());
                }
            }
        }

        // Also check profiles for role === 'trust_member'
        if (memoryStore.profiles) {
            const existingEmails = new Set(members.map(m => m.email?.toLowerCase()));
            for (const p of memoryStore.profiles) {
                if (p.role === 'trust_member' && !existingEmails.has(p.email?.toLowerCase())) {
                    const memberObj = {
                        _id: p.id || 'mem_' + p.email.replace(/[^a-z0-9]/g, '_'),
                        memberId: p.memberId || 'KCT-MEM-1032',
                        name: p.name || 'Verified Member',
                        email: p.email,
                        phone: p.phone || '',
                        address: p.address || 'Mandepudi, Palnadu, AP',
                        aadharNumber: p.aadharNumber || 'XXXX-XXXX-1032',
                        panNumber: p.panNumber || '',
                        profilePhoto: p.avatar || '',
                        donationAmount: p.donationAmount || 500,
                        subscriptionTier: p.subscriptionTier || 'Starter Member (₹500/mo)',
                        approvalStatus: p.isDeleted ? 'deleted' : (p.status || 'active'),
                        isDeleted: Boolean(p.isDeleted || p.status === 'deleted' || p.status === 'trash'),
                        deletedAt: p.deletedAt || null,
                        scheduledPermanentDeleteAt: p.scheduledPermanentDeleteAt || null,
                        totalDonated: p.totalDonated || 500,
                        donationCount: p.donationCount || 1,
                        createdAt: p.created_at || p.createdAt || new Date()
                    };
                    members.push(memberObj);
                    if (!memoryStore.trust_members) memoryStore.trust_members = [];
                    memoryStore.trust_members.push(memberObj);
                }
            }
        }

        // Calculate days left in 30-day trash
        const formatted = members.map(m => {
            const obj = m.toObject ? m.toObject() : { ...m };
            let daysLeftInTrash = null;
            if (obj.isDeleted && obj.scheduledPermanentDeleteAt) {
                const diffMs = new Date(obj.scheduledPermanentDeleteAt).getTime() - Date.now();
                daysLeftInTrash = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            }
            return {
                ...obj,
                daysLeftInTrash
            };
        });

        return res.json({ success: true, count: formatted.length, members: formatted });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch trust members' });
    }
});

// Helper: locate trust member by Mongo _id, memberId, or email
async function findTrustMemberFlexible(id) {
    if (!id) return null;
    const strId = String(id).trim();
    const lowerId = strId.toLowerCase();

    if (mongoose.connection.readyState === 1) {
        try {
            if (mongoose.Types.ObjectId.isValid(strId)) {
                const found = await TrustMember.findById(strId).maxTimeMS(800);
                if (found) return found;
            }
            const byCode = await TrustMember.findOne({
                $or: [{ memberId: strId }, { email: lowerId }]
            }).maxTimeMS(800);
            if (byCode) return byCode;
        } catch (e) {}
    }

    // Check memoryStore.trust_members
    if (memoryStore.trust_members) {
        const found = memoryStore.trust_members.find(m => 
            m.memberId === strId || 
            m.email?.toLowerCase() === lowerId || 
            m._id === strId || 
            m.id === strId
        );
        if (found) return found;
    }

    // Check memoryStore.profiles
    if (memoryStore.profiles) {
        const prof = memoryStore.profiles.find(p => 
            p.email?.toLowerCase() === lowerId || 
            p.id === strId || 
            p.memberId === strId
        );
        if (prof) {
            return {
                ...prof,
                memberId: prof.memberId || 'KCT-MEM-1032',
                email: prof.email,
                name: prof.name
            };
        }
    }
    return null;
}

// POST /api/admin/trust-members — Create a new trust member manually from Admin Panel
router.post('/trust-members', async (req, res) => {
    try {
        const {
            name, email, phone, role = 'Member', subscriptionTier = 'Starter Member',
            donationAmount = 500, totalDonated = 500, address = 'Guntur, Andhra Pradesh',
            aadharNumber = '123456789012', panNumber = '', profilePhoto = '', approvalStatus = 'active'
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const memberId = 'KCT-MEM-' + Math.floor(1000 + Math.random() * 9000);
        const numAmount = Math.max(1, Number(donationAmount) || 500);
        const numTotal = Math.max(0, Number(totalDonated) || numAmount);

        let newMember = null;
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                newMember = await TrustMember.create({
                    memberId,
                    name,
                    email: normalizedEmail,
                    phone: phone || '',
                    role,
                    subscriptionTier,
                    donationAmount: numAmount,
                    totalDonated: numTotal,
                    address,
                    aadharNumber,
                    panNumber,
                    profilePhoto,
                    approvalStatus,
                    isDeleted: false,
                    joinDate: new Date()
                });
            } catch (dbErr) {
                console.warn('DB create member warning:', dbErr.message);
            }
        }

        const memObj = {
            id: 'mem_' + Date.now(),
            _id: 'mem_' + Date.now(),
            memberId,
            name,
            email: normalizedEmail,
            phone: phone || '',
            role,
            subscriptionTier,
            donationAmount: numAmount,
            totalDonated: numTotal,
            address,
            aadharNumber,
            panNumber,
            profilePhoto,
            approvalStatus,
            isDeleted: false,
            createdAt: new Date(),
            joinDate: new Date()
        };

        if (!memoryStore.trust_members) memoryStore.trust_members = [];
        memoryStore.trust_members.unshift(memObj);
        persistMemoryStore();

        return res.json({
            success: true,
            message: `Trust member ${name} (${memberId}) created successfully.`,
            member: newMember || memObj
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to create trust member: ' + err.message });
    }
});

// PUT /api/admin/trust-members/:id — Edit existing trust member details
router.put('/trust-members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        const {
            name, email, phone, role, subscriptionTier, donationAmount,
            totalDonated, address, aadharNumber, panNumber, profilePhoto, approvalStatus
        } = req.body;

        let member = await findTrustMemberFlexible(id);
        const normalizedEmail = (email || member?.email || '').toLowerCase().trim();

        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const query = mongoose.Types.ObjectId.isValid(strId)
                    ? { _id: strId }
                    : { $or: [{ memberId: strId }, { email: lowerId }] };

                const updateFields = {};
                if (name !== undefined) updateFields.name = name;
                if (normalizedEmail) updateFields.email = normalizedEmail;
                if (phone !== undefined) updateFields.phone = phone;
                if (role !== undefined) updateFields.role = role;
                if (subscriptionTier !== undefined) updateFields.subscriptionTier = subscriptionTier;
                if (donationAmount !== undefined) updateFields.donationAmount = Number(donationAmount);
                if (totalDonated !== undefined) updateFields.totalDonated = Number(totalDonated);
                if (address !== undefined) updateFields.address = address;
                if (aadharNumber !== undefined) updateFields.aadharNumber = aadharNumber;
                if (panNumber !== undefined) updateFields.panNumber = panNumber;
                if (profilePhoto !== undefined) updateFields.profilePhoto = profilePhoto;
                if (approvalStatus !== undefined) updateFields.approvalStatus = approvalStatus;

                await TrustMember.findOneAndUpdate(query, { $set: updateFields }, { new: true });
            } catch (dbErr) {
                console.warn('DB update member warning:', dbErr.message);
            }
        }

        // Update in memoryStore
        if (memoryStore.trust_members) {
            const memIdx = memoryStore.trust_members.findIndex(m =>
                m.memberId === strId || m.email?.toLowerCase() === lowerId || m._id === strId || m.id === strId
            );
            if (memIdx >= 0) {
                memoryStore.trust_members[memIdx] = {
                    ...memoryStore.trust_members[memIdx],
                    ...(name !== undefined && { name }),
                    ...(normalizedEmail && { email: normalizedEmail }),
                    ...(phone !== undefined && { phone }),
                    ...(role !== undefined && { role }),
                    ...(subscriptionTier !== undefined && { subscriptionTier }),
                    ...(donationAmount !== undefined && { donationAmount: Number(donationAmount) }),
                    ...(totalDonated !== undefined && { totalDonated: Number(totalDonated) }),
                    ...(address !== undefined && { address }),
                    ...(aadharNumber !== undefined && { aadharNumber }),
                    ...(panNumber !== undefined && { panNumber }),
                    ...(profilePhoto !== undefined && { profilePhoto }),
                    ...(approvalStatus !== undefined && { approvalStatus })
                };
            }
        }
        persistMemoryStore();

        return res.json({
            success: true,
            message: `Trust member details updated successfully.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update member details: ' + err.message });
    }
});

// PUT /api/admin/trust-members/:id/status — Approve or Update Trust Member Status
router.put('/trust-members/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body; // 'active' | 'suspended' | 'pending'
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();

        let member = await findTrustMemberFlexible(id);
        let userEmail = (member?.email || (lowerId.includes('@') ? lowerId : '')).toLowerCase().trim();

        if (member) {
            member.approvalStatus = status;
            if (notes) member.notes = notes;
            if (typeof member.save === 'function') {
                await member.save().catch(() => {});
            }
        }

        if (memoryStore.trust_members) {
            const mem = memoryStore.trust_members.find(m => m.memberId === strId || m.email?.toLowerCase() === userEmail || m._id === strId || m.id === strId);
            if (mem) mem.approvalStatus = status;
        }
        if (userEmail && memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => p.email?.toLowerCase() === userEmail);
            if (prof) prof.status = status;
        }
        persistMemoryStore();

        return res.json({
            success: true,
            message: `Trust member status updated to ${status}`,
            member: member || { memberId: strId, approvalStatus: status }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update member status' });
    }
});

// PUT /api/admin/trust-members/:id/suspend — Toggle Suspend / Active status
router.put('/trust-members/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();

        let member = await findTrustMemberFlexible(id);
        let userEmail = (member?.email || (lowerId.includes('@') ? lowerId : '')).toLowerCase().trim();
        if (!userEmail) {
            const mMatch = (memoryStore.trust_members || []).find(m => m.memberId === strId || m._id === strId || m.id === strId);
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.memberId === strId);
            userEmail = (mMatch?.email || pMatch?.email || '').toLowerCase().trim();
        }

        const currentStatus = member?.approvalStatus || 'active';
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        if (member) {
            member.approvalStatus = newStatus;
            if (newStatus === 'suspended') {
                member.suspensionReason = reason || 'Suspended by Trust Administrator';
            } else {
                member.suspensionReason = null;
            }
            if (typeof member.save === 'function') {
                await member.save().catch(() => {});
            }
        }

        if (memoryStore.trust_members) {
            const mem = memoryStore.trust_members.find(m => m.memberId === strId || m.email?.toLowerCase() === userEmail || m._id === strId || m.id === strId);
            if (mem) {
                mem.approvalStatus = newStatus;
                mem.suspensionReason = newStatus === 'suspended' ? (reason || 'Suspended by Trust Administrator') : null;
            }
        }
        if (userEmail && memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => p.email?.toLowerCase() === userEmail);
            if (prof) prof.status = newStatus;
        }
        persistMemoryStore();

        return res.json({
            success: true,
            message: newStatus === 'suspended' ? `Trust member ${member?.name || userEmail || id} suspended.` : `Trust member ${member?.name || userEmail || id} reactivated.`,
            member: member || { memberId: strId, approvalStatus: newStatus }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to toggle member suspension' });
    }
});

// PUT /api/admin/trust-members/:id/soft-delete — Move to 30-day Trash (Soft Delete)
router.put('/trust-members/:id/soft-delete', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        const now = new Date();
        const scheduledDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let member = await findTrustMemberFlexible(id);
        let userEmail = (member?.email || (lowerId.includes('@') ? lowerId : '')).toLowerCase().trim();
        if (!userEmail) {
            const mMatch = (memoryStore.trust_members || []).find(m => m.memberId === strId || m._id === strId || m.id === strId);
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.memberId === strId);
            userEmail = (mMatch?.email || pMatch?.email || '').toLowerCase().trim();
        }

        if (member) {
            member.isDeleted = true;
            member.approvalStatus = 'deleted';
            member.deletedAt = now;
            member.scheduledPermanentDeleteAt = scheduledDate;
            if (typeof member.save === 'function') {
                await member.save().catch(() => {});
            }
        }

        // Also soft-delete corresponding User in MongoDB
        if (userEmail && mongoose.connection.readyState === 1) {
            try {
                await User.updateMany(
                    { email: userEmail },
                    { $set: { isDeleted: true, status: 'deleted', deletedAt: now, scheduledPermanentDeleteAt: scheduledDate } }
                );
            } catch (uErr) {}
        }

        // Also synchronize in memoryStore
        if (memoryStore.trust_members) {
            const mem = memoryStore.trust_members.find(m => m.memberId === strId || m.email?.toLowerCase() === userEmail || m._id === strId || m.id === strId);
            if (mem) {
                mem.isDeleted = true;
                mem.approvalStatus = 'deleted';
                mem.deletedAt = now;
                mem.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        if (userEmail && memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => p.email?.toLowerCase() === userEmail || p.id === strId || p._id === strId);
            if (prof) {
                prof.isDeleted = true;
                prof.status = 'deleted';
                prof.deletedAt = now;
                prof.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        if (userEmail && memoryStore.users) {
            const u = memoryStore.users.find(ur => ur.email?.toLowerCase() === userEmail || ur.id === strId || ur._id === strId);
            if (u) {
                u.isDeleted = true;
                u.status = 'deleted';
                u.deletedAt = now;
                u.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        persistMemoryStore();

        return res.json({
            success: true,
            isLoggedOut: true,
            message: `Trust member ${member?.name || userEmail || id} moved to 30-day trash bin. Member session terminated immediately. Scheduled for permanent deletion on ${scheduledDate.toLocaleDateString('en-IN')}. Can be restored anytime during the 30-day window.`,
            member: member || { memberId: strId, isDeleted: true }
        });
    } catch (err) {
        console.error('SOFT DELETE ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to soft delete member: ' + err.message });
    }
});

// PUT /api/admin/trust-members/:id/restore — Restore member from 30-day Trash
router.put('/trust-members/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();

        let member = await findTrustMemberFlexible(id);
        let userEmail = (member?.email || (lowerId.includes('@') ? lowerId : '')).toLowerCase().trim();
        if (!userEmail) {
            const mMatch = (memoryStore.trust_members || []).find(m => m.memberId === strId || m._id === strId || m.id === strId);
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.memberId === strId);
            userEmail = (mMatch?.email || pMatch?.email || '').toLowerCase().trim();
        }

        if (member) {
            member.isDeleted = false;
            member.approvalStatus = 'active';
            member.deletedAt = null;
            member.scheduledPermanentDeleteAt = null;
            if (typeof member.save === 'function') {
                await member.save().catch(() => {});
            }
        }

        if (userEmail && mongoose.connection.readyState === 1) {
            try {
                await User.updateMany(
                    { email: userEmail },
                    { $set: { isDeleted: false, status: 'active', deletedAt: null, scheduledPermanentDeleteAt: null } }
                );
            } catch (uErr) {}
        }

        if (memoryStore.trust_members) {
            const mem = memoryStore.trust_members.find(m => m.memberId === strId || m.email?.toLowerCase() === userEmail || m._id === strId || m.id === strId);
            if (mem) {
                mem.isDeleted = false;
                mem.approvalStatus = 'active';
                mem.deletedAt = null;
                mem.scheduledPermanentDeleteAt = null;
            }
        }
        if (userEmail && memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => p.email?.toLowerCase() === userEmail || p.id === strId || p._id === strId);
            if (prof) {
                prof.isDeleted = false;
                prof.status = 'active';
                prof.deletedAt = null;
                prof.scheduledPermanentDeleteAt = null;
            }
        }
        if (userEmail && memoryStore.users) {
            const u = memoryStore.users.find(ur => ur.email?.toLowerCase() === userEmail || ur.id === strId || ur._id === strId);
            if (u) {
                u.isDeleted = false;
                u.status = 'active';
                u.deletedAt = null;
                u.scheduledPermanentDeleteAt = null;
            }
        }
        persistMemoryStore();

        return res.json({
            success: true,
            message: `Trust member ${member?.name || userEmail || id} successfully restored from trash. Account is now active.`,
            member: member || { memberId: strId, isDeleted: false, approvalStatus: 'active' }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to restore member' });
    }
});

// DELETE /api/admin/trust-members/:id/permanent — Immediately and permanently purge member record
router.delete('/trust-members/:id/permanent', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        let targetEmail = lowerId.includes('@') ? lowerId : '';

        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                let deleted = null;
                if (mongoose.Types.ObjectId.isValid(strId)) {
                    deleted = await TrustMember.findByIdAndDelete(strId);
                }
                if (!deleted) {
                    deleted = await TrustMember.findOneAndDelete({
                        $or: [{ memberId: strId }, { email: lowerId }]
                    });
                }
                if (deleted?.email) targetEmail = deleted.email.toLowerCase().trim();

                if (targetEmail) {
                    await User.deleteMany({ email: targetEmail }).catch(() => {});
                }
            } catch (dbErr) {
                console.warn('DB permanent delete notice:', dbErr.message);
            }
        }

        // Also check memoryStore to get email if not resolved yet
        if (!targetEmail) {
            const mMatch = (memoryStore.trust_members || []).find(m => m.memberId === strId || m._id === strId || m.id === strId || m.email?.toLowerCase() === lowerId);
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.email?.toLowerCase() === lowerId);
            targetEmail = (mMatch?.email || pMatch?.email || '').toLowerCase().trim();
        }

        // Purge completely from memoryStore
        if (memoryStore.trust_members) {
            memoryStore.trust_members = memoryStore.trust_members.filter(m => 
                m.memberId !== strId && 
                m._id !== strId && 
                m.id !== strId && 
                (!targetEmail || m.email?.toLowerCase() !== targetEmail)
            );
        }
        if (memoryStore.profiles) {
            memoryStore.profiles = memoryStore.profiles.filter(p => 
                p.id !== strId && 
                p._id !== strId && 
                (!targetEmail || p.email?.toLowerCase() !== targetEmail)
            );
        }
        if (memoryStore.users) {
            memoryStore.users = memoryStore.users.filter(u => 
                u.id !== strId && 
                u._id !== strId && 
                (!targetEmail || u.email?.toLowerCase() !== targetEmail)
            );
        }
        persistMemoryStore();

        // REGULATORY AUDIT SAFEGUARD:
        // Under CBDT Form 10BE and Section 80G(5)(vi) Income Tax auditing mandates,
        // Donation & payment records are PERMANENTLY PRESERVED and NEVER DELETED under any circumstances.

        return res.json({
            success: true,
            message: `Trust member profile removed. All historical donation and 80G tax records remain permanently preserved for regulatory audit compliance.`
        });
    } catch (err) {
        console.error('⚠️ Permanent delete member error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to permanently delete member' });
    }
});

// DELETE /api/admin/trust-members/:id — Generic Delete alias (moves to 30-day trash)
router.delete('/trust-members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        const now = new Date();
        const scheduledDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let member = await findTrustMemberFlexible(id);
        let userEmail = (member?.email || (lowerId.includes('@') ? lowerId : '')).toLowerCase().trim();
        if (!userEmail) {
            const mMatch = (memoryStore.trust_members || []).find(m => m.memberId === strId || m._id === strId || m.id === strId);
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.memberId === strId);
            userEmail = (mMatch?.email || pMatch?.email || '').toLowerCase().trim();
        }

        if (member) {
            member.isDeleted = true;
            member.approvalStatus = 'deleted';
            member.deletedAt = now;
            member.scheduledPermanentDeleteAt = scheduledDate;
            if (typeof member.save === 'function') {
                await member.save().catch(() => {});
            }
        }

        if (memoryStore.trust_members) {
            const mem = memoryStore.trust_members.find(m => m.memberId === strId || m.email?.toLowerCase() === userEmail || m._id === strId || m.id === strId);
            if (mem) {
                mem.isDeleted = true;
                mem.approvalStatus = 'deleted';
                mem.deletedAt = now;
                mem.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        if (userEmail && memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => p.email?.toLowerCase() === userEmail || p.id === strId || p._id === strId);
            if (prof) {
                prof.isDeleted = true;
                prof.status = 'deleted';
                prof.deletedAt = now;
                prof.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        persistMemoryStore();

        return res.json({
            success: true,
            isLoggedOut: true,
            message: 'Trust member moved to 30-day trash bin.'
        });

        return res.json({
            success: true,
            message: 'Trust member moved to 30-day trash bin.'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete trust member' });
    }
});

// GET /api/admin/schedules — View All Monthly Schedules, 30-Day Dues & Engine Status
router.get('/schedules', async (req, res) => {
    try {
        const schedules = await getNormalizedSchedules();
        const schedulerStatus = await getSchedulerStatus();
        return res.json({ 
            success: true, 
            count: schedules.length, 
            schedules,
            schedulerStatus
        });
    } catch (err) {
        console.error('Failed to fetch schedules:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
    }
});

// GET /api/admin/schedules/status — Current status of automated 30-day background engine
router.get('/schedules/status', async (req, res) => {
    try {
        const status = await getSchedulerStatus();
        return res.json({ success: true, status });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch scheduler status' });
    }
});

// POST /api/admin/schedules/run-scheduler — Manually trigger 30-day automated check now
router.post('/schedules/run-scheduler', async (req, res) => {
    try {
        const log = await run30DayReminderCheck();
        return res.json({
            success: true,
            message: `Automated 30-day check executed. Dispatched: ${log.dispatchedCount}, Skipped: ${log.skippedCount}.`,
            log
        });
    } catch (err) {
        console.error('Run scheduler error:', err);
        return res.status(500).json({ success: false, message: 'Failed to run 30-day scheduler check: ' + err.message });
    }
});

// POST /api/admin/schedules/batch-send — Send reminders to selected schedules with template selection
router.post('/schedules/batch-send', async (req, res) => {
    try {
        const { scheduleIds, templateType, customSubject, customMessage } = req.body;
        if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one schedule to send emails.' });
        }

        const result = await sendBatchCustomReminders({
            scheduleIds,
            templateType: templateType || 'renewal_reminder',
            customSubject,
            customMessage
        });

        return res.json({
            success: true,
            message: `Successfully processed ${result.dispatchedCount} emails out of ${scheduleIds.length} selected.`,
            result
        });
    } catch (err) {
        console.error('Batch send error:', err);
        return res.status(500).json({ success: false, message: 'Failed to dispatch batch emails: ' + err.message });
    }
});

// POST /api/admin/batch-reminders — Dispatch Monthly Reminders (backward compatibility)
router.post('/batch-reminders', async (req, res) => {
    try {
        const { scheduleIds } = req.body || {};
        if (scheduleIds && Array.isArray(scheduleIds) && scheduleIds.length > 0) {
            const result = await sendBatchCustomReminders({
                scheduleIds,
                templateType: 'renewal_reminder'
            });
            return res.json({
                success: true,
                message: `Successfully processed reminders. Dispatched to ${result.dispatchedCount} members.`,
                sentCount: result.dispatchedCount
            });
        }

        const log = await run30DayReminderCheck();
        return res.json({
            success: true,
            message: `Successfully processed reminders. Dispatched to ${log.dispatchedCount} members.`,
            sentCount: log.dispatchedCount
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to run batch reminders' });
    }
});

// POST /api/admin/payments/:id/resend-receipt — Re-dispatches official Form 10BE 80G Tax Exemption Receipt
router.post('/payments/:id/resend-receipt', async (req, res) => {
    try {
        const { id } = req.params;
        let donation = null;
        if (mongoose.connection.readyState === 1) {
            donation = await Donation.findOne({
                $or: [
                    mongoose.Types.ObjectId.isValid(id) ? { _id: id } : null,
                    { transactionId: id },
                    { sabpaisaTxnId: id },
                    { receiptNumber: id }
                ].filter(Boolean)
            });
        }
        if (!donation) {
            donation = memoryStore.payments.find(p => p._id === id || p.transactionId === id || p.receiptNumber === id);
        }
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Transaction record not found' });
        }
        if (!donation.email) {
            return res.status(400).json({ success: false, message: 'No donor email attached to this transaction.' });
        }

        const emailResult = await sendPaymentSuccessEmail({
            name: donation.fullName || 'Valued Donor',
            email: donation.email,
            mobile: donation.mobile,
            address: donation.address,
            amount: donation.amount,
            receiptNumber: donation.receiptNumber || `KCT-${Date.now()}`,
            transactionId: donation.sabpaisaTxnId || donation.transactionId,
            clientTxnId: donation.transactionId,
            purpose: donation.purpose || 'General Philanthropy',
            donorCategory: donation.donorCategory || 'general_donation',
            date: donation.createdAt || new Date()
        });

        return res.json({
            success: true,
            message: `Official Form 10BE 80G Tax Exemption Receipt re-dispatched to ${donation.email}`,
            emailResult
        });
    } catch (err) {
        console.error('Receipt resend error:', err);
        return res.status(500).json({ success: false, message: 'Failed to dispatch receipt: ' + err.message });
    }
});

// PUT /api/admin/payments/:id/status — Update payment status manually
router.put('/payments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        let donation = null;
        if (mongoose.connection.readyState === 1) {
            donation = await Donation.findOne({
                $or: [
                    mongoose.Types.ObjectId.isValid(id) ? { _id: id } : null,
                    { transactionId: id },
                    { receiptNumber: id }
                ].filter(Boolean)
            });
            if (donation) {
                donation.status = status;
                if (notes) donation.adminNotes = notes;
                if (status === 'success' && !donation.receiptNumber) {
                    donation.receiptNumber = `KCT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
                }
                await donation.save();
            }
        }

        if (!donation) {
            const memP = memoryStore.payments.find(p => p._id === id || p.transactionId === id);
            if (memP) {
                memP.status = status;
                donation = memP;
            }
        }

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Transaction record not found' });
        }

        // If changed to success, send 80G certificate
        if (status === 'success' && donation.email) {
            sendPaymentSuccessEmail({
                name: donation.fullName || 'Valued Donor',
                email: donation.email,
                mobile: donation.mobile,
                address: donation.address,
                amount: donation.amount,
                receiptNumber: donation.receiptNumber || `KCT-${Date.now()}`,
                transactionId: donation.sabpaisaTxnId || donation.transactionId,
                clientTxnId: donation.transactionId,
                purpose: donation.purpose,
                donorCategory: donation.donorCategory
            }).catch(e => console.warn('Receipt dispatch notice:', e.message));
        }

        persistMemoryStore();
        autoRankDonors().catch(err => console.warn('Ranking sync notice:', err.message));

        return res.json({
            success: true,
            message: `Transaction status updated to ${status.toUpperCase()}`,
            donation
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update transaction status' });
    }
});

// POST /api/admin/donations (and /api/admin/payments) — Add/Record a new donation manually
router.post(['/donations', '/payments'], async (req, res) => {
    try {
        const {
            fullName, email, mobile, amount, purpose = 'General Philanthropy',
            paymentMethod = 'Online Payment', paymentMode, transactionId,
            panNumber, pan, address = 'Guntur, Andhra Pradesh', status = 'completed',
            donationDate, date, createdAt
        } = req.body;

        if (!fullName || !amount) {
            return res.status(400).json({ success: false, message: 'Donor name and amount are required.' });
        }

        const numAmount = Math.max(1, Number(amount) || 100);
        const txnId = transactionId || 'TXN-KCT-' + Date.now();
        const receiptNo = 'KCT-80G-' + Date.now().toString().slice(-6);
        const activeStatus = (status === 'success' || status === 'completed') ? 'completed' : status;
        const entryDate = (donationDate || date || createdAt) ? new Date(donationDate || date || createdAt) : new Date();

        let newDonation = null;
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                newDonation = await Donation.create({
                    fullName,
                    email: email || '',
                    mobile: mobile || '',
                    amount: numAmount,
                    purpose,
                    paymentMethod: paymentMethod || paymentMode || 'Online Payment',
                    paymentMode: paymentMode || paymentMethod || 'online',
                    transactionId: txnId,
                    clientTxnId: txnId,
                    receiptNumber: receiptNo,
                    panNumber: panNumber || pan || '',
                    address,
                    status: activeStatus,
                    createdAt: entryDate
                });
            } catch (dbErr) {
                console.warn('DB create donation warning:', dbErr.message);
            }
        }

        const memObj = {
            id: 'don_' + Date.now(),
            _id: 'don_' + Date.now(),
            fullName,
            email: email || '',
            mobile: mobile || '',
            amount: numAmount,
            purpose,
            paymentMethod: paymentMethod || paymentMode || 'Online Payment',
            paymentMode: paymentMode || paymentMethod || 'online',
            transactionId: txnId,
            clientTxnId: txnId,
            receiptNumber: receiptNo,
            panNumber: panNumber || pan || '',
            address,
            status: activeStatus,
            createdAt: entryDate,
            date: entryDate
        };

        if (!memoryStore.payments) memoryStore.payments = [];
        memoryStore.payments.unshift(memObj);
        persistMemoryStore();
        autoRankDonors().catch(err => console.warn('Ranking sync notice:', err.message));

        return res.json({
            success: true,
            message: `Donation of ₹${numAmount} recorded successfully. Receipt #${receiptNo}`,
            donation: newDonation || memObj
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to record donation: ' + err.message });
    }
});

// PUT /api/admin/donations/:id (and /api/admin/payments/:id) — Edit existing donation details
router.put(['/donations/:id', '/payments/:id/edit'], async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const {
            fullName, email, mobile, amount, purpose, paymentMethod,
            paymentMode, transactionId, panNumber, pan, address, status, receiptNumber,
            donationDate, date, createdAt
        } = req.body;

        const updateDate = (donationDate || date || createdAt) ? new Date(donationDate || date || createdAt) : null;

        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const query = mongoose.Types.ObjectId.isValid(strId)
                    ? { _id: strId }
                    : { $or: [{ transactionId: strId }, { clientTxnId: strId }, { receiptNumber: strId }] };

                const updateFields = {};
                if (fullName !== undefined) updateFields.fullName = fullName;
                if (email !== undefined) updateFields.email = email;
                if (mobile !== undefined) updateFields.mobile = mobile;
                if (amount !== undefined) updateFields.amount = Number(amount);
                if (purpose !== undefined) updateFields.purpose = purpose;
                if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;
                if (paymentMode !== undefined) updateFields.paymentMode = paymentMode;
                if (transactionId !== undefined) updateFields.transactionId = transactionId;
                if (panNumber !== undefined || pan !== undefined) updateFields.panNumber = panNumber || pan;
                if (address !== undefined) updateFields.address = address;
                if (status !== undefined) updateFields.status = status;
                if (receiptNumber !== undefined) updateFields.receiptNumber = receiptNumber;
                if (updateDate && !isNaN(updateDate.getTime())) {
                    updateFields.createdAt = updateDate;
                }

                await Donation.findOneAndUpdate(query, { $set: updateFields });
            } catch (dbErr) {
                console.warn('DB update donation warning:', dbErr.message);
            }
        }

        // Update in memoryStore
        if (memoryStore.payments) {
            const donIdx = memoryStore.payments.findIndex(p =>
                p._id === strId || p.id === strId || p.transactionId === strId || p.clientTxnId === strId || p.receiptNumber === strId
            );
            if (donIdx >= 0) {
                memoryStore.payments[donIdx] = {
                    ...memoryStore.payments[donIdx],
                    ...(fullName !== undefined && { fullName }),
                    ...(email !== undefined && { email }),
                    ...(mobile !== undefined && { mobile }),
                    ...(amount !== undefined && { amount: Number(amount) }),
                    ...(purpose !== undefined && { purpose }),
                    ...(paymentMethod !== undefined && { paymentMethod }),
                    ...(paymentMode !== undefined && { paymentMode }),
                    ...(transactionId !== undefined && { transactionId }),
                    ...(panNumber !== undefined && { panNumber }),
                    ...(address !== undefined && { address }),
                    ...(status !== undefined && { status }),
                    ...(receiptNumber !== undefined && { receiptNumber }),
                    ...(updateDate && !isNaN(updateDate.getTime()) && { createdAt: updateDate, date: updateDate })
                };
            }
        }
        persistMemoryStore();
        autoRankDonors().catch(err => console.warn('Ranking sync notice:', err.message));

        return res.json({
            success: true,
            message: 'Donation record updated successfully.'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update donation: ' + err.message });
    }
});

// GET /api/admin/payments/export-csv — Streams clean CSV of all transactions
router.get('/payments/export-csv', async (req, res) => {
    try {
        let payments = [];
        if (mongoose.connection.readyState === 1) {
            payments = await Donation.find().sort({ createdAt: -1 }).limit(1000).lean();
        } else {
            payments = memoryStore.payments;
        }

        const headers = ['Receipt No', 'Transaction ID', 'Donor Name', 'Email', 'Mobile', 'Amount (INR)', 'Purpose', 'Status', 'Date'];
        const rows = payments.map(p => [
            p.receiptNumber || 'N/A',
            p.transactionId || p.sabpaisaTxnId || 'N/A',
            `"${(p.fullName || '').replace(/"/g, '""')}"`,
            p.email || 'N/A',
            p.mobile || 'N/A',
            p.amount || 0,
            `"${(p.purpose || 'General Donation').replace(/"/g, '""')}"`,
            p.status || 'pending',
            p.createdAt ? new Date(p.createdAt).toISOString() : ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="kct-donations-${Date.now()}.csv"`);
        return res.status(200).send(csvContent);
    } catch (err) {
        return res.status(500).json({ success: false, message: 'CSV export failed' });
    }
});

// GET /api/admin/users — List and filter users with trash/suspension status
router.get('/users', async (req, res) => {
    try {
        const { search, role, statusFilter = 'all', limit = 100, page = 1 } = req.query;
        let users = [];
        let total = 0;

        if (mongoose.connection.readyState === 1) {
            // Auto-cleanup: Permanently remove users that have been in 30-day trash beyond their scheduled deletion date
            try {
                await User.deleteMany({
                    isDeleted: true,
                    scheduledPermanentDeleteAt: { $lte: new Date() }
                }).maxTimeMS(1000);
            } catch (cleanupErr) {
                console.warn('Trash auto-cleanup notice:', cleanupErr.message);
            }

            const query = {};
            if (role && role !== 'all') query.role = role;

            if (statusFilter === 'active') {
                query.isDeleted = { $ne: true };
                query.status = { $ne: 'suspended' };
            } else if (statusFilter === 'suspended') {
                query.status = 'suspended';
                query.isDeleted = { $ne: true };
            } else if (statusFilter === 'trash') {
                query.isDeleted = true;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (Number(page) - 1) * Number(limit);
            users = await User.find(query, '-password').sort({ isDeleted: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
            total = await User.countDocuments(query);
        } else {
            const rawUsers = (memoryStore.profiles && memoryStore.profiles.length > 0) ? memoryStore.profiles : (memoryStore.users || []);
            let filtered = rawUsers;
            if (role && role !== 'all') {
                filtered = filtered.filter(u => u.role === role);
            }
            if (statusFilter === 'active') {
                filtered = filtered.filter(u => !u.isDeleted && u.status !== 'suspended');
            } else if (statusFilter === 'suspended') {
                filtered = filtered.filter(u => !u.isDeleted && u.status === 'suspended');
            } else if (statusFilter === 'trash') {
                filtered = filtered.filter(u => u.isDeleted || u.status === 'trash' || u.status === 'deleted');
            }
            if (search && search.trim()) {
                const q = search.trim().toLowerCase();
                filtered = filtered.filter(u => (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)));
            }
            total = filtered.length;
            const skip = (Number(page) - 1) * Number(limit);
            users = filtered.slice(skip, skip + Number(limit)).map(({ password, ...u }) => ({
                _id: u.id || u._id || ('usr_' + (u.email || Math.random())),
                name: u.name || u.fullName || 'User',
                email: u.email,
                role: u.role || 'user',
                status: u.isDeleted ? 'deleted' : (u.status || 'active'),
                isDeleted: Boolean(u.isDeleted || u.status === 'deleted' || u.status === 'trash'),
                createdAt: u.createdAt || u.created_at || new Date().toISOString()
            }));
        }

        // Calculate days left in 30-day trash for soft-deleted accounts
        const enrichedUsers = users.map(u => {
            let daysLeftInTrash = null;
            if (u.isDeleted && u.scheduledPermanentDeleteAt) {
                const diffMs = new Date(u.scheduledPermanentDeleteAt).getTime() - Date.now();
                daysLeftInTrash = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            }
            return {
                ...u,
                daysLeftInTrash
            };
        });

        return res.json({
            success: true,
            total,
            page: Number(page),
            users: enrichedUsers
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id/suspend — Toggle Suspend / Active status
router.put('/users/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
            user.status = newStatus;
            if (newStatus === 'suspended') {
                user.suspensionReason = reason || 'Suspended by Trust Administrator';
            } else {
                user.suspensionReason = '';
            }
            await user.save();

            return res.json({
                success: true,
                message: newStatus === 'suspended' ? `Account suspended for ${user.email}` : `Account restored to active for ${user.email}`,
                user: {
                    id: user._id,
                    email: user.email,
                    status: user.status,
                    suspensionReason: user.suspensionReason
                }
            });
        }
        return res.status(500).json({ success: false, message: 'Database not connected' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update suspension status' });
    }
});

// PUT /api/admin/users/:id/soft-delete — Move user to 30-day Trash (Soft Delete)
router.put('/users/:id/soft-delete', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        const now = new Date();
        const scheduledDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period

        let user = null;
        let userEmail = (lowerId.includes('@') ? lowerId : '').toLowerCase().trim();

        if (mongoose.connection.readyState === 1) {
            try {
                if (mongoose.Types.ObjectId.isValid(strId)) {
                    user = await User.findById(strId);
                }
                if (!user && strId) {
                    user = await User.findOne({ email: lowerId });
                }
            } catch (e) {}
        }

        if (!userEmail) {
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.email?.toLowerCase() === lowerId);
            const uMatch = (memoryStore.users || []).find(u => u.id === strId || u._id === strId || u.email?.toLowerCase() === lowerId);
            const tmMatch = (memoryStore.trust_members || []).find(tm => tm.memberId === strId || tm.id === strId || tm._id === strId);
            userEmail = (user?.email || pMatch?.email || uMatch?.email || tmMatch?.email || '').toLowerCase().trim();
        }

        if (user) {
            userEmail = (user.email || userEmail).toLowerCase().trim();
            user.isDeleted = true;
            user.status = 'deleted';
            user.deletedAt = now;
            user.scheduledPermanentDeleteAt = scheduledDate;
            if (typeof user.save === 'function') {
                await user.save().catch(() => {});
            }
        }

        // Also soft-delete corresponding TrustMember in MongoDB
        if (userEmail && mongoose.connection.readyState === 1) {
            try {
                await TrustMember.updateMany(
                    { email: userEmail },
                    { $set: { isDeleted: true, approvalStatus: 'deleted', deletedAt: now, scheduledPermanentDeleteAt: scheduledDate } }
                );
            } catch (tmErr) {}
        }

        // Synchronize in memoryStore
        if (memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => (userEmail && p.email?.toLowerCase() === userEmail) || p.id === strId || p._id === strId);
            if (prof) {
                prof.isDeleted = true;
                prof.status = 'deleted';
                prof.deletedAt = now;
                prof.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        if (memoryStore.users) {
            const u = memoryStore.users.find(ur => (userEmail && ur.email?.toLowerCase() === userEmail) || ur.id === strId || ur._id === strId);
            if (u) {
                u.isDeleted = true;
                u.status = 'deleted';
                u.deletedAt = now;
                u.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        if (memoryStore.trust_members) {
            const tm = memoryStore.trust_members.find(m => (userEmail && m.email?.toLowerCase() === userEmail) || m.memberId === strId || m._id === strId || m.id === strId);
            if (tm) {
                tm.isDeleted = true;
                tm.approvalStatus = 'deleted';
                tm.deletedAt = now;
                tm.scheduledPermanentDeleteAt = scheduledDate;
            }
        }
        persistMemoryStore();

        return res.json({
            success: true,
            isLoggedOut: true,
            message: `User ${userEmail || id} moved to 30-day trash bin. Active session terminated immediately. Scheduled for permanent deletion on ${scheduledDate.toLocaleDateString('en-IN')}. Can be restored anytime during the 30-day window.`,
            user: user || { id: strId, email: userEmail, isDeleted: true }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to soft delete user' });
    }
});

// PUT /api/admin/users/:id/restore — Restore user from 30-day Trash
router.put('/users/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        let user = null;
        let userEmail = (lowerId.includes('@') ? lowerId : '').toLowerCase().trim();

        if (mongoose.connection.readyState === 1) {
            try {
                if (mongoose.Types.ObjectId.isValid(strId)) {
                    user = await User.findById(strId);
                }
                if (!user && strId) {
                    user = await User.findOne({ email: lowerId });
                }
            } catch (e) {}
        }

        if (!userEmail) {
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.email?.toLowerCase() === lowerId);
            const uMatch = (memoryStore.users || []).find(u => u.id === strId || u._id === strId || u.email?.toLowerCase() === lowerId);
            const tmMatch = (memoryStore.trust_members || []).find(tm => tm.memberId === strId || tm.id === strId || tm._id === strId);
            userEmail = (user?.email || pMatch?.email || uMatch?.email || tmMatch?.email || '').toLowerCase().trim();
        }

        if (user) {
            userEmail = (user.email || userEmail).toLowerCase().trim();
            user.isDeleted = false;
            user.status = 'active';
            user.deletedAt = null;
            user.scheduledPermanentDeleteAt = null;
            if (typeof user.save === 'function') {
                await user.save().catch(() => {});
            }
        }

        // Also restore corresponding TrustMember
        if (userEmail && mongoose.connection.readyState === 1) {
            try {
                await TrustMember.updateMany(
                    { email: userEmail },
                    { $set: { isDeleted: false, approvalStatus: 'active', deletedAt: null, scheduledPermanentDeleteAt: null } }
                );
            } catch (tmErr) {}
        }

        // Synchronize in memoryStore
        if (memoryStore.profiles) {
            const prof = memoryStore.profiles.find(p => (userEmail && p.email?.toLowerCase() === userEmail) || p.id === strId || p._id === strId);
            if (prof) {
                prof.isDeleted = false;
                prof.status = 'active';
                prof.deletedAt = null;
                prof.scheduledPermanentDeleteAt = null;
            }
        }
        if (memoryStore.users) {
            const u = memoryStore.users.find(ur => (userEmail && ur.email?.toLowerCase() === userEmail) || ur.id === strId || ur._id === strId);
            if (u) {
                u.isDeleted = false;
                u.status = 'active';
                u.deletedAt = null;
                u.scheduledPermanentDeleteAt = null;
            }
        }
        if (memoryStore.trust_members) {
            const tm = memoryStore.trust_members.find(m => (userEmail && m.email?.toLowerCase() === userEmail) || m.memberId === strId || m._id === strId || m.id === strId);
            if (tm) {
                tm.isDeleted = false;
                tm.approvalStatus = 'active';
                tm.deletedAt = null;
                tm.scheduledPermanentDeleteAt = null;
            }
        }
        persistMemoryStore();

        return res.json({
            success: true,
            message: `User ${userEmail || id} successfully restored from trash. Account is now active.`,
            user: user || { id: strId, email: userEmail, isDeleted: false, status: 'active' }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to restore user' });
    }
});

// DELETE /api/admin/users/:id/permanent — Immediately and permanently purge user record
router.delete('/users/:id/permanent', async (req, res) => {
    try {
        const { id } = req.params;
        const strId = String(id).trim();
        const lowerId = strId.toLowerCase();
        let targetEmail = lowerId.includes('@') ? lowerId : '';

        // REGULATORY AUDIT SAFEGUARD:
        // Under CBDT Form 10BE and Section 80G(5)(vi) Income Tax auditing mandates,
        // Donation & payment records are PERMANENTLY PRESERVED and NEVER DELETED under any circumstances.
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                let deleted = null;
                if (mongoose.Types.ObjectId.isValid(strId)) {
                    deleted = await User.findByIdAndDelete(strId);
                }
                if (!deleted) {
                    deleted = await User.findOneAndDelete({ email: lowerId });
                }
                if (deleted?.email) targetEmail = deleted.email.toLowerCase().trim();

                if (targetEmail) {
                    await TrustMember.deleteMany({ email: targetEmail }).catch(() => {});
                }
            } catch (dbErr) {
                console.warn('DB user permanent delete notice:', dbErr.message);
            }
        }

        if (!targetEmail) {
            const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.email?.toLowerCase() === lowerId);
            const uMatch = (memoryStore.users || []).find(u => u.id === strId || u._id === strId || u.email?.toLowerCase() === lowerId);
            const tmMatch = (memoryStore.trust_members || []).find(tm => tm.memberId === strId || tm.id === strId || tm._id === strId);
            targetEmail = (pMatch?.email || uMatch?.email || tmMatch?.email || '').toLowerCase().trim();
        }

        // Purge completely from memoryStore
        if (memoryStore.users) {
            memoryStore.users = memoryStore.users.filter(u => u._id !== strId && u.id !== strId && (!targetEmail || u.email?.toLowerCase() !== targetEmail));
        }
        if (memoryStore.profiles) {
            memoryStore.profiles = memoryStore.profiles.filter(p => p._id !== strId && p.id !== strId && (!targetEmail || p.email?.toLowerCase() !== targetEmail));
        }
        if (memoryStore.trust_members) {
            memoryStore.trust_members = memoryStore.trust_members.filter(m => m.memberId !== strId && m._id !== strId && m.id !== strId && (!targetEmail || m.email?.toLowerCase() !== targetEmail));
        }
        persistMemoryStore();

        return res.json({
            success: true,
            message: `User record ${targetEmail || id} permanently purged. All historical donation and 80G tax records remain permanently preserved for regulatory audit compliance.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to permanently delete user' });
    }
});

// PUT /api/admin/users/:id/role — Change User Role
router.put('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['admin', 'trust_member', 'volunteer', 'donor'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        if (mongoose.connection.readyState === 1) {
            const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            return res.json({ success: true, message: `User role updated to ${role}`, user });
        } else {
            const u = (memoryStore.users || []).find(x => x._id === id || x.id === id);
            if (u) {
                u.role = role;
                return res.json({ success: true, message: `User role updated to ${role}`, user: u });
            }
        }
        return res.status(404).json({ success: false, message: 'User not found' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
});

// PUT /api/admin/users/:id/reset-password — Reset user password
router.put('/users/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (mongoose.connection.readyState === 1) {
            const user = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true }).select('-password');
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            return res.json({ success: true, message: `Password for ${user.email} reset successfully.` });
        } else {
            const u = (memoryStore.users || []).find(x => x._id === id || x.id === id);
            if (u) {
                u.password = hashedPassword;
                return res.json({ success: true, message: `Password for ${u.email} reset successfully.` });
            }
        }
        return res.status(404).json({ success: false, message: 'User not found' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

// DELETE /api/admin/users/:id — Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (mongoose.connection.readyState === 1) {
            await User.findByIdAndDelete(id);
        } else {
            memoryStore.users = (memoryStore.users || []).filter(u => u._id !== id && u.id !== id);
        }
        return res.json({ success: true, message: 'User record deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

module.exports = router;
