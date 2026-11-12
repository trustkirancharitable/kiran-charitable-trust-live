const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST /api/contact - Public contact submission
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, subject, message } = req.body;
        if (!name || !phone || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const contact = new Contact({ name, phone, email, subject, message });
        await contact.save();

        // Send In-App Admin Notification
        try {
            const Notification = require('../models/Notification');
            if (Notification) {
                await Notification.create({
                    title: `New Inquiry from ${name.trim()}`,
                    message: `Subject: ${subject.trim()} | Contact: ${phone} / ${email}`,
                    category: 'alert',
                    targetAudience: 'admin',
                    priority: 'high',
                    active: true
                });
            }
        } catch (notifErr) {
            console.warn('In-app notification creation skipped:', notifErr.message);
        }

        res.status(201).json({ success: true, message: 'Message sent successfully! Our trust team will contact you shortly.' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// GET /api/contact - Admin list of inquiries
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/contact/:id - Admin delete inquiry
router.delete('/:id', async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Message removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
