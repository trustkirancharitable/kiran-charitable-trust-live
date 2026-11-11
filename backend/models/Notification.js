/**
 * Notification Model for Trust Members & Public Announcements
 * Kiran Charitable Trust Enterprise Architecture
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    category: {
        type: String,
        enum: ['announcement', 'urgent_appeal', 'monthly_reminder', 'agm_meeting', 'milestone', 'donation_receipt', 'general'],
        default: 'announcement'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    targetAudience: {
        type: String,
        enum: ['all_members', 'specific_member', 'tier_champion', 'tier_patron', 'tier_guardian', 'public'],
        default: 'all_members'
    },
    targetMemberId: {
        type: String,
        default: null
    },
    targetTier: {
        type: String,
        default: null
    },
    actionLink: {
        type: String,
        default: ''
    },
    pushedBy: {
        type: String,
        default: 'Trust Administrator'
    },
    isReadBy: [{
        memberId: String,
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

notificationSchema.index({ targetAudience: 1, active: 1, createdAt: -1 });
notificationSchema.index({ targetMemberId: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
