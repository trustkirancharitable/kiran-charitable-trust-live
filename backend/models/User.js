const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        index: true 
    },
    password: {
        type: String,
        default: null
    },
    phone: { 
        type: String, 
        trim: true,
        default: ''
    },
    role: { 
        type: String, 
        enum: ['volunteer', 'trust_member', 'admin', 'donor'], 
        default: 'donor' 
    },
    authProvider: { 
        type: String, 
        enum: ['email_otp', 'google', 'local', 'password'], 
        default: 'local' 
    },
    googleId: { 
        type: String, 
        sparse: true 
    },
    avatar: { 
        type: String, 
        default: '' 
    },
    address: { 
        type: String, 
        default: '' 
    },
    aadharNumber: {
        type: String,
        trim: true,
        default: ''
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: ''
    },
    resetPasswordOtp: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isVerified: { 
        type: Boolean, 
        default: true 
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    suspensionReason: {
        type: String,
        default: ''
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    scheduledPermanentDeleteAt: {
        type: Date,
        default: null
    },
    lastLoginAt: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Helper to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
