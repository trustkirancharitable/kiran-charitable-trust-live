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
            console.log('✅ Supabase client initialized');
        } catch (e) {
            console.warn('⚠️ Supabase init notice:', e.message);
        }
    }
    return supabaseClient;
}

// Local file store for resilient offline persistence across restarts
const STORE_FILE = path.join(__dirname, '..', 'data', 'local_store.json');

function loadMemoryStore() {
    try {
        if (fs.existsSync(STORE_FILE)) {
            const raw = fs.readFileSync(STORE_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                profiles: parsed.profiles || [],
                volunteers: parsed.volunteers || [],
                trust_members: parsed.trust_members || [],
                monthly_schedules: parsed.monthly_schedules || [],
                payments: parsed.payments || []
            };
        }
    } catch (e) {
        console.warn('Local store file read warning:', e.message);
    }
    return {
        profiles: [],
        volunteers: [],
        trust_members: [],
        monthly_schedules: [],
        payments: []
    };
}

const memoryStore = loadMemoryStore();

function persistMemoryStore() {
    try {
        const dir = path.dirname(STORE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
    } catch (e) {
        console.warn('Local store file write warning:', e.message);
    }
}

// 1. Save or Update User Profile in Supabase
async function syncProfile(user) {
    const sb = getSupabase();
    const payload = {
        email: user.email.toLowerCase().trim(),
        name: user.name,
        phone: user.phone || '',
        role: user.role || 'donor',
        avatar_url: user.avatar || '',
        auth_provider: user.authProvider || 'email_otp',
        address: user.address || '',
        ...(user.password ? { password: user.password } : {}),
        ...(user.memberId ? { memberId: user.memberId } : {}),
        status: user.status || 'active',
        updated_at: new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('profiles').upsert(payload, { onConflict: 'email' });
            if (error) console.warn('Supabase profiles sync notice:', error.message);
            return data;
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
        occupation: volunteer.occupation,
        skills: volunteer.skills,
        availability: volunteer.availability,
        profile_photo: volunteer.profilePhoto,
        membership_fee: volunteer.membershipFee || 2500,
        payment_status: volunteer.paymentStatus || 'paid',
        status: volunteer.status || 'active',
        created_at: volunteer.createdAt ? new Date(volunteer.createdAt).toISOString() : new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('volunteers').upsert(payload, { onConflict: 'email' });
            if (error) console.warn('Supabase volunteers sync notice:', error.message);
            return data;
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
        name: member.name,
        email: member.email.toLowerCase().trim(),
        phone: member.phone,
        address: member.address,
        aadhar_number: String(member.aadharNumber || ''),
        pan_number: member.panNumber ? String(member.panNumber).toUpperCase().trim() : '',
        profile_photo: member.profilePhoto,
        donation_amount: member.donationAmount,
        subscription_tier: member.subscriptionTier || (member.donationAmount <= 500 ? 'Starter' : member.donationAmount <= 1000 ? 'Silver' : 'Gold'),
        payment_schedule: member.paymentSchedule || 'monthly',
        next_payment_due_date: member.nextPaymentDueDate ? new Date(member.nextPaymentDueDate).toISOString() : null,
        approval_status: member.approvalStatus || 'active',
        total_donated: member.totalDonated || 0,
        donation_count: member.donationCount || 0,
        show_on_leaderboard: member.showOnLeaderboard !== false,
        created_at: member.createdAt ? new Date(member.createdAt).toISOString() : new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('trust_members').upsert(payload, { onConflict: 'email' });
            if (error) console.warn('Supabase trust_members sync notice:', error.message);
            return data;
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

// 4. Save Payment Record in Supabase
async function syncPayment(payment) {
    const sb = getSupabase();
    const payload = {
        full_name: payment.fullName,
        email: payment.email.toLowerCase().trim(),
        mobile: payment.mobile,
        amount: payment.amount,
        donor_category: payment.donorCategory || 'general',
        purpose: payment.purpose || 'General Donation',
        payment_method: payment.paymentMethod || 'SabPaisa',
        transaction_id: payment.transactionId,
        receipt_number: payment.receiptNumber,
        status: payment.status || 'pending',
        is_anonymous: Boolean(payment.isAnonymous),
        profile_photo: payment.profilePhoto || '',
        created_at: payment.createdAt ? new Date(payment.createdAt).toISOString() : new Date().toISOString()
    };

    if (sb) {
        try {
            const { data, error } = await sb.from('payments').upsert(payload, { onConflict: 'receipt_number' });
            if (error) console.warn('Supabase payments sync notice:', error.message);
            return data;
        } catch (err) {
            console.warn('Supabase payments exception:', err.message);
        }
    }

    const idx = memoryStore.payments.findIndex(p => p.receipt_number === payload.receipt_number);
    if (idx >= 0) memoryStore.payments[idx] = { ...memoryStore.payments[idx], ...payload };
    else memoryStore.payments.push(payload);
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
            const { data, error } = await sb.from('monthly_schedules').upsert(payload);
            if (error) console.warn('Supabase schedules sync notice:', error.message);
            return data;
        } catch (err) {
            console.warn('Supabase schedules exception:', err.message);
        }
    }

    memoryStore.monthly_schedules.push(payload);
    persistMemoryStore();
    return payload;
}

/**
 * Returns the SQL setup script to execute in Supabase SQL editor
 */
function getSupabaseSchemaSQL() {
    return `
-- Kiran Charitable Trust - Supabase PostgreSQL Schema
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
    transaction_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT,
    amount NUMERIC NOT NULL,
    donor_category TEXT DEFAULT 'general',
    purpose TEXT DEFAULT 'General Donation',
    payment_method TEXT DEFAULT 'SabPaisa',
    status TEXT DEFAULT 'pending',
    is_anonymous BOOLEAN DEFAULT FALSE,
    profile_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_schedules ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard donors
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Trust Members" ON trust_members FOR SELECT USING (true);
CREATE POLICY "Public Read Payments" ON payments FOR SELECT USING (true);
    `;
}

module.exports = {
    getSupabase,
    syncProfile,
    syncVolunteer,
    syncTrustMember,
    syncPayment,
    syncMonthlySchedule,
    getSupabaseSchemaSQL,
    memoryStore,
    persistMemoryStore
};
