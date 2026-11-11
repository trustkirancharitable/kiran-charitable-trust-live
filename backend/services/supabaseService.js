const fs = require('fs');
const path = require('path');

let createClient = null;
try {
    const sb = require('@supabase/supabase-js');
    createClient = sb.createClient;
} catch (e) {
    // Graceful fallback if @supabase/supabase-js is not installed
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseClient = null;

function getSupabase() {
    if (!createClient) return null;
    if (!supabaseClient && SUPABASE_URL && SUPABASE_KEY) {
        try {
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: false }
            });
            console.log('⚡ Supabase client initialized cleanly');
        } catch (e) {
            console.warn('⚠️ Supabase init notice:', e.message);
        }
    }
    return supabaseClient;
}

// Local file store for resilient offline persistence across restarts
const STORE_FILE = path.join(__dirname, '..', 'data', 'local_store.json');

const DEFAULT_TRUST_MEMBERS = [
    {
        _id: 'mem_kiran_chairman',
        memberId: 'KCT-TR-001',
        name: 'Pallepogu Kiranbabu',
        email: 'kiran@kirancharitabletrust.org',
        phone: '9876543210',
        role: 'Founder & Chairman',
        city: 'Mandepudi',
        state: 'Andhra Pradesh',
        address: 'Mandepudi, Palnadu, Andhra Pradesh',
        profilePhoto: '/src/assets/Pallepogu Kiranbabu Chairman.jpeg',
        subscriptionTier: 'Patron Trustee (₹5,000/mo)',
        donationAmount: 5000,
        totalDonated: 50000,
        donationCount: 10,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
        _id: 'mem_raviteja_vice',
        memberId: 'KCT-TR-002',
        name: 'Konda Ravi Teja',
        email: 'raviteja@kirancharitabletrust.org',
        phone: '9876543211',
        role: 'Vice Chairman',
        city: 'Palnadu',
        state: 'Andhra Pradesh',
        address: 'Palnadu, Andhra Pradesh',
        profilePhoto: '/src/assets/Konda Ravi Teja Vice Chairman.png',
        subscriptionTier: 'Executive Trustee (₹2,500/mo)',
        donationAmount: 2500,
        totalDonated: 25000,
        donationCount: 10,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-01-05T00:00:00.000Z'
    },
    {
        _id: 'mem_rakesh_treasurer',
        memberId: 'KCT-TR-003',
        name: 'Srungarapati Rakesh',
        email: 'rakesh@kirancharitabletrust.org',
        phone: '9876543212',
        role: 'Treasurer',
        city: 'Narasaraopet',
        state: 'Andhra Pradesh',
        address: 'Narasaraopet, Andhra Pradesh',
        profilePhoto: '/src/assets/Srungarapati Rakesh Treasurer.jpeg',
        subscriptionTier: 'Executive Trustee (₹2,500/mo)',
        donationAmount: 2500,
        totalDonated: 25000,
        donationCount: 10,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-01-08T00:00:00.000Z'
    },
    {
        _id: 'mem_bharath_exec',
        memberId: 'KCT-TR-004',
        name: 'Konda Ravi Bharath',
        email: 'bharath@kirancharitabletrust.org',
        phone: '9876543213',
        role: 'Executive Member',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        address: 'Guntur, Andhra Pradesh',
        profilePhoto: '/src/assets/Konda Ravi Bharath Executive.png',
        subscriptionTier: 'Executive Member (₹1,000/mo)',
        donationAmount: 1000,
        totalDonated: 12000,
        donationCount: 12,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-01-10T00:00:00.000Z'
    },
    {
        _id: 'mem_subbarao_pres',
        memberId: 'KCT-TR-005',
        name: 'Sri P. Subba Rao',
        email: 'subbarao@kirancharitabletrust.org',
        phone: '9876543214',
        role: 'President',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        address: 'Guntur, Andhra Pradesh',
        profilePhoto: '',
        subscriptionTier: 'Executive Trustee (₹2,500/mo)',
        donationAmount: 2500,
        totalDonated: 20000,
        donationCount: 8,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-01-15T00:00:00.000Z'
    },
    {
        _id: 'mem_lakshmidevi_sec',
        memberId: 'KCT-TR-006',
        name: 'Smt. P. Lakshmi Devi',
        email: 'lakshmidevi@kirancharitabletrust.org',
        phone: '9876543215',
        role: 'Secretary',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        address: 'Guntur, Andhra Pradesh',
        profilePhoto: '',
        subscriptionTier: 'Executive Trustee (₹2,500/mo)',
        donationAmount: 2500,
        totalDonated: 20000,
        donationCount: 8,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-01-15T00:00:00.000Z'
    },
    {
        _id: 'mem_fayaz_tech',
        memberId: 'KCT-MEM-1032',
        name: 'Shaik Fayaz',
        email: 'sfayazmr@gmail.com',
        phone: '9392785230',
        role: 'Trust Member',
        city: 'Nandyal',
        state: 'Andhra Pradesh',
        address: 'Nandyal, Andhra Pradesh',
        profilePhoto: '',
        subscriptionTier: 'Silver Member (₹1,000/mo)',
        donationAmount: 1000,
        totalDonated: 5000,
        donationCount: 5,
        approvalStatus: 'active',
        isDeleted: false,
        createdAt: '2024-02-01T00:00:00.000Z'
    }
];

