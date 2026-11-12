const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'kiran_secret_key_2024';

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        let user = null;
        if (mongoose.connection.readyState >= 1) {
            try {
                if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
                    user = await User.findById(decoded.userId).select('-__v');
                }
                if (!user && decoded.email) {
                    user = await User.findOne({ email: decoded.email.toLowerCase().trim() }).select('-__v');
                }
            } catch (e) {}
        }

        if (!user) {
            // 1. Check Supabase Cloud DB (Primary live source when MongoDB disconnected)
            const { getSupabase } = require('../services/supabaseService');
            const sb = getSupabase();
            if (sb) {
                try {
                    const targetEmail = (decoded.email || '').toLowerCase().trim();
                    const { data: sbMem } = await sb.from('trust_members')
                        .select('*')
                        .eq('email', targetEmail)
                        .maybeSingle();
                    if (sbMem) {
                        user = {
                            _id: sbMem.id,
                            id: sbMem.id,
                            name: sbMem.name,
                            email: sbMem.email,
                            phone: sbMem.phone,
                            role: 'trust_member',
                            address: sbMem.address,
                            avatar: sbMem.profile_photo,
                            aadharNumber: sbMem.aadhar_number,
                            panNumber: sbMem.pan_number,
                            trustMemberId: sbMem.member_id,
                            memberId: sbMem.member_id
                        };
                    } else {
                        const { data: sbProf } = await sb.from('profiles')
                            .select('*')
                            .eq('email', targetEmail)
                            .maybeSingle();
                        if (sbProf) {
                            user = {
                                _id: sbProf.id,
                                id: sbProf.id,
                                name: sbProf.name,
                                email: sbProf.email,
                                phone: sbProf.phone,
                                role: sbProf.role || 'donor',
                                address: sbProf.address,
                                avatar: sbProf.avatar_url
                            };
                        }
                    }
                } catch (sbErr) {
                    console.warn('AuthMiddleware Supabase lookup notice:', sbErr.message);
                }
            }
        }

        if (!user) {
            const { memoryStore } = require('../services/supabaseService');
            const targetId = decoded.userId || '';
            const targetEmail = (decoded.email || '').toLowerCase().trim();
            const memUser = (memoryStore.profiles || []).find(p => 
                (targetEmail && p.email?.toLowerCase() === targetEmail) || 
                (targetId && (p.id === targetId || p._id === targetId))
            );
            const tm = (memoryStore.trust_members || []).find(m => 
                (targetEmail && m.email?.toLowerCase() === targetEmail) || 
                (targetId && (m.memberId === targetId || m.member_id === targetId || m._id === targetId || m.id === targetId))
            );
            if (memUser || tm) {
                user = {
                    _id: memUser?.id || tm?.member_id || tm?.memberId || decoded.userId || 'usr_' + Date.now(),
                    id: memUser?.id || tm?.member_id || tm?.memberId || decoded.userId || 'usr_' + Date.now(),
                    name: memUser?.name || tm?.name || 'Member',
                    email: memUser?.email || tm?.email || decoded.email,
                    phone: memUser?.phone || tm?.phone || '',
                    role: memUser?.role || (tm ? 'trust_member' : decoded.role || 'donor'),
                    address: memUser?.address || tm?.address || '',
                    avatar: memUser?.avatar || tm?.profile_photo || tm?.profilePhoto || '',
                    aadharNumber: memUser?.aadharNumber || tm?.aadharNumber || tm?.aadhar_number || '',
                    panNumber: memUser?.panNumber || tm?.panNumber || tm?.pan_number || '',
                    trustMemberId: tm?.member_id || tm?.memberId || 'KCT-MEM-1007',
                    memberId: tm?.member_id || tm?.memberId || 'KCT-MEM-1007'
                };
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, isLoggedOut: true, message: 'User account not found' });
        }

        // IMMEDIATE LOGOUT ENFORCEMENT FOR TRASHED / DELETED ACCOUNTS
        const adminEmail = (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'trustkirancharitable@gmail.com').toLowerCase();
        const isAdmin = user.role === 'admin' || (user.email && user.email.toLowerCase() === adminEmail);

        if (!isAdmin) {
            const { memoryStore } = require('../services/supabaseService');
            const target = (user.email || decoded.email || '').toLowerCase().trim();

            let isTrash = Boolean(
                user.isDeleted || 
                user.status === 'deleted' || 
                user.status === 'trash'
            );

            // Check TrustMember in MongoDB if connected
            if (!isTrash && mongoose.connection.readyState >= 1 && target) {
                try {
                    const TrustMember = require('../models/TrustMember');
                    const tmDb = await TrustMember.findOne({ email: target });
                    if (tmDb && (tmDb.isDeleted || tmDb.approvalStatus === 'deleted')) {
                        isTrash = true;
                    }
                } catch (e) {}
            }

            // Check memoryStore
            if (!isTrash && target) {
                const tm = (memoryStore.trust_members || []).find(m => m.email?.toLowerCase() === target || m.memberId === target || m.member_id === target);
                if (tm && (tm.isDeleted || tm.approvalStatus === 'deleted')) {
                    isTrash = true;
                }
                const prof = (memoryStore.profiles || []).find(p => p.email?.toLowerCase() === target || p.id === target);
                if (prof && (prof.isDeleted || prof.status === 'deleted' || prof.status === 'trash')) {
                    isTrash = true;
                }
            }

            if (isTrash) {
                return res.status(403).json({
                    success: false,
                    isDeleted: true,
                    isLoggedOut: true,
                    message: 'Your account has been moved to trash by the administrator. Your session has been terminated and you have been logged out.'
                });
            }
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
};

const requireAdmin = async (req, res, next) => {
    return requireAuth(req, res, () => {
        // Allow if role is admin or if admin email matches
        const adminEmails = [(process.env.ADMIN_EMAIL || '').toLowerCase(), (process.env.EMAIL_USER || '').toLowerCase(), 'trustkirancharitable@gmail.com'].filter(Boolean);
        const userEmail = (req.user?.email || '').toLowerCase();
        if (req.user && (req.user.role === 'admin' || adminEmails.includes(userEmail))) {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Admin access required' });
    });
};

module.exports = {
    requireAuth,
    requireAdmin,
    JWT_SECRET
};
