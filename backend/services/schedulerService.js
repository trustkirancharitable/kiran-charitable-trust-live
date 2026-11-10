const mongoose = require('mongoose');
const MonthlySchedule = require('../models/MonthlySchedule');
const { memoryStore, persistMemoryStore } = require('./supabaseService');
const {
    send30DayRenewalReminderEmail,
    send30DayImpactUpdateEmail,
    sendCustomDonorAnnouncementEmail
} = require('./emailService');

let schedulerTimer = null;
let lastRunTimestamp = null;
let nextRunTimestamp = null;
const executionLogs = [];

/**
 * Normalizes all schedule records across MongoDB and memoryStore
 */
async function getNormalizedSchedules() {
    const list = [];
    const seenEmails = new Set();

    // 1. Fetch from MongoDB if available
    if (mongoose.connection.readyState === 1) {
        try {
            const dbSchedules = await MonthlySchedule.find().sort({ dueDate: 1 }).maxTimeMS(1000).lean();
            for (const s of dbSchedules) {
                const em = (s.memberEmail || s.email || '').toLowerCase().trim();
                const due = new Date(s.dueDate || s.due_date || (Date.now() + 30 * 24 * 60 * 60 * 1000));
                const created = new Date(s.createdAt || s.created_at || Date.now());
                const daysRemaining = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const daysSinceCreated = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
                const isDue30Days = daysRemaining <= 0 || daysSinceCreated >= 30;

                list.push({
                    _id: String(s._id),
                    id: String(s._id),
                    scheduleId: s.scheduleId || `SCH-${list.length + 1}`,
                    donorName: s.memberName || s.member_name || s.donorName || 'Monthly Supporter',
                    email: s.memberEmail || s.email || '',
                    amount: Number(s.amount || 500),
                    dueDate: due.toISOString(),
                    daysRemaining,
                    daysSinceCreated,
                    isDue30Days,
                    status: s.status || (isDue30Days ? 'due' : 'pending'),
                    reminderCount: Number(s.reminderCount || 0),
                    lastReminderSentAt: s.lastReminderSentAt || null,
                    createdAt: created.toISOString()
                });
                if (em) seenEmails.add(em);
            }
        } catch (err) {
            console.warn('⚠️ [SCHEDULER] Could not read MonthlySchedule from DB:', err.message);
        }
    }

    // 2. Fetch from memoryStore.monthly_schedules fallback
    const memList = memoryStore.monthly_schedules || [];
    for (let i = 0; i < memList.length; i++) {
        const s = memList[i];
        const em = (s.member_email || s.memberEmail || s.email || '').toLowerCase().trim();
        const sid = s._id || s.id || `SCH-${list.length + 1}`;

        if (!seenEmails.has(em) || !list.some(x => x.email.toLowerCase() === em)) {
            const due = new Date(s.due_date || s.dueDate || (Date.now() + 30 * 24 * 60 * 60 * 1000));
            const created = new Date(s.created_at || s.createdAt || (Date.now() - 30 * 24 * 60 * 60 * 1000));
            const daysRemaining = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const daysSinceCreated = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
            const isDue30Days = daysRemaining <= 0 || daysSinceCreated >= 30;

            list.push({
                _id: String(sid),
                id: String(sid),
                scheduleId: s.schedule_id || sid,
                donorName: s.member_name || s.memberName || s.donorName || 'Monthly Supporter',
                email: s.member_email || s.memberEmail || s.email || '',
                amount: Number(s.amount || 500),
                dueDate: due.toISOString(),
                daysRemaining,
                daysSinceCreated,
                isDue30Days,
                status: s.status || (isDue30Days ? 'due' : 'pending'),
                reminderCount: Number(s.reminder_count || s.reminderCount || 0),
                lastReminderSentAt: s.last_reminder_sent_at || s.lastReminderSentAt || null,
                createdAt: created.toISOString()
            });
            if (em) seenEmails.add(em);
        }
    }

    return list;
}

/**
 * Executes the exact 30-day automated check across all sustaining pledges
 */
