/**
 * Kiran Charitable Trust - Heartfelt, Personal & Professional Email Service
 * Production SMTP Integration via GoDaddy Titan (smtpout.secureserver.net:465 SSL)
 * Compatible with Vercel Serverless & Node.js Environments
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { cleanExpiredSentOtpEmails } = require('./emailCleanupService');

function numberToWords(amount) {
    const num = Math.floor(Number(amount) || 0);
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n) {
        if (n === 0) return '';
        if (n < 20) return a[n] + ' ';
        if (n < 100) return b[Math.floor(n / 10)] + ' ' + (n % 10 ? a[n % 10] + ' ' : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 ? convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 ? convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 ? convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 ? convert(n % 10000000) : '');
    }
    return num === 0 ? 'Zero Rupees Only' : 'Rupees ' + convert(num).trim() + ' Only';
}

const EMAIL_LOGO_PATH = path.join(__dirname, '../assets/email-logo-low.jpg');

const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtpout.secureserver.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true' || SMTP_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let transporter = null;

function getTransporter() {
    if (!transporter && EMAIL_PASS && EMAIL_PASS !== 'your_email_password') {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE, // SSL for 465
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    return transporter;
}

/**
 * Universal email dispatcher with fallback to console logging
 */
async function dispatchEmail({ to, subject, html, text, attachments = [] }) {
    console.log(`📧 [EMAIL OUTBOUND] To: ${to} | Subject: "${subject}"`);
    const mailer = getTransporter();

    if (!mailer) {
        console.log(`ℹ️ [EMAIL SIMULATION MODE - No SMTP password configured]`);
        console.log(`Body preview:\n${text || (html ? html.slice(0, 300) : '')}...`);
        return { success: true, simulated: true, to };
    }

    const emailAttachments = [...attachments];
    if (fs.existsSync(EMAIL_LOGO_PATH)) {
        emailAttachments.unshift({
            filename: 'kct-logo.jpg',
            path: EMAIL_LOGO_PATH,
            cid: 'kctlogo'
        });
    }

    try {
        const info = await mailer.sendMail({
            from: `"Kiran Charitable Trust" <${EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
            attachments: emailAttachments
        });
        console.log(`✅ [EMAIL DISPATCHED] ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ [EMAIL DISPATCH ERROR]:`, err.message);
        return { success: false, error: err.message };
    }
}

// In-memory template cache for sub-millisecond rendering
const templateCache = {};

/**
 * Loads an HTML template file from possible workspace / backend locations
 */
function getTemplate(templateFileName) {
    if (templateCache[templateFileName]) {
        return templateCache[templateFileName];
    }
    const candidatePaths = [
        path.join(__dirname, '../email-templates', templateFileName),
        path.join(__dirname, '../../email-templates', templateFileName),
        path.join(process.cwd(), 'email-templates', templateFileName),
        path.join(process.cwd(), 'backend/email-templates', templateFileName)
    ];

    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            templateCache[templateFileName] = raw;
            return raw;
        }
    }
    console.warn(`⚠️ [EMAIL TEMPLATE NOT FOUND ON DISK]: ${templateFileName}`);
    return null;
}

/**
 * Renders an HTML template replacing dynamic placeholders {{key}}
 */
function renderTemplate(templateFileName, data = {}) {
    let raw = getTemplate(templateFileName);
    if (!raw) {
        return `<p>Kiran Charitable Trust Notification</p>`;
    }
    return raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
        if (data[key] !== undefined && data[key] !== null) {
            return String(data[key]);
        }
        return '';
    });
}

/**
 * Provides comprehensive mock/default data for any template ID
 */
function getMockDataForTemplate(templateKey, overrides = {}) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedDateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

    const baseData = {
        first_name: 'Fayaz',
        full_name: 'Fayaz Ahmed',
        email: 'kirancharitabletrust01@gmail.com',
        phone: '+91 77024 68889',
        otp: '482915',
        volunteer_id: 'KCT-VOL-1088',
        registration_date: formattedDate,
        membership_fee: '₹100',
        status: 'Active / Verified',
        member_id: 'KCT-MBR-2026',
        id_card_number: 'ID-2026-8899',
        amount: '1,000',
        donor_name: 'Fayaz Ahmed',
        receipt_number: 'KCT-2026-REC-8841',
        transaction_id: 'SP-TXN-9988231',
        date: formattedDateTime,
        purpose: 'Child Education & Nutritional Support',
        failure_reason: 'Temporary bank server network timeout during 3D Secure verification',
        due_date: formattedDate,
        renewal_date: formattedDate,
        autopay_status: 'Active AutoPay Mandate',
        subscription_id: 'SUB-2026-AP-4412',
        official_upi_id: '340625862653482@cnrb',
        membership_status: 'Active Sustaining Contributor',
        education_impact_update: 'Distributed 200+ textbook and stationery kits to rural government school students across Guntur & Palnadu districts.',
        nutrition_impact_update: 'Provided hot, nutritious meals and fresh fruit baskets daily to 350+ elderly people and orphan children.',
        community_impact_update: 'Conducted 4 free healthcare screening camps providing blood tests, general checkups, and free medicines.',
        students_supported: '120+',
        meals_distributed: '1,850+',
        activities_completed: '8 Major Drives',
        volunteers_involved: '45 Active Volunteers',
        announcement_title: 'Annual Community Service Drive & Free Health Camp 2026',
        announcement_description: 'We are delighted to invite all donors, members, and volunteers to our flagship community outreach program in Palnadu.',
        program_name: 'Kiran Rural Health & Child Nutrition Drive',
        event_date: formattedDate,
        event_time: '10:00 AM – 4:00 PM IST',
        event_location: 'Mandepudi Village Community Center, Amaravathi, Palnadu District',
        initiative_purpose: 'Providing free health consultations, nutrition baskets, and scholarships to deserving children.',
        ...overrides
    };

    return baseData;
}

// -------------------------------------------------------------
// 1. Send OTP Verification Email
// -------------------------------------------------------------
async function sendOtpEmail(email, otp, name) {
    if (!process.env.VERCEL) {
        cleanExpiredSentOtpEmails(3).catch(err => {
            console.warn('⚠️ [AUTO-PURGE NOTICE]:', err.message);
        });
    }

    const firstName = name ? name.split(' ')[0] : (email ? email.split('@')[0] : 'Supporter');
    const subject = 'Your Security Code Is Here – Welcome to Kiran Charitable Trust!';
    const html = renderTemplate('01_otp_verification.html', {
        first_name: firstName,
        otp: String(otp)
    });

    const text = `Dear ${firstName},\n\nWe're glad you're connecting with Kiran Charitable Trust!\n\nYour One-Time Password (OTP) is: ${otp}\nThis code is valid for 10 minutes.\n\nPlease never share this code with anyone.\n\nWarm regards,\nTeam Kiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 2. Send Volunteer Welcome & Onboarding Email
// -------------------------------------------------------------
async function sendVolunteerWelcomeEmail(volunteer) {
    const rawName = volunteer.name || volunteer.fullName || 'Official Volunteer';
    const firstName = rawName.split(' ')[0];
    const volunteerId = volunteer.uniqueId || volunteer.volunteerId || ('KCT-VOL-' + Date.now().toString().slice(-4));
    const regDate = volunteer.registrationDate 
        ? new Date(volunteer.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const fee = volunteer.membershipFee ? `₹${volunteer.membershipFee}` : '₹100 (One-time)';

    const subject = '❤️ Welcome to the Kiran Family! Your Journey of Kindness Begins Here';
    const html = renderTemplate('02_volunteer_welcome.html', {
        first_name: firstName,
        full_name: rawName,
        volunteer_id: volunteerId,
        registration_date: regDate,
        membership_fee: fee,
        status: volunteer.status || 'Active / Verified',
        phone: volunteer.phone || '+91 77024 68889'
    });

    const text = `Dear ${firstName},\n\nWelcome to the Kiran Charitable Trust family! Today, we're happy to welcome you as an official volunteer.\n\nVolunteer ID: ${volunteerId}\nRegistration Date: ${regDate}\nMembership Fee: ${fee}\nStatus: Active\n\nWith heartfelt appreciation,\nVolunteer Coordination Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: volunteer.email, subject, html, text });
}

// -------------------------------------------------------------
// 3. Send Trust Member Welcome & Activation Email
// -------------------------------------------------------------
async function sendTrustMemberWelcomeEmail(member) {
    const memberId = member.memberId || ('KCT-MBR-' + Date.now().toString().slice(-4));
    const idCardNo = member.idCardNo || member.idCardNumber || memberId.replace('KCT-MBR-', 'ID-2026-');
    const rawName = member.name || member.fullName || 'Valued Member';
    const firstName = rawName.split(' ')[0];
    const memberEmail = member.email || '';
    const regDate = member.registrationDate 
        ? new Date(member.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const subject = '❤️ A Warm Welcome to Your New Family – Your Membership Is Active!';
    const html = renderTemplate('03_trust_member_welcome.html', {
        first_name: firstName,
        full_name: rawName,
        member_id: memberId,
        id_card_number: idCardNo,
        registration_date: regDate,
        email: memberEmail
    });

    const text = `Dear ${firstName},\n\nWelcome to the Kiran Charitable Trust family! Your membership is now officially activated.\n\nMember ID: ${memberId}\nDigital ID Card Number: ${idCardNo}\nRegistration Date: ${regDate}\nRegistered Email: ${memberEmail}\n\nWith love and gratitude,\nMembership Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: member.email, subject, html, text });
}

// -------------------------------------------------------------
// 4. Send Successful Donation & 80G Receipt Email
// -------------------------------------------------------------
async function sendPaymentSuccessEmail({ name, email, mobile, address, amount, receiptNumber, transactionId, clientTxnId, purpose, donorCategory, date }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Valued Philanthropist';
    const firstName = rawName.split(' ')[0];
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const rawReceipt = receiptNumber || clientTxnId;
    const safeReceipt = (rawReceipt && rawReceipt !== 'undefined' && rawReceipt !== 'null' && String(rawReceipt).trim() !== '')
        ? String(rawReceipt).trim()
        : ('KCT-' + Date.now().toString().slice(-8));
    const txnRef = transactionId || clientTxnId || ('SP' + Date.now().toString().slice(-8));
    const issueDate = date 
        ? new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }) 
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
    const finalPurpose = purpose || 'Education, Scholarships & Child Nutrition';

    const subject = '❤️ Your Kindness Has Made a Difference – Thank You for Your Contribution!';
    const html = renderTemplate('04_payment_success_80g_receipt.html', {
        first_name: firstName,
        amount: formattedAmount,
        donor_name: rawName,
        receipt_number: safeReceipt,
        transaction_id: txnRef,
        date: issueDate,
        purpose: finalPurpose
    });

    const text = `Dear ${firstName},\n\nThank you for your generous contribution of ₹${formattedAmount} to Kiran Charitable Trust.\n\nReceipt Number: ${safeReceipt}\nTransaction Reference: ${txnRef}\nDate: ${issueDate}\nPurpose: ${finalPurpose}\n\nYour 80G tax document is available in your member portal.\n\nWith heartfelt gratitude,\nDonor Relations Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 5. Send Payment Failed / Incomplete Email
// -------------------------------------------------------------
async function sendPaymentFailureEmail({ name, email, amount, reason, transactionId, retryUrl }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Valued Supporter';
    const firstName = rawName.split(' ')[0];
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const txnRef = transactionId || ('ATTEMPT-' + Date.now().toString().slice(-6));
    const failureDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
    const failureReason = reason || 'Temporary banking network or UPI gateway issue';

    const subject = "A Small Payment Issue – We're Here to Help You ❤️";
    const html = renderTemplate('05_payment_failure.html', {
        first_name: firstName,
        amount: formattedAmount,
        donor_name: rawName,
        transaction_id: txnRef,
        date: failureDate,
        failure_reason: failureReason
    });

    const text = `Dear ${firstName},\n\nWe noticed that your recent contribution attempt of ₹${formattedAmount} could not be confirmed successfully (${failureReason}).\n\nIf debited, funds will automatically reverse back within 3-5 business days.\n\nWarm regards,\nPayment Support Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 6. Send Payment Pending / Verification Notice Email
// -------------------------------------------------------------
async function sendPaymentPendingEmail({ name, email, amount, transactionId, purpose }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Valued Donor';
    const firstName = rawName.split(' ')[0];
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const txnRef = transactionId || ('TXN-' + Date.now().toString().slice(-6));
    const txnDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

    const subject = 'Your Contribution Is Being Verified – Thank You for Your Patience ❤️';
    const html = renderTemplate('06_payment_pending.html', {
        first_name: firstName,
        amount: formattedAmount,
        donor_name: rawName,
        transaction_id: txnRef,
        date: txnDate
    });

    const text = `Dear ${firstName},\n\nThank you for your contribution of ₹${formattedAmount} to Kiran Charitable Trust.\n\nYour transaction (${txnRef}) is currently awaiting confirmation from your bank. We will notify you with your official 80G receipt as soon as verification completes.\n\nWith appreciation,\nPayment Verification Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 7. Send Monthly Recurring / AutoPay Reminder Email
// -------------------------------------------------------------
async function sendMonthlyReminderEmail({ name, email, amount, dueDate, paymentUrl, purpose, subscriptionId, autopayStatus }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Cherished Member';
    const firstName = rawName.split(' ')[0];
    const formattedAmount = Number(amount || 500).toLocaleString('en-IN');
    const formattedDate = dueDate 
        ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Upcoming Cycle';

    const subject = 'A Gentle Reminder of Your Ongoing Kindness ❤️';
    const html = renderTemplate('07_monthly_reminder.html', {
        first_name: firstName,
        amount: formattedAmount,
        due_date: formattedDate,
        autopay_status: autopayStatus || 'Active AutoPay Mandate',
        subscription_id: subscriptionId || 'KCT-SUB-MONTHLY',
        official_upi_id: '340625862653482@cnrb'
    });

    const text = `Dear ${firstName},\n\nThis is a gentle reminder of your recurring monthly contribution of ₹${formattedAmount} due on ${formattedDate}.\n\nThank you for helping us bring hope and stability to those in need.\n\nWith sincere gratitude,\nDonor Care Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 8. Send 30-Day Sustaining Pledge Renewal Email
// -------------------------------------------------------------
async function send30DayRenewalReminderEmail({ name, email, amount, dueDate, paymentUrl, memberId, membershipStatus }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Valued Member';
    const firstName = rawName.split(' ')[0];
    const formattedAmount = Number(amount || 500).toLocaleString('en-IN');
    const formattedDate = dueDate 
        ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Upcoming Renewal Cycle';

    const subject = '❤️ Celebrating 30 Days of Your Generosity – Continuing the Journey of Hope';
    const html = renderTemplate('08_30day_renewal_reminder.html', {
        first_name: firstName,
        full_name: rawName,
        member_id: memberId || 'KCT-MBR-2026',
        amount: formattedAmount,
        renewal_date: formattedDate,
        membership_status: membershipStatus || 'Active Sustaining Contributor',
        official_upi_id: '340625862653482@cnrb'
    });

    const text = `Dear ${firstName},\n\nExactly 30 days ago, you made the meaningful choice to support Kiran Charitable Trust.\n\nRenewal Date: ${formattedDate}\nAmount: ₹${formattedAmount}\nOfficial UPI: 340625862653482@cnrb\n\nWith deep respect and gratitude,\nManaging Trustee & Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 9. Send 30-Day Impact Milestone Update Email
// -------------------------------------------------------------
async function send30DayImpactUpdateEmail({ name, email, educationImpact, nutritionImpact, communityImpact, studentsSupported, mealsDistributed, activitiesCompleted, volunteersInvolved }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Cherished Supporter';
    const firstName = rawName.split(' ')[0];

    const subject = 'Look at What Your Kindness Made Possible This Month! ❤️';
    const html = renderTemplate('09_30day_impact_update.html', {
        first_name: firstName,
        education_impact_update: educationImpact || 'Supported children with learning materials, notebooks, and educational guidance in government schools.',
        nutrition_impact_update: nutritionImpact || 'Provided warm, nutritious meals and dry food kits to elderly citizens and destitute children.',
        community_impact_update: communityImpact || 'Conducted healthcare screening camps and awareness drives in rural villages.',
        students_supported: studentsSupported || '120+',
        meals_distributed: mealsDistributed || '1,850+',
        activities_completed: activitiesCompleted || '8 Drives',
        volunteers_involved: volunteersInvolved || '45 Volunteers'
    });

    const text = `Dear ${firstName},\n\nThank you for standing with us this past month. Here is what your generosity achieved:\n\n• Students Supported: ${studentsSupported || '120+'}\n• Meals Distributed: ${mealsDistributed || '1,850+'}\n• Activities Completed: ${activitiesCompleted || '8 Drives'}\n\nWith heartfelt gratitude,\nCommunity Impact Team\nKiran Charitable Trust`;

    return dispatchEmail({ to: email, subject, html, text });
}

// -------------------------------------------------------------
// 10. Send Custom Donor Announcement / Heartfelt Message Email
// -------------------------------------------------------------
async function sendCustomDonorAnnouncementEmail({ name, email, subject, title, description, programName, eventDate, eventTime, eventLocation, purpose }) {
    const rawName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Valued Supporter';
    const firstName = rawName.split(' ')[0];
    const emailSubject = subject || title || 'An Important Message from Kiran Charitable Trust';

    const html = renderTemplate('10_custom_donor_announcement.html', {
        first_name: firstName,
        announcement_title: title || emailSubject,
        announcement_description: description || 'We are pleased to invite you to our upcoming community welfare initiative.',
        program_name: programName || 'Kiran Community Welfare Program',
        event_date: eventDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        event_time: eventTime || '10:00 AM IST',
        event_location: eventLocation || 'Mandepudi Village Community Hall, Amaravathi, Palnadu District',
        initiative_purpose: purpose || 'Bringing health, nutrition, and education support to underserved families.'
    });

    const text = `Dear ${firstName},\n\n${title || emailSubject}\n\n${description || ''}\n\nEvent: ${programName || 'Community Program'}\nDate: ${eventDate || ''}\nLocation: ${eventLocation || 'Mandepudi, Palnadu'}\n\nWarm regards,\nTeam Kiran Charitable Trust`;

    return dispatchEmail({ to: email, subject: emailSubject, html, text });
}

module.exports = {
    dispatchEmail,
    getTemplate,
    renderTemplate,
    getMockDataForTemplate,
    sendOtpEmail,
    sendVolunteerWelcomeEmail,
    sendTrustMemberWelcomeEmail,
    sendPaymentSuccessEmail,
    sendPaymentPendingEmail,
    sendPaymentFailureEmail,
    sendMonthlyReminderEmail,
    send30DayRenewalReminderEmail,
    send30DayImpactUpdateEmail,
    sendCustomDonorAnnouncementEmail
};
