const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const TrustMember = require('../models/TrustMember');
const { autoRankDonors, getCachedLeaderboard } = require('../services/rankingService');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// GET /api/donors/ticker — Lightweight endpoint for real-time scrolling marquee
router.get('/ticker', async (req, res) => {
    try {
        let leaderboard = getCachedLeaderboard();
        if (!leaderboard.lastUpdated || !leaderboard.allTimeTop || leaderboard.allTimeTop.length === 0) {
            leaderboard = await autoRankDonors();
        }
        const tickerItems = (leaderboard.allTimeTop || []).map(d => ({
            name: d.name,
            photo: d.photo || '',
            tag: d.tierBadge || 'Valued Member',
            amount: d.totalDonated,
            highlight: d.rank <= 3
        }));

        return res.json({
            success: true,
            ticker: tickerItems
        });
    } catch (err) {
        return res.json({
            success: true,
            ticker: []
        });
    }
});

// GET /api/donors/leaderboard — Comprehensive Auto-Ranked Leaderboard & Full Directory
router.get('/leaderboard', async (req, res) => {
    try {
        const force = req.query.refresh === 'true';
        const leaderboard = await getCachedLeaderboard(force);
        let trustMembersWall = [];

        try {
            if (mongoose.connection.readyState >= 1) {
                trustMembersWall = await TrustMember.find({ showOnLeaderboard: true, approvalStatus: 'active' })
                    .select('name profilePhoto donationAmount memberId totalDonated createdAt subscriptionTier')
                    .sort({ totalDonated: -1, donationAmount: -1 })
                    .limit(20)
                    .lean();
            }
        } catch (dbErr) {
            console.warn('Leaderboard trust member read notice:', dbErr.message);
        }

        // Fallback for trustMembersWall if MongoDB is not connected
        if (!trustMembersWall || trustMembersWall.length === 0) {
            const { memoryStore } = require('../services/supabaseService');
            if (memoryStore && Array.isArray(memoryStore.trust_members)) {
                trustMembersWall = memoryStore.trust_members
                    .filter(m => m.approvalStatus === 'active' && !m.isDeleted)
                    .map(m => ({
                        name: m.name,
                        profilePhoto: m.profilePhoto || '',
                        donationAmount: m.donationAmount || 0,
                        memberId: m.memberId || '',
                        totalDonated: m.totalDonated || 0,
                        createdAt: m.createdAt || new Date(),
                        subscriptionTier: m.subscriptionTier || 'Trust Member'
                    }))
                    .sort((a, b) => (b.totalDonated || 0) - (a.totalDonated || 0));
            }
        }

        // Optional search and filter query processing
        let honors = leaderboard.honorsList || [];
        const { search, tier, period } = req.query;

        if (search) {
            const q = search.toLowerCase().trim();
            honors = honors.filter(d => 
                (d.name && d.name.toLowerCase().includes(q)) ||
                (d.city && d.city.toLowerCase().includes(q)) ||
                (d.purpose && d.purpose.toLowerCase().includes(q)) ||
                (d.tierName && d.tierName.toLowerCase().includes(q))
            );
        }

        if (tier && tier !== 'all') {
            honors = honors.filter(d => d.tierName && d.tierName.toLowerCase().replace(/\s+/g, '') === tier.toLowerCase().replace(/\s+/g, ''));
        }

        return res.json({
            success: true,
            month: leaderboard.month,
            lastUpdated: leaderboard.lastUpdated,
            allTimeTop: leaderboard.allTimeTop || [],
            honorsList: honors,
            allDonors: leaderboard.allDonors || [],
            monthlyTop: leaderboard.monthlyTop || [],
            monthlyAll: leaderboard.monthlyAll || [],
            tiers: leaderboard.tiers || {},
            stats: leaderboard.stats || {},
            trustMembers: trustMembersWall
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load leaderboard' });
    }
});

// POST /api/donors/recalculate-rankings — Protected Administrator trigger to re-compute rankings
router.post('/recalculate-rankings', requireAuth, requireAdmin, async (req, res) => {
    try {
        const updated = await autoRankDonors();
        return res.json({
            success: true,
            message: 'Donor rankings successfully re-calculated and cached.',
            lastUpdated: updated.lastUpdated,
            rankedCount: updated.stats.totalDonorsRanked,
            topAmount: updated.stats.topDonorAmount
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to recalculate rankings' });
    }
});

module.exports = router;
