const mongoose = require('mongoose');

const trustMemberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    memberId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    aadharNumber: {
        type: String,
        required: true,
        trim: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    donationAmount: {
        type: Number,
        required: true,
        min: 1
    },
    paymentSchedule: {
        type: String,
        enum: ['monthly', 'quarterly', 'annual'],
        default: 'monthly'
    },
    nextPaymentDueDate: {
        type: Date,
        required: true,
        index: true
    },
    lastPaymentDate: {
        type: Date
    },
    totalDonated: {
        type: Number,
        default: 0
    },
    donationCount: {
        type: Number,
        default: 0
    },
    rankingScore: {
        type: Number,
        default: 0,
        index: true
    },
    showOnLeaderboard: {
        type: Boolean,
        default: true
    },
    approvalStatus: {
        type: String,
        enum: ['active', 'pending_approval', 'suspended'],
        default: 'active'
    },
    emailRemindersEnabled: {
        type: Boolean,
        default: true
    },
    remindersSent: {
        type: Number,
        default: 0
    },
    lastReminderDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    scheduledPermanentDeleteAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('TrustMember', trustMemberSchema);