const DEFAULT_MONTHLY_SCHEDULES = [
    {
        _id: 'sch_kiran_01',
        schedule_id: 'SCH-KCT-101',
        scheduleId: 'SCH-KCT-101',
        member_name: 'Pallepogu Kiranbabu',
        memberName: 'Pallepogu Kiranbabu',
        donorName: 'Pallepogu Kiranbabu',
        member_email: 'kiran@kirancharitabletrust.org',
        memberEmail: 'kiran@kirancharitabletrust.org',
        email: 'kiran@kirancharitabletrust.org',
        amount: 2500,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        reminder_count: 0,
        reminderCount: 0,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: 'sch_raviteja_02',
        schedule_id: 'SCH-KCT-102',
        scheduleId: 'SCH-KCT-102',
        member_name: 'Konda Ravi Teja',
        memberName: 'Konda Ravi Teja',
        donorName: 'Konda Ravi Teja',
        member_email: 'raviteja@kirancharitabletrust.org',
        memberEmail: 'raviteja@kirancharitabletrust.org',
        email: 'raviteja@kirancharitabletrust.org',
        amount: 1000,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        reminder_count: 1,
        reminderCount: 1,
        created_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: 'sch_rakesh_03',
        schedule_id: 'SCH-KCT-103',
        scheduleId: 'SCH-KCT-103',
        member_name: 'Srungarapati Rakesh',
        memberName: 'Srungarapati Rakesh',
        donorName: 'Srungarapati Rakesh',
        member_email: 'rakesh@kirancharitabletrust.org',
        memberEmail: 'rakesh@kirancharitabletrust.org',
        email: 'rakesh@kirancharitabletrust.org',
        amount: 1000,
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'due',
        reminder_count: 1,
        reminderCount: 1,
        created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: 'sch_bharath_04',
        schedule_id: 'SCH-KCT-104',
        scheduleId: 'SCH-KCT-104',
        member_name: 'Konda Ravi Bharath',
        memberName: 'Konda Ravi Bharath',
        donorName: 'Konda Ravi Bharath',
        member_email: 'bharath@kirancharitabletrust.org',
        memberEmail: 'bharath@kirancharitabletrust.org',
        email: 'bharath@kirancharitabletrust.org',
        amount: 500,
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        reminder_count: 0,
        reminderCount: 0,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: 'sch_fayaz_05',
        schedule_id: 'SCH-KCT-105',
        scheduleId: 'SCH-KCT-105',
        member_name: 'Shaik Fayaz',
        memberName: 'Shaik Fayaz',
        donorName: 'Shaik Fayaz',
        member_email: 'sfayazmr@gmail.com',
        memberEmail: 'sfayazmr@gmail.com',
        email: 'sfayazmr@gmail.com',
        amount: 500,
        due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        reminder_count: 0,
        reminderCount: 0,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

let defaultBundledStore = null;
try {
    defaultBundledStore = require('../data/local_store.json');
} catch (e) {
    try {
        defaultBundledStore = require('../../backend/data/local_store.json');
    } catch (e2) {}
}

function loadMemoryStore() {
    try {
        let parsed = null;
        if (fs.existsSync(STORE_FILE)) {
            const raw = fs.readFileSync(STORE_FILE, 'utf8');
            parsed = JSON.parse(raw);
        } else if (defaultBundledStore) {
            parsed = defaultBundledStore;
        }

        if (parsed) {
            const loadedMembers = (parsed.trust_members && parsed.trust_members.length > 0)
                ? parsed.trust_members
                : [...DEFAULT_TRUST_MEMBERS];
            const loadedSchedules = (parsed.monthly_schedules && parsed.monthly_schedules.length > 0)
                ? parsed.monthly_schedules
                : [...DEFAULT_MONTHLY_SCHEDULES];

            let loadedPayments = parsed.payments || [];
            const completedCount = loadedPayments.filter(p => p.status === 'completed').length;
            if (completedCount < 10) {
                try {
                    const { generateSeededDonors } = require('../data/seedDonorsData');
                    if (typeof generateSeededDonors === 'function') {
                        const existingTxnIds = new Set(loadedPayments.map(p => p.transactionId));
                        const seeds = generateSeededDonors().filter(p => !existingTxnIds.has(p.transactionId));
                        loadedPayments = [...loadedPayments, ...seeds];
                    }
                } catch (e) {
                    console.warn('Seeded donors auto-load notice:', e.message);
                }
            }

            return {
                profiles: parsed.profiles || [],
                volunteers: parsed.volunteers || [],
                trust_members: loadedMembers,
                payments: loadedPayments,
                monthly_schedules: loadedSchedules
            };
        }
    } catch (e) {
        console.warn('Local store read notice:', e.message);
    }
    return {
        profiles: [],
        volunteers: [],
        trust_members: [...DEFAULT_TRUST_MEMBERS],
        payments: [],
        monthly_schedules: [...DEFAULT_MONTHLY_SCHEDULES]
    };
}

const memoryStore = loadMemoryStore();

function persistMemoryStore() {
    try {
        const dir = path.dirname(STORE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
    } catch (e) {
        // Silent catch for read-only serverless environments
    }
}

// 1. Save or Update User Profile in Supabase
async function syncProfile(user) {
    const sb = getSupabase();
    const payload = {
        email: user.email.toLowerCase().trim(),
        name: user.name || user.fullName || 'User',
        phone: user.phone || user.mobile || '',
        role: user.role || 'donor',
        avatar_url: user.avatarUrl || user.profilePhoto || '',
        auth_provider: user.authProvider || 'email_otp',
        address: user.address || '',
        updated_at: new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('profiles').upsert(payload, { onConflict: 'email' }).select().single();
            if (error) {
                console.warn('Supabase profiles sync notice:', error.message);
            } else {
                console.log(`✅ [Supabase] Synced profile: ${payload.email}`);
                return data || payload;
            }
        } catch (err) {
            console.warn('Supabase profiles exception:', err.message);
        }
    }

    const idx = memoryStore.profiles.findIndex(p => p.email === payload.email);
    if (idx >= 0) memoryStore.profiles[idx] = { ...memoryStore.profiles[idx], ...payload };
    else memoryStore.profiles.push(payload);
    persistMemoryStore();
    return payload;
}

// 2. Save Volunteer in Supabase
async function syncVolunteer(volunteer) {
    const sb = getSupabase();
    const payload = {
        unique_id: volunteer.uniqueId,
        name: volunteer.name,
        email: volunteer.email.toLowerCase().trim(),
        phone: volunteer.phone,
        address: volunteer.address,
        occupation: volunteer.occupation || '',
        skills: volunteer.skills || '',
        availability: volunteer.availability || 'flexible',
        profile_photo: volunteer.profilePhoto || '',
        membership_fee: volunteer.membershipFee || 2500,
        payment_status: volunteer.paymentStatus || 'paid',
        status: volunteer.status || 'active',
        created_at: volunteer.createdAt ? new Date(volunteer.createdAt).toISOString() : new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('volunteers').upsert(payload, { onConflict: 'email' }).select().single();
            if (error) {
                console.warn('Supabase volunteers sync notice:', error.message);
            } else {
                console.log(`✅ [Supabase] Synced volunteer: ${payload.email}`);
                return data || payload;
            }
        } catch (err) {
            console.warn('Supabase volunteers exception:', err.message);
        }
    }

    const idx = memoryStore.volunteers.findIndex(v => v.email === payload.email);
    if (idx >= 0) memoryStore.volunteers[idx] = { ...memoryStore.volunteers[idx], ...payload };
    else memoryStore.volunteers.push(payload);
    persistMemoryStore();
    return payload;
}

// 3. Save Trust Member in Supabase
async function syncTrustMember(member) {
    const sb = getSupabase();
    const payload = {
        member_id: member.memberId,
        name: member.name || member.fullName,
        email: member.email.toLowerCase().trim(),
        phone: member.phone || member.mobile,
        address: member.address,
        aadhar_number: member.aadharNumber,
        pan_number: member.panNumber || '',
        profile_photo: member.profilePhoto || '',
        donation_amount: member.donationAmount || member.amount || 0,
        subscription_tier: member.subscriptionTier || 'Starter',
        payment_schedule: member.paymentSchedule || 'monthly',
        next_payment_due_date: member.nextPaymentDueDate ? new Date(member.nextPaymentDueDate).toISOString() : null,
        approval_status: member.approvalStatus || 'active',
        total_donated: member.totalDonated || member.donationAmount || 0,
        donation_count: member.donationCount || 1,
        show_on_leaderboard: member.showOnLeaderboard !== false,
        created_at: member.createdAt ? new Date(member.createdAt).toISOString() : new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('trust_members').upsert(payload, { onConflict: 'email' }).select().single();
            if (error) {
                console.warn('Supabase trust_members sync notice:', error.message);
            } else {
                console.log(`✅ [Supabase] Synced trust member: ${payload.email} (${payload.member_id})`);
                return data || payload;
            }
        } catch (err) {
            console.warn('Supabase trust_members exception:', err.message);
        }
    }

    const idx = memoryStore.trust_members.findIndex(m => m.email === payload.email);
    if (idx >= 0) memoryStore.trust_members[idx] = { ...memoryStore.trust_members[idx], ...payload };
    else memoryStore.trust_members.push(payload);
    persistMemoryStore();
    return payload;
}