async function run30DayReminderCheck() {
    lastRunTimestamp = new Date();
    console.log(`⏰ [SCHEDULER] Running automated 30-day sustaining reminder check at ${lastRunTimestamp.toISOString()}...`);

    const schedules = await getNormalizedSchedules();
    const dispatched = [];
    const skipped = [];
    const errors = [];

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (const item of schedules) {
        if (!item.email || !item.email.includes('@')) {
            skipped.push({ id: item.id, reason: 'No valid email address' });
            continue;
        }

        // Check if 30 days have elapsed or due date is reached
        const dueDateMs = new Date(item.dueDate).getTime();
        const createdDateMs = new Date(item.createdAt).getTime();
        const daysElapsed = Math.floor((now - createdDateMs) / ONE_DAY_MS);
        const isPastDue = now >= dueDateMs;

        // Exactly 30 days check: either due date reached or >= 30 days elapsed since creation
        const isEligibleFor30DayReminder = isPastDue || daysElapsed >= 30;

        if (!isEligibleFor30DayReminder) {
            skipped.push({ id: item.id, email: item.email, reason: `Not yet due (${item.daysRemaining} days remaining)` });
            continue;
        }

        // Rate limit: do not re-send if reminder was sent within the last 24 hours
        if (item.lastReminderSentAt) {
            const lastSentMs = new Date(item.lastReminderSentAt).getTime();
            if (now - lastSentMs < ONE_DAY_MS) {
                skipped.push({ id: item.id, email: item.email, reason: 'Already reminded within past 24 hours' });
                continue;
            }
        }

        try {
            const paymentUrl = `https://www.kirancharitabletrust.org/donate?amount=${item.amount}&email=${encodeURIComponent(item.email)}&name=${encodeURIComponent(item.donorName)}&purpose=Monthly+Sustaining+Pledge`;

            const result = await send30DayRenewalReminderEmail({
                name: item.donorName,
                email: item.email,
                amount: item.amount,
                dueDate: item.dueDate,
                paymentUrl,
                scheduleId: item.scheduleId
            });

            // Update in MongoDB
            if (mongoose.connection.readyState === 1) {
                try {
                    await MonthlySchedule.updateOne(
                        { _id: item.id },
                        {
                            $inc: { reminderCount: 1 },
                            $set: { lastReminderSentAt: new Date(), status: 'due' }
                        }
                    );
                } catch (e) {}
            }

            // Update in memoryStore
            if (memoryStore.monthly_schedules) {
                const mem = memoryStore.monthly_schedules.find(m => 
                    (m._id && String(m._id) === item.id) || 
                    (m.id && String(m.id) === item.id) || 
                    (m.member_email && m.member_email.toLowerCase() === item.email.toLowerCase())
                );
                if (mem) {
                    mem.reminder_count = (mem.reminder_count || 0) + 1;
                    mem.last_reminder_sent_at = new Date();
                    mem.status = 'due';
                }
            }

            dispatched.push({
                scheduleId: item.scheduleId,
                name: item.donorName,
                email: item.email,
                amount: item.amount,
                dueDate: item.dueDate,
                simulated: result.simulated || false
            });
        } catch (sendErr) {
            console.error(`❌ [SCHEDULER] Failed to dispatch to ${item.email}:`, sendErr.message);
            errors.push({ scheduleId: item.scheduleId, email: item.email, error: sendErr.message });
        }
    }

    persistMemoryStore();

    const logEntry = {
        timestamp: lastRunTimestamp,
        totalChecked: schedules.length,
        dispatchedCount: dispatched.length,
        skippedCount: skipped.length,
        errorCount: errors.length,
        dispatched,
        errors
    };

    executionLogs.unshift(logEntry);
    if (executionLogs.length > 25) executionLogs.pop();

    console.log(`✅ [SCHEDULER] 30-Day check complete: ${dispatched.length} dispatched, ${skipped.length} skipped, ${errors.length} errors.`);
    return logEntry;
}

/**
 * Dispatches batch emails to selected schedule IDs using the chosen template
 */
