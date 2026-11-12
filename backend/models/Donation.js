const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    mobile: { 
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
    address: { 
        type: String, 
        required: true 
    },
    donationType: {
        type: String,
        default: 'cash'
    },
    donorCategory: {
        type: String,
        enum: ['general', 'volunteer_membership', 'trust_member_monthly', 'trust_member_contribution', 'monthly_donor_subscription'],
        default: 'general',
        index: true
    },
    memberId: {
        type: String,
        sparse: true,
        index: true
    },
    userId: {
        type: String,
        sparse: true,
        index: true
    },
    panNumber: {
        type: String,
        trim: true,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    amount: {
        type: Number,
        required: function () { return this.donationType === 'cash'; },
        min: 0,
        index: true
    },
    purpose: {
        type: String,
        required: function () { return this.donationType === 'cash'; }
    },
    paymentMethod: {
        type: String,
        required: function () { return this.donationType === 'cash'; }
    },
    itemCategory: { type: String },
    itemName: { type: String },
    itemQuantity: { type: String },
    deliveryMethod: { type: String },
    transactionId: { 
        type: String, 
        index: true 
    },
    receiptNumber: { 
        type: String, 
        unique: true, 
        sparse: true, 
        index: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
        index: true 
    },
    failureReason: {
        type: String,
        default: ''
    },
    failureNotificationSent: {
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true 
    }
});

donationSchema.pre('save', function () {
    if (!this.receiptNumber) {
        this.receiptNumber = 'KCT-' + Date.now() + '-' + Math.floor(100000 + Math.random() * 900000);
    }
    if (!this.transactionId && this.donationType === 'cash') {
        this.transactionId = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    }
});

module.exports = mongoose.model('Donation', donationSchema);