// 4. Save Payment Record in Supabase (Handles SUCCESS, FAILED, PENDING states)
async function syncPayment(payment) {
    const sb = getSupabase();
    const payload = {
        full_name: payment.fullName || payment.name || 'Anonymous Donor',
        email: (payment.email || '').toLowerCase().trim(),
        mobile: payment.mobile || payment.phone || '',
        amount: Number(payment.amount) || 0,
        donor_category: payment.donorCategory || 'general',
        purpose: payment.purpose || 'General Philanthropy',
        payment_method: payment.paymentMethod || 'SabPaisa PG',
        transaction_id: payment.transactionId || payment.pgTxnNo || '',
        client_txn_id: payment.clientTxnId || payment.merchantTxnId || '',
        receipt_number: payment.receiptNumber || `REC-${Date.now()}`,
        status: (payment.status || 'PENDING').toUpperCase(),
        failure_reason: payment.failureReason || payment.error || '',
        is_anonymous: Boolean(payment.isAnonymous),
        profile_photo: payment.profilePhoto || '',
        created_at: payment.createdAt ? new Date(payment.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (sb) {
        try {
            const onConflictKey = payload.receipt_number ? 'receipt_number' : 'client_txn_id';
            const { data, error } = await sb.from('payments').upsert(payload, { onConflict: onConflictKey }).select().single();
            if (error) {
                console.warn('Supabase payments sync notice:', error.message);
            } else {
                console.log(`✅ [Supabase] Synced payment (${payload.status}): ${payload.receipt_number || payload.client_txn_id}`);
                return data || payload;
            }
        } catch (err) {
            console.warn('Supabase payments exception:', err.message);
        }
    }

    // Resilient Local Memory / File Store Fallback
    const existingIdx = memoryStore.payments.findIndex(p => 
        (payload.receipt_number && p.receipt_number === payload.receipt_number) ||
        (payload.client_txn_id && p.client_txn_id === payload.client_txn_id)
    );

    if (existingIdx >= 0) {
        memoryStore.payments[existingIdx] = { ...memoryStore.payments[existingIdx], ...payload };
    } else {
        memoryStore.payments.push(payload);
    }
    persistMemoryStore();
    return payload;
}

// 5. Save Monthly Schedule in Supabase
async function syncMonthlySchedule(schedule) {
    const sb = getSupabase();
    const payload = {
        member_email: schedule.memberEmail.toLowerCase().trim(),
        member_name: schedule.memberName,
        month_year: schedule.monthYear,
        due_date: new Date(schedule.dueDate).toISOString(),
        amount: schedule.amount,
        status: schedule.status || 'pending',
        reminder_count: schedule.reminderCount || 0,
        paid_date: schedule.paidDate ? new Date(schedule.paidDate).toISOString() : null,
        transaction_id: schedule.transactionId || ''
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('monthly_schedules').upsert(payload).select().single();
            if (error) {
                console.warn('Supabase schedules sync notice:', error.message);
            } else {
                return data || payload;
            }
        } catch (err) {
            console.warn('Supabase schedules exception:', err.message);
        }
    }

    memoryStore.monthly_schedules.push(payload);
    persistMemoryStore();
    return payload;
}

// 6. Real-Time Admin Analytics from Supabase / Memory Store
async function getSupabaseAnalytics() {
    const sb = getSupabase();
    let paymentsList = memoryStore.payments;
    let membersList = memoryStore.trust_members;

    if (sb) {
        try {
            const [pRes, mRes] = await Promise.all([
                sb.from('payments').select('*'),
                sb.from('trust_members').select('*')
            ]);
            if (!pRes.error && pRes.data) paymentsList = pRes.data;
            if (!mRes.error && mRes.data) membersList = mRes.data;
        } catch (e) {
            console.warn('Supabase analytics fetch fallback:', e.message);
        }
    }

    const successPayments = paymentsList.filter(p => (p.status || '').toUpperCase() === 'SUCCESS' || (p.status || '').toLowerCase() === 'completed');
    const failedPayments = paymentsList.filter(p => (p.status || '').toUpperCase() === 'FAILED');
    const pendingPayments = paymentsList.filter(p => (p.status || '').toUpperCase() === 'PENDING');

    const totalDonated = successPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalTransactions = paymentsList.length;
    const successRate = totalTransactions > 0 ? ((successPayments.length / totalTransactions) * 100).toFixed(1) : '100.0';

    // Tier distribution
    const tiers = {};
    membersList.forEach(m => {
        const tier = m.subscription_tier || m.subscriptionTier || 'Starter';
        tiers[tier] = (tiers[tier] || 0) + 1;
    });

    return {
        summary: {
            totalDonated,
            totalTransactions,
            successCount: successPayments.length,
            failedCount: failedPayments.length,
            pendingCount: pendingPayments.length,
            successRate: `${successRate}%`,
            totalMembers: membersList.length
        },
        tierDistribution: tiers,
        recentPayments: paymentsList.slice(-10).reverse()
    };
}

/**
 * Returns the SQL setup script to execute in Supabase SQL editor
 */
function getSupabaseSchemaSQL() {
    return `
-- Kiran Charitable Trust - Supabase PostgreSQL Production Schema
-- Run this in the Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'donor',
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'email_otp',
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    occupation TEXT,
    skills TEXT,
    availability TEXT DEFAULT 'flexible',
    profile_photo TEXT,
    membership_fee NUMERIC DEFAULT 2500,
    payment_status TEXT DEFAULT 'paid',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    aadhar_number TEXT NOT NULL,
    pan_number TEXT,
    profile_photo TEXT,
    donation_amount NUMERIC NOT NULL,
    subscription_tier TEXT DEFAULT 'Starter',
    payment_schedule TEXT DEFAULT 'monthly',
    next_payment_due_date TIMESTAMPTZ,
    approval_status TEXT DEFAULT 'active',
    total_donated NUMERIC DEFAULT 0,
    donation_count INT DEFAULT 0,
    show_on_leaderboard BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    client_txn_id TEXT,
    transaction_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT,
    amount NUMERIC NOT NULL,
    donor_category TEXT DEFAULT 'general',
    purpose TEXT DEFAULT 'General Philanthropy',
    payment_method TEXT DEFAULT 'SabPaisa PG',
    status TEXT DEFAULT 'PENDING',
    failure_reason TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    profile_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_email TEXT NOT NULL,
    member_name TEXT NOT NULL,
    month_year TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_date TIMESTAMPTZ,
    transaction_id TEXT,
    reminder_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_client_txn ON payments(client_txn_id);
CREATE INDEX IF NOT EXISTS idx_trust_members_email ON trust_members(email);
CREATE INDEX IF NOT EXISTS idx_trust_members_tier ON trust_members(subscription_tier);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_schedules ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard donors
CREATE POLICY IF NOT EXISTS "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public Read Trust Members" ON trust_members FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public Read Payments" ON payments FOR SELECT USING (true);
    `;
}

module.exports = {
    getSupabase,
    syncProfile,
    syncVolunteer,
    syncTrustMember,
    syncPayment,
    syncMonthlySchedule,
    getSupabaseAnalytics,
    getSupabaseSchemaSQL,
    memoryStore,
    persistMemoryStore
};