async function sendBatchCustomReminders({ scheduleIds = [], templateType = 'renewal_reminder', customSubject = '', customMessage = '' }) {
    console.log(`📤 [SCHEDULER BATCH] Processing ${scheduleIds.length} target schedules with template: "${templateType}"`);
    const allSchedules = await getNormalizedSchedules();
    const idSet = new Set(scheduleIds.map(String));
    const targets = allSchedules.filter(s => idSet.has(String(s.id)) || idSet.has(String(s._id)) || idSet.has(String(s.scheduleId)));

    const dispatched = [];
    const errors = [];

    for (const item of targets) {
        if (!item.email || !item.email.includes('@')) {
            errors.push({ id: item.id, error: 'Invalid recipient email' });
            continue;
        }

        try {
            const paymentUrl = `https://www.kirancharitabletrust.org/donate?amount=${item.amount}&email=${encodeURIComponent(item.email)}&name=${encodeURIComponent(item.donorName)}&purpose=Monthly+Sustaining+Pledge`;

            let result;
            if (templateType === 'impact_update') {
                result = await send30DayImpactUpdateEmail({
                    name: item.donorName,
                    email: item.email,
                    amount: item.amount,
                    paymentUrl,
                    scheduleId: item.scheduleId
                });
            } else if (templateType === 'custom') {
                result = await sendCustomDonorAnnouncementEmail({
                    name: item.donorName,
                    email: item.email,
                    subject: customSubject || 'Kiran Charitable Trust Community Update',
                    message: customMessage || `Dear ${item.donorName}, thank you for your monthly sustaining support of ₹${item.amount}.`,
                    actionUrl: paymentUrl,
                    actionText: 'Renew Contribution'
                });
            } else {
                // Default: 30-day renewal reminder
                result = await send30DayRenewalReminderEmail({
                    name: item.donorName,
                    email: item.email,
                    amount: item.amount,
                    dueDate: item.dueDate,
                    paymentUrl,
                    scheduleId: item.scheduleId
                });
            }

            // Record update
            if (mongoose.connection.readyState === 1) {
                try {
                    await MonthlySchedule.updateOne(
                        { _id: item.id },
                        {
                            $inc: { reminderCount: 1 },
                            $set: { lastReminderSentAt: new Date() }
                        }
                    );
                } catch (e) {}
            }

            if (memoryStore.monthly_schedules) {
                const mem = memoryStore.monthly_schedules.find(m => 
                    (m._id && String(m._id) === item.id) || 
                    (m.id && String(m.id) === item.id) || 
                    (m.member_email && m.member_email.toLowerCase() === item.email.toLowerCase())
                );
                if (mem) {
                    mem.reminder_count = (mem.reminder_count || 0) + 1;
                    mem.last_reminder_sent_at = new Date();
                }
            }

            dispatched.push({
                scheduleId: item.scheduleId,
                name: item.donorName,
                email: item.email,
                template: templateType,
                simulated: result?.simulated || false
            });
        } catch (err) {
            errors.push({ scheduleId: item.scheduleId, email: item.email, error: err.message });
        }
    }

    persistMemoryStore();

    return {
        success: true,
        totalRequested: scheduleIds.length,
        dispatchedCount: dispatched.length,
        errorCount: errors.length,
        dispatched,
        errors
    };
}

/**
 * Starts the continuous background scheduler
 */
function start30DayReminderScheduler(intervalHours = 1) {
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    nextRunTimestamp = new Date(Date.now() + intervalMs);

    // Initial check 5 seconds after startup
    setTimeout(() => {
        run30DayReminderCheck().catch(err => console.error('Initial scheduler run error:', err));
    }, 5000);

    // Continuous recurring interval
    schedulerTimer = setInterval(() => {
        nextRunTimestamp = new Date(Date.now() + intervalMs);
        run30DayReminderCheck().catch(err => console.error('Interval scheduler run error:', err));
    }, intervalMs);

    console.log(`⏰ [SCHEDULER ENGINE] Started background 30-day sustaining pledge monitor (Checking every ${intervalHours}h).`);
}

/**
 * Returns current scheduler operational status
 */
async function getSchedulerStatus() {
    const schedules = await getNormalizedSchedules();
    const dueCount = schedules.filter(s => s.isDue30Days).length;

    return {
        isActive: Boolean(schedulerTimer),
        checkIntervalHours: 1,
        lastRunTimestamp,
        nextRunTimestamp,
        totalSchedules: schedules.length,
        dueCount,
        recentLogs: executionLogs.slice(0, 5)
    };
}

module.exports = {
    getNormalizedSchedules,
    run30DayReminderCheck,
    sendBatchCustomReminders,
    start30DayReminderScheduler,
    getSchedulerStatus
};
