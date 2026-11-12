const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const TrustMember = require('../models/TrustMember');
const MonthlySchedule = require('../models/MonthlySchedule');
const User = require('../models/User');
const PerformanceMetric = require('../models/PerformanceMetric');
const upload = require('../services/uploadService');
const { uploadPhotoToR2 } = require('../services/cloudflareR2Service');
const { syncTrustMember, syncProfile, syncMonthlySchedule, memoryStore, persistMemoryStore, fetchSupabaseTrustMembers } = require('../services/supabaseService');
const { sendTrustMemberWelcomeEmail, sendMonthlyReminderEmail } = require('../services/emailService');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Helper to record performance metric count
async function recordRegistrationMetric(type) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const update = {
            $inc: {
                totalRegistrations: 1,
                ...(type === 'trust_member' ? { trustMemberRegistrations: 1 } : { volunteerRegistrations: 1 })
            },
            $set: { updatedAt: new Date() }
        };
        await PerformanceMetric.findOneAndUpdate({ date: todayStr }, update, { upsert: true }).catch(() => {});
    } catch (e) {
        console.warn('Metric recording notice:', e.message);
    }
}

// POST /api/trust-members/register — Register Trust Member / Complete Member Profile
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
    try {
        const {
            email, phone, password, address, aadharNumber, panNumber, donationAmount, subscriptionTier
        } = req.body;
        const name = req.body.name || req.body.fullName;

        if (!name || !email || !phone || !address || !aadharNumber) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, phone, address, and Aadhaar number are required.'
            });
        }

        let profilePhotoUrl = req.body.profilePhotoUrl || req.body.profilePhoto || '';
        if (!req.file && !profilePhotoUrl) {
            return res.status(400).json({
                success: false,
                message: 'Profile photo is mandatory. Please upload a clear photo.'
            });
        }

        const cleanAadhar = String(aadharNumber).replace(/\D/g, '');
        if (cleanAadhar.length !== 12) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 12-digit Aadhaar number.'
            });
        }

        const cleanPan = panNumber ? String(panNumber).toUpperCase().trim() : '';
        const normalizedEmail = email.toLowerCase().trim();
        const numAmount = Math.max(1, Number(donationAmount) || 1);

        // Resolve Subscription Tier (1 Re Test, 500 Starter, 1000 Silver, 2500 Gold, or Custom)
        const tier = subscriptionTier || (
            numAmount < 500 ? `Member Tier (₹${numAmount}/mo)` :
            numAmount <= 500 ? 'Starter Member (₹500/mo)' :
            numAmount <= 1000 ? 'Silver Member (₹1,000/mo)' :
            numAmount <= 2500 ? 'Gold Member (₹2,500/mo)' : 'Diamond / Custom Member'
        );

        // Upload Profile Photo to Cloudflare R2 (with local fallback)
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const fileName = `trust_member_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
            try {
                profilePhotoUrl = await uploadPhotoToR2(req.file.buffer, fileName, req.file.mimetype);
            } catch (r2Err) {
                console.warn('R2 upload notice:', r2Err.message);
                profilePhotoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            }
        }

        // Check if member already registered (MongoDB or memoryStore)
        let existingMember = null;
        if (mongoose.connection.readyState === 1) {
            try {
                existingMember = await TrustMember.findOne({ email: normalizedEmail }).maxTimeMS(800);
            } catch (dbErr) {
                console.warn('TrustMember lookup skipped:', dbErr.message);
            }
        }
        if (!existingMember && memoryStore.trust_members) {
            existingMember = memoryStore.trust_members.find(m => m.email?.toLowerCase() === normalizedEmail);
        }

        if (existingMember) {
            // Update existing member details gracefully
            existingMember.name = name || existingMember.name;
            existingMember.phone = phone || existingMember.phone;
            existingMember.address = address || existingMember.address;
            if (cleanAadhar) existingMember.aadharNumber = cleanAadhar;
            if (cleanPan) existingMember.panNumber = cleanPan;
            if (profilePhotoUrl) existingMember.profilePhoto = profilePhotoUrl;
            existingMember.donationAmount = numAmount;
            existingMember.subscriptionTier = tier;
            existingMember.approvalStatus = 'active';
            if (existingMember.save) await existingMember.save().catch(() => {});

            const memberIdToReturn = existingMember.memberId || existingMember.member_id || 'KCT-MEM-1001';
            const finalPhoto = profilePhotoUrl || existingMember.profilePhoto || existingMember.profile_photo || '';

            // Synchronize with local persistent store and Supabase
            await syncTrustMember({
                memberId: memberIdToReturn,
                name: existingMember.name,
                email: normalizedEmail,
                phone: existingMember.phone,
                address: existingMember.address,
                aadharNumber: cleanAadhar || existingMember.aadhar_number,
                panNumber: cleanPan || existingMember.pan_number,
                profilePhoto: finalPhoto,
                donationAmount: numAmount,
                subscriptionTier: tier,
                approvalStatus: 'active'
            });

            await syncProfile({
                email: normalizedEmail,
                name: existingMember.name,
                phone: existingMember.phone,
                role: 'trust_member',
                avatar: finalPhoto,
                address: existingMember.address
            });

            return res.status(200).json({
                success: true,
                message: `Congratulations! Your Trust Member account (${memberIdToReturn}) has been successfully updated.`,
                member: existingMember,
                photoUrl: finalPhoto
            });
        }

        // Generate strictly unique sequential Member ID: KCT-MEM-XXXX
        let maxIdNum = 1050;
        const allMemberIds = [
            ...(memoryStore.trust_members || []).map(m => m.memberId || m.member_id),
            ...(memoryStore.profiles || []).map(p => p.memberId || p.member_id)
        ];
        if (mongoose.connection.readyState >= 1) {
            try {
                const dbIds = await TrustMember.find({}).select('memberId').lean();
                dbIds.forEach(m => { if (m.memberId) allMemberIds.push(m.memberId); });
            } catch (e) {}
        }
        for (const idStr of allMemberIds) {
            if (typeof idStr === 'string') {
                const num = parseInt(idStr.replace(/\D/g, ''), 10);
                if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
            }
        }
        const memberId = `KCT-MEM-${maxIdNum + 1}`;

        // Next Payment Due Date = 1 month from today
        const nextPaymentDueDate = new Date();
        nextPaymentDueDate.setMonth(nextPaymentDueDate.getMonth() + 1);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dueMonthYear = `${monthNames[nextPaymentDueDate.getMonth()]} ${nextPaymentDueDate.getFullYear()}`;

        // Hash password if provided
        let hashedPassword = null;
        if (password && String(password).length >= 6) {
            try {
                hashedPassword = await bcrypt.hash(password, 10);
            } catch (hErr) {}
        }

        // Update / create user in MongoDB & Supabase
        let user = null;
        if (mongoose.connection.readyState === 1) {
            try {
                user = await User.findOne({ email: normalizedEmail }).maxTimeMS(800);
                if (!user) {
                    user = await User.create({
                        name,
                        email: normalizedEmail,
                        phone,
                        password: hashedPassword,
                        role: 'trust_member',
                        avatar: profilePhotoUrl,
                        address,
                        isVerified: true
                    });
                } else {
                    user.role = 'trust_member';
                    if (hashedPassword) user.password = hashedPassword;
                    if (profilePhotoUrl) user.avatar = profilePhotoUrl;
                    if (address) user.address = address;
                    await user.save();
                }
            } catch (userErr) {
                console.warn('User sync skipped:', userErr.message);
            }
        }

        // Create Trust Member in MongoDB
        let newMember = null;
        if (mongoose.connection.readyState === 1) {
            try {
                newMember = await TrustMember.create({
                    userId: user?._id,
                    memberId,
                    name,
                    email: normalizedEmail,
                    phone,
                    address,
                    aadharNumber: cleanAadhar,
                    panNumber: cleanPan,
                    profilePhoto: profilePhotoUrl,
                    donationAmount: numAmount,
                    paymentSchedule: 'monthly',
                    nextPaymentDueDate,
                    approvalStatus: 'active',
                    showOnLeaderboard: true
                });

                // Initialize First Monthly Schedule Record (Due in 1 Month)
                await MonthlySchedule.create({
                    memberId: newMember._id,
                    memberName: name,
                    memberEmail: normalizedEmail,
                    monthYear: dueMonthYear,
                    dueDate: nextPaymentDueDate,
                    amount: numAmount,
                    status: 'pending'
                });
            } catch (memberErr) {
                console.warn('MongoDB member create notice:', memberErr.message);
            }
        }

        if (!newMember) {
            newMember = {
                memberId,
                name,
                email: normalizedEmail,
                phone,
                address,
                aadharNumber: cleanAadhar,
                panNumber: cleanPan,
                profilePhoto: profilePhotoUrl,
                donationAmount: numAmount,
                subscriptionTier: tier,
                nextPaymentDueDate,
                approvalStatus: 'active'
            };
        }

        // Primary Sync to Supabase PostgreSQL
        await syncTrustMember({
            memberId,
            name,
            email: normalizedEmail,
            phone,
            address,
            aadharNumber: cleanAadhar,
            panNumber: cleanPan,
            profilePhoto: profilePhotoUrl,
            donationAmount: numAmount,
            subscriptionTier: tier,
            paymentSchedule: 'monthly',
            nextPaymentDueDate,
            approvalStatus: 'active',
            showOnLeaderboard: true
        });

        await syncMonthlySchedule({
            memberEmail: normalizedEmail,
            memberName: name,
            monthYear: dueMonthYear,
            dueDate: nextPaymentDueDate,
            amount: numAmount,
            status: 'pending'
        });

        await syncProfile({
            email: normalizedEmail,
            name,
            phone,
            role: 'trust_member',
            avatar: profilePhotoUrl,
            address,
            password: hashedPassword,
            memberId,
            status: 'active'
        });

        recordRegistrationMetric('trust_member');

        // Record Initial Membership Contribution in Donation collection & local memory store
        try {
            const Donation = require('../models/Donation');
            const donationRec = new Donation({
                fullName: name,
                mobile: phone,
                email: normalizedEmail,
                address,
                amount: numAmount,
                purpose: `Trust Membership Activation (${tier})`,
                donorCategory: 'trust_member_contribution',
                memberId: memberId,
                panNumber: cleanPan || '',
                paymentMethod: req.body.paymentMethod || 'Online Payment',
                transactionId: req.body.transactionId || `TXN-MEM-${Date.now()}`,
                status: 'completed'
            });
            await donationRec.save().catch(() => {});
        } catch (dErr) {}

        if (memoryStore.payments) {
            memoryStore.payments.unshift({
                transactionId: req.body.transactionId || `TXN-MEM-${Date.now()}`,
                fullName: name,
                mobile: phone,
                email: normalizedEmail,
                address,
                amount: numAmount,
                purpose: `Trust Membership Activation (${tier})`,
                donorCategory: 'trust_member_contribution',
                memberId: memberId,
                panNumber: cleanPan || '',
                paymentMethod: req.body.paymentMethod || 'Online Payment',
                status: 'completed',
                createdAt: new Date().toISOString()
            });
        }

        // Synchronize in memoryStore.profiles and memoryStore.trust_members
        let p = (memoryStore.profiles || []).find(prof => prof.email?.toLowerCase() === normalizedEmail);
        if (p) {
            p.role = 'trust_member';
            p.memberId = memberId;
            p.aadharNumber = cleanAadhar;
            p.panNumber = cleanPan;
            p.subscriptionTier = tier;
            p.donationAmount = numAmount;
            p.totalDonated = (p.totalDonated || 0) + numAmount;
            p.donationCount = (p.donationCount || 0) + 1;
            p.avatar = profilePhotoUrl || p.avatar;
            p.address = address;
            p.isDeleted = false;
            p.status = 'active';
        } else {
            p = {
                id: 'usr_' + Date.now(),
                name,
                email: normalizedEmail,
                phone,
                role: 'trust_member',
                memberId,
                aadharNumber: cleanAadhar,
                panNumber: cleanPan,
                subscriptionTier: tier,
                donationAmount: numAmount,
                totalDonated: numAmount,
                donationCount: 1,
                avatar: profilePhotoUrl,
                address,
                authProvider: 'local',
                isDeleted: false,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            if (!memoryStore.profiles) memoryStore.profiles = [];
            memoryStore.profiles.push(p);
        }

        if (!memoryStore.trust_members) memoryStore.trust_members = [];
        const existingTmIdx = memoryStore.trust_members.findIndex(m => m.email?.toLowerCase() === normalizedEmail);
        const tmEntry = {
            _id: 'tm_' + Date.now(),
            memberId,
            name,
            email: normalizedEmail,
            phone,
            address,
            aadharNumber: cleanAadhar,
            panNumber: cleanPan,
            profilePhoto: profilePhotoUrl,
            donationAmount: numAmount,
            subscriptionTier: tier,
            paymentSchedule: 'monthly',
            nextPaymentDueDate,
            approvalStatus: 'active',
            isDeleted: false,
            totalDonated: numAmount,
            donationCount: 1,
            createdAt: new Date().toISOString()
        };
        if (existingTmIdx >= 0) {
            memoryStore.trust_members[existingTmIdx] = tmEntry;
        } else {
            memoryStore.trust_members.push(tmEntry);
        }
        persistMemoryStore();

        // Dispatch Welcome Email
        sendTrustMemberWelcomeEmail(newMember).catch(e => console.warn('Email dispatch warning:', e.message));

        // Generate JWT token for seamless active session
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'kiran_secret_key_2024';
        const token = jwt.sign(
            { userId: user?._id || newMember._id || memberId, email: normalizedEmail, role: 'trust_member' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: `Congratulations! You are officially registered as Trust Member (${memberId}).`,
            member: newMember,
            memberId,
            token,
            photoUrl: profilePhotoUrl
        });
    } catch (err) {
        console.error('Trust member registration error:', err);
        return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
    }
});

// GET /api/trust-members/profile/:idOrEmail — Member Details
router.get('/profile/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const query = identifier.includes('@')
            ? { email: identifier.toLowerCase().trim() }
            : { memberId: identifier.toUpperCase() };

        let member = null;
        let schedules = [];

        try {
            if (mongoose.connection?.readyState === 1) {
                member = await TrustMember.findOne(query);
                if (member) {
                    schedules = await MonthlySchedule.find({ memberId: member._id }).sort({ dueDate: -1 });
                }
            }
        } catch (dbErr) {
            console.warn('DB lookup skipped:', dbErr.message);
        }

        if (!member) {
            const memoryMember = require('../services/supabaseService').memoryStore.trust_members.find(
                m => m.email === identifier.toLowerCase().trim() || m.member_id === identifier.toUpperCase()
            );
            if (!memoryMember) {
                return res.status(404).json({ success: false, message: 'Trust member not found' });
            }
            member = memoryMember;
        }

        return res.json({
            success: true,
            member,
            schedules
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error retrieving profile' });
    }
});

// GET /api/trust-members/schedules — Get All Schedules for Logged In Member
router.get('/my-schedules', requireAuth, async (req, res) => {
    try {
        let member = null;
        let schedules = [];

        try {
            if (mongoose.connection?.readyState === 1) {
                member = await TrustMember.findOne({ email: req.user.email });
                if (member) {
                    schedules = await MonthlySchedule.find({ memberId: member._id }).sort({ dueDate: 1 });
                }
            }
        } catch (e) {}

        if (!member) {
            member = require('../services/supabaseService').memoryStore.trust_members.find(m => m.email === req.user.email);
        }

        return res.json({ success: true, member, schedules });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve schedules' });
    }
});

// GET /api/trust-members/public-list — Public member directory (Live Supabase + MongoDB)
router.get('/public-list', async (req, res) => {
    try {
        // 1. Official Board of Trustees Leadership
        const boardOfTrustees = [
            {
                roleKey: 'president',
                roleLabel: 'President',
                name: 'Sri P. Subba Rao',
                city: 'Guntur',
                state: 'Andhra Pradesh',
                photo: '',
                highlight: false
            },
            {
                roleKey: 'vice_chairperson',
                roleLabel: 'Vice Chairperson',
                name: 'Konda Ravi Teja',
                city: 'Palnadu',
                state: 'Andhra Pradesh',
                photo: 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/vice_chairman_raviteja.png',
                highlight: false
            },
            {
                roleKey: 'chairperson',
                roleLabel: 'Chairperson',
                name: 'Pallepogu Kiranbabu',
                city: 'Mandepudi',
                state: 'Andhra Pradesh',
                photo: 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/chairman_kiranbabu.jpeg',
                highlight: true
            },
            {
                roleKey: 'executive_member',
                roleLabel: 'Executive Member',
                name: 'Konda Ravi Bharath',
                city: 'Guntur',
                state: 'Andhra Pradesh',
                photo: 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/executive_ravibharath.png',
                highlight: false
            },
            {
                roleKey: 'treasurer',
                roleLabel: 'Treasurer',
                name: 'Srungarapati Rakesh',
                city: 'Narasaraopet',
                state: 'Andhra Pradesh',
                photo: 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/treasurer_rakesh.jpeg',
                highlight: false
            }
        ];

        let members = [];
        const seenEmails = new Set();
        const seenIds = new Set();

        const addMember = (m) => {
            const emailKey = (m.email || '').toLowerCase().trim();
            const idKey = (m.memberId || m.member_id || '').trim();
            if (emailKey && seenEmails.has(emailKey)) return;
            if (idKey && seenIds.has(idKey)) return;
            if (emailKey) seenEmails.add(emailKey);
            if (idKey) seenIds.add(idKey);

            let photo = m.profilePhoto || m.profile_photo || m.avatar || '';
            if (photo.includes('Pallepogu Kiranbabu') || photo.includes('Chairman')) {
                photo = 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/chairman_kiranbabu.jpeg';
            } else if (photo.includes('Ravi Teja') || photo.includes('Vice Chairman')) {
                photo = 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/vice_chairman_raviteja.png';
            } else if (photo.includes('Ravi Bharath') || photo.includes('Executive')) {
                photo = 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/executive_ravibharath.png';
            } else if (photo.includes('Rakesh') || photo.includes('Treasurer')) {
                photo = 'https://pub-970bc89c732845808ebd2b74e9d1e0fd.r2.dev/profile_photos/treasurer_rakesh.jpeg';
            } else if (photo.startsWith('/src/assets/')) {
                photo = photo.replace('/src/assets/', '/assets/');
            }

            members.push({
                _id: m._id || m.id,
                id: m.id || m._id,
                name: m.name || 'Trust Member',
                memberId: idKey || `KCT-TM-${1000 + members.length}`,
                email: emailKey,
                phone: m.phone || m.mobile || '',
                role: m.role || 'Trust Member',
                city: m.city || 'Guntur',
                state: m.state || 'AP',
                profilePhoto: photo,
                photo: photo,
                subscriptionTier: m.subscriptionTier || m.subscription_tier || (m.donationAmount >= 5000 ? 'Diamond Member' : m.donationAmount >= 2500 ? 'Gold Member' : m.donationAmount >= 1000 ? 'Silver Member' : 'Starter Member'),
                donationAmount: Number(m.donationAmount || m.donation_amount) || 0,
                totalDonated: Number(m.totalDonated || m.total_donated) || 0,
                approvalStatus: m.approvalStatus || m.approval_status || 'active',
                joinDate: m.joinDate || m.createdAt || m.created_at || new Date().toISOString()
            });
        };

        // 1. Primary Live Source: Ingest directly from Supabase
        try {
            const sbMembers = await fetchSupabaseTrustMembers();
            if (sbMembers && sbMembers.length > 0) {
                sbMembers.forEach(m => {
                    const isDel = m.is_deleted === true || m.approval_status === 'deleted' || m.approval_status === 'suspended';
                    if (!isDel) {
                        addMember({
                            id: m.id,
                            name: m.name,
                            memberId: m.member_id,
                            email: m.email,
                            phone: m.phone,
                            role: m.role,
                            city: m.city,
                            state: m.state,
                            profilePhoto: m.profile_photo,
                            subscriptionTier: m.subscription_tier,
                            donationAmount: m.donation_amount,
                            totalDonated: m.total_donated,
                            approvalStatus: m.approval_status,
                            createdAt: m.created_at
                        });
                    }
                });
            }
        } catch (sbErr) {
            console.warn('Supabase public trust members fetch notice:', sbErr.message);
        }

        // 2. Dual Database: Ingest from MongoDB
        try {
            if (mongoose.connection?.readyState === 1) {
                const dbMembers = await TrustMember.find({ isDeleted: { $ne: true }, approvalStatus: { $nin: ['deleted', 'suspended'] } })
                    .lean();
                dbMembers.forEach(addMember);
            }
        } catch (dbErr) {
            console.warn('MongoDB public trust members fetch notice:', dbErr.message);
        }

        // 3. Fallback: Ingest from memoryStore only if 0 members
        if (members.length === 0 && memoryStore?.trust_members?.length > 0) {
            memoryStore.trust_members
                .filter(m => !m.isDeleted && m.approvalStatus !== 'deleted' && m.approvalStatus !== 'suspended')
                .forEach(addMember);
        }

        return res.json({
            success: true,
            boardOfTrustees,
            members,
            total: members.length
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load members', members: [], boardOfTrustees: [] });
    }
});

module.exports = router;
