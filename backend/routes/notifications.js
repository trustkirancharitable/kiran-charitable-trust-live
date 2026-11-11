/**
 * Notifications API Routes
 * Supports Push Notifications to Trust Members, Real-Time Alerts & Announcements
 */

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { pushNotificationToMembers, memoryNotifications } = require('../services/socketService');

// POST /api/notifications/push-to-members — Admin / Board Push Notification Endpoint
router.post('/push-to-members', async (req, res) => {
    try {
        const {
            title,
            message,
            category = 'announcement',
            priority = 'normal',
            targetAudience = 'all_members',
            targetMemberId = null,
            targetTier = null,
            actionLink = '',
            pushedBy = 'Trust Board'
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Notification title and message are required.'
            });
        }

        const notification = await pushNotificationToMembers({
            title,
            message,
            category,
            priority,
            targetAudience,
            targetMemberId,
            targetTier,
            actionLink,
            pushedBy
        });

        return res.status(200).json({
            success: true,
            message: 'Push notification dispatched successfully to trust members.',
            notification
        });
    } catch (err) {
        console.error('Push notification error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to dispatch push notification.',
            error: err.message
        });
    }
});

// GET /api/notifications/my-notifications — Retrieve notifications for trust members
router.get('/my-notifications', async (req, res) => {
    try {
        const { memberId, tier } = req.query;

        let notifications = [];
        try {
            const query = {
                active: true,
                $or: [
                    { targetAudience: 'all_members' },
                    { targetAudience: 'public' },
                    ...(memberId ? [{ targetMemberId: memberId }] : []),
                    ...(tier ? [{ targetTier: tier }] : [])
                ]
            };
            notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
        } catch (dbErr) {
            // Fallback to memory store
            notifications = memoryNotifications.filter(n => 
                n.targetAudience === 'all_members' ||
                n.targetAudience === 'public' ||
                (memberId && n.targetMemberId === memberId) ||
                (tier && n.targetTier === tier)
            );
        }

        return res.json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching member notifications.'
        });
    }
});

// GET /api/notifications/active — Public and General Announcements
router.get('/active', async (req, res) => {
    try {
        let active = [];
        try {
            active = await Notification.find({ active: true, targetAudience: { $in: ['all_members', 'public'] } })
                .sort({ createdAt: -1 })
                .limit(20);
        } catch (dbErr) {
            active = memoryNotifications.filter(n => n.targetAudience === 'all_members' || n.targetAudience === 'public');
        }

        return res.json({
            success: true,
            announcements: active
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve active announcements.' });
    }
});

module.exports = router;
