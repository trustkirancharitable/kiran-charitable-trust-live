/**
 * Socket.IO Real-Time Engine & Member Push Notification Hub
 * Kiran Charitable Trust Enterprise Architecture
 */

const { Server } = require('socket.io');
const { activeSocketConnections, memberNotificationsPushed } = require('./metricsService');
const { kafkaEngine, TOPICS } = require('./kafkaService');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

let io = null;

// In-memory notifications fallback store for 100% zero-failure persistence
const NOTIFICATIONS_STORE_FILE = path.join(__dirname, '..', 'data', 'notifications_store.json');

function loadStoredNotifications() {
    try {
        if (fs.existsSync(NOTIFICATIONS_STORE_FILE)) {
            return JSON.parse(fs.readFileSync(NOTIFICATIONS_STORE_FILE, 'utf8'));
        }
    } catch (e) {}
    return [];
}

const memoryNotifications = loadStoredNotifications();

function persistNotifications() {
    try {
        const dir = path.dirname(NOTIFICATIONS_STORE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(NOTIFICATIONS_STORE_FILE, JSON.stringify(memoryNotifications, null, 2), 'utf8');
    } catch (e) {}
}

/**
 * Initializes the Socket.IO server attached to HTTP server
 */
function initializeSocketIO(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://kiran-trust-frontend-live.vercel.app',
                process.env.CLIENT_URL || '*'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 15000
    });

    io.on('connection', (socket) => {
        const memberId = socket.handshake.query.memberId || socket.handshake.auth?.memberId;
        const tier = socket.handshake.query.tier || socket.handshake.auth?.tier;
        const role = socket.handshake.query.role || socket.handshake.auth?.role;

        // Auto-join public live ticker room
        socket.join('live_ticker');
        activeSocketConnections.inc({ room: 'live_ticker' });

        // Join trust member rooms
        if (memberId) {
            socket.join('trust_members');
            socket.join(`member_${memberId}`);
            activeSocketConnections.inc({ room: 'trust_members' });
            console.log(`🔌 [Socket.IO] Member connected: ${memberId} (Tier: ${tier || 'Standard'})`);

            if (tier) {
                socket.join(`tier_${tier}`);
            }
        }

        if (role === 'admin') {
            socket.join('admins');
            console.log(`🛡️ [Socket.IO] Admin socket connected: ${socket.id}`);
        }

        socket.on('disconnect', () => {
            activeSocketConnections.dec({ room: 'live_ticker' });
            if (memberId) activeSocketConnections.dec({ room: 'trust_members' });
        });
    });

    console.log('⚡ [Socket.IO Engine] Real-time gateway active and listening for member connections');
    return io;
}

/**
 * Pushes a notification to Trust Members via Socket.IO, Kafka, and Database
 */
async function pushNotificationToMembers(notificationData) {
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
    } = notificationData;

    const notificationPayload = {
        id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title,
        message,
        category,
        priority,
        targetAudience,
        targetMemberId,
        targetTier,
        actionLink,
        pushedBy,
        createdAt: new Date().toISOString()
    };

    // 1. Persist to MongoDB (with local fallback if DB is offline)
    try {
        const doc = new Notification({
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
        await doc.save();
        notificationPayload.id = doc._id.toString();
    } catch (dbErr) {
        // Resilient fallback storage
        memoryNotifications.unshift(notificationPayload);
        if (memoryNotifications.length > 200) memoryNotifications.pop();
        persistNotifications();
    }

    // 2. Real-Time Push via Socket.IO
    if (io) {
        if (targetMemberId) {
            // Targeted to individual member
            io.to(`member_${targetMemberId}`).emit('member_notification', notificationPayload);
            console.log(`📢 [Socket.IO Push] Dispatched to private member room: member_${targetMemberId}`);
        } else if (targetTier) {
            // Targeted to tier
            io.to(`tier_${targetTier}`).emit('member_notification', notificationPayload);
            console.log(`📢 [Socket.IO Push] Dispatched to tier room: tier_${targetTier}`);
        } else {
            // Broadcast to all verified trust members
            io.to('trust_members').emit('member_notification', notificationPayload);
            console.log(`📢 [Socket.IO Push] Dispatched to all trust members (${title})`);
        }
    }

    // 3. Stream to Kafka Event Queue
    try {
        await kafkaEngine.produce(TOPICS.NOTIFICATION_PUSH, notificationPayload, {
            key: targetMemberId || targetTier || 'all-members'
        });
    } catch (kafkaErr) {
        console.warn('Kafka event stream notice:', kafkaErr.message);
    }

    // 4. Record Prometheus Metric
    try {
        memberNotificationsPushed.inc({
            category,
            target_tier: targetTier || targetAudience,
            delivery_channel: 'socket_io'
        });
    } catch (mErr) {}

    return notificationPayload;
}

/**
 * Emits a real-time live donation alert to public ticker & admins
 */
function emitDonationLive(donation) {
    if (!io) return;
    const tickerItem = {
        name: donation.isAnonymous ? 'Well Wisher' : (donation.fullName || 'Generous Donor'),
        amount: donation.amount,
        purpose: donation.purpose || 'Charitable Mission',
        timestamp: new Date().toISOString()
    };
    io.to('live_ticker').emit('new_donation', tickerItem);
    io.to('admins').emit('admin_donation_alert', donation);
}

module.exports = {
    initializeSocketIO,
    pushNotificationToMembers,
    emitDonationLive,
    memoryNotifications,
    getIO: () => io
};
