
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

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { cleanExpiredSentOtpEmails } = require('./emailCleanupService');

// Ultra-lightweight low-bandwidth 2.66 KB logo optimized specifically for email delivery
const EMAIL_LOGO_PATH = path.join(__dirname, '../assets/email-logo-low.jpg');

const SMTP_HOST = process.env.SMTP_HOST || 'smtpout.secureserver.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER || 'contact@kirancharitabletrust.org';
const EMAIL_PASS = process.env.EMAIL_PASS || 'Kir@n_Charity@1988';

let transporter = null;

function getTransporter() {
    if (!transporter && EMAIL_PASS && EMAIL_PASS !== 'your_email_password') {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE, // true for 465 SSL
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
        console.log(`Body preview:\n${text || html.slice(0, 300)}...`);
        return { success: true, simulated: true, to };
    }

    // Default ultra-lightweight logo attachment (2.66 KB) if available on disk
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
        // Do not crash registration or payment flows if SMTP encounters error
        return { success: false, error: err.message };
    }
}

// 1. Send 6-Digit OTP Email (With Low-Bandwidth Logo & 3-Day Auto-Purge Trigger)
async function sendOtpEmail(email, otp) {
    // Non-blocking trigger: purge sent OTP emails older than 3 days from Titan Sent folder in long-running processes
    if (!process.env.VERCEL) {
        cleanExpiredSentOtpEmails(3).catch(err => {
            console.warn('⚠️ [AUTO-PURGE NOTICE]:', err.message);
        });
    }

    const subject = `Your Verification Code: ${otp} - Kiran Charitable Trust`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #2563EB; padding: 24px; text-align: center; color: white;">
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="cid:kctlogo" alt="Kiran Charitable Trust" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain; background: #ffffff; border-radius: 10px; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.18);" />
            </div>
            <h1 style="margin: 0; font-size: 23px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Kiran Charitable Trust</h1>
            <p style="margin: 5px 0 0; opacity: 0.9; font-size: 13.5px; color: #ffffff;">Serving Guntur &amp; Palnadu Since 2026</p>
        </div>
        <div style="padding: 32px 24px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">One-Time Verification Code</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                Use the security code below to complete your login / registration with Kiran Charitable Trust. This code will expire in <strong>10 minutes</strong>.
            </p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; text-align: center; margin: 28px 0; border: 2px dashed #cbd5e1;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563EB;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                If you did not request this OTP, please disregard this email. Never share this code with anyone.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Kiran Charitable Trust • Regd No: 2026/GNT • Guntur, Andhra Pradesh, India
        </div>
    </div>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Your Kiran Charitable Trust verification code is: ${otp}. Valid for 10 minutes.`
    });
}

// 2. Send Volunteer Welcome & ID Confirmation
async function sendVolunteerWelcomeEmail(volunteer) {
    const subject = `Welcome to the Kiran Trust Family, ${volunteer.name}! (Volunteer ID: ${volunteer.uniqueId || 'KCT-VOL'})`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #10B981; padding: 24px; text-align: center; color: white;">
            <div style="margin-bottom: 8px;">
                <img src="cid:kctlogo" alt="Kiran Logo" width="48" height="48" style="display: inline-block; width: 48px; height: 48px; border-radius: 8px; object-fit: contain; background: #ffffff; padding: 2px;" />
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Official Volunteer Enrollment</h1>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Kiran Charitable Trust • Dedicated Community Member</p>
        </div>
        <div style="padding: 28px 22px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Dear ${volunteer.name},</h2>
            <p style="font-size: 14.5px; line-height: 1.6; color: #475569;">
                Thank you for stepping forward to serve the community of Guntur and Palnadu districts. Your registration as an Official Volunteer is officially active.
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #10B981; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 13.5px;"><strong>Volunteer ID:</strong> <span style="color: #2563EB; font-weight: 700;">${volunteer.uniqueId}</span></p>
                <p style="margin: 0 0 8px; font-size: 13.5px;"><strong>Membership Fee:</strong> ₹${volunteer.membershipFee} (Confirmed)</p>
                <p style="margin: 0 0 8px; font-size: 13.5px;"><strong>Contact Phone:</strong> ${volunteer.phone}</p>
                <p style="margin: 0; font-size: 13.5px;"><strong>Registered Address:</strong> ${volunteer.address}</p>
            </div>
            <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
                You can log into your member dashboard anytime to download your Official Digital Volunteer ID Card and track upcoming service programs.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Kiran Charitable Trust • Serving Humanity With Love &amp; Compassion
        </div>
    </div>`;

    return dispatchEmail({
        to: volunteer.email,
        subject,
        html,
        text: `Welcome ${volunteer.name}! Your Volunteer ID is ${volunteer.uniqueId}. Membership fee ₹${volunteer.membershipFee} confirmed.`
    });
}

// 3. Send Trust Member Welcome & Next Month Schedule Notice
async function sendTrustMemberWelcomeEmail(member) {
    const memberId = member.memberId || ('KCT-MBR-' + Date.now().toString().slice(-4));
    const idCardNo = member.idCardNo || memberId.replace('KCT-MBR-', 'ID-2026-');
    const memberName = member.name || member.fullName || 'Valued Member';
    const memberEmail = member.email || '';
    const origin = process.env.CLIENT_URL || 'http://localhost:5173';
    const portalLoginUrl = `${origin}/portal/login`;

    const subject = 'Your Kiran Charitable Trust Membership Is Activated';
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0b1a30 0%, #1e3a8a 100%); padding: 26px 20px; text-align: center; color: white;">
            <div style="margin-bottom: 10px;">
                <img src="cid:kctlogo" alt="Kiran Charitable Trust Logo" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; border-radius: 8px; object-fit: contain; background: #ffffff; padding: 2px;" />
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">KIRAN CHARITABLE TRUST</h1>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px; color: #93c5fd;">Official Trust Member Enrollment &amp; Standing</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Dear ${memberName},</h2>
            <p style="font-size: 14.5px; line-height: 1.6; color: #334155;">
                Welcome to <strong>Kiran Charitable Trust</strong>. Your official membership has been successfully activated.
            </p>

            <!-- Credential Box Matching Blueprint Spec -->
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin: 22px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-size: 13.5px; color: #64748b; border-bottom: 1px solid #e2e8f0;">👤 <strong>Member ID:</strong></td>
                        <td style="padding: 8px 0; text-align: right; font-size: 14.5px; color: #0f52ba; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${memberId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13.5px; color: #64748b; border-bottom: 1px solid #e2e8f0;">🪪 <strong>ID Card No.:</strong></td>
                        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #0f172a; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${idCardNo}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13.5px; color: #64748b;">✉️ <strong>Email ID:</strong></td>
                        <td style="padding: 8px 0; text-align: right; font-size: 13.5px; color: #0f172a; font-weight: 600;">${memberEmail}</td>
                    </tr>
                </table>
            </div>

            <!-- Portal CTA Button -->
            <div style="text-align: center; margin: 28px 0 20px;">
                <a href="${portalLoginUrl}" style="display: inline-block; background: #0052cc; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,82,204,0.25);">
                    Access Trust Member Portal &rarr;
                </a>
            </div>

            <p style="font-size: 13.5px; line-height: 1.6; color: #64748b; text-align: center; margin: 0;">
                You can log in to your account, view your digital ID card, manage monthly contributions, and track your humanitarian impact anytime.
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Kiran Charitable Trust • Regd. No. 462/2004 under AP Societies Act • 80G &amp; 12A Certified<br/>
            Mandepudi, Amaravathi, Palnadu - 522018, Andhra Pradesh
        </div>
    </div>`;

    return dispatchEmail({
        to: member.email,
        subject,
        html,
        text: `Welcome ${memberName}!\n\nYour Kiran Charitable Trust membership has been activated.\n\nMember ID: ${memberId}\nID Card No.: ${idCardNo}\nRegistered Email: ${memberEmail}\n\nAccess your portal at: ${portalLoginUrl}`
    });
}


// 4. Send Official Donation Receipt Email (Fully Mobile-Responsive, Clean & Professional, Form 10BE Compliant)
async function sendPaymentSuccessEmail({ name, email, mobile, address, amount, receiptNumber, transactionId, clientTxnId, purpose, donorCategory, date }) {
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const amountWords = numberToWords(amount);
    
    // Guarantee receipt number is never undefined, null, or empty string
    const rawReceipt = receiptNumber || clientTxnId;
    const safeReceipt = (rawReceipt && rawReceipt !== 'undefined' && rawReceipt !== 'null' && String(rawReceipt).trim() !== '')
        ? String(rawReceipt).trim()
        : ('KCT-' + Date.now().toString().slice(-8) + '-' + Math.floor(100000 + Math.random() * 900000));
        
    const txnRef = transactionId || clientTxnId || 'SP' + Date.now().toString().slice(-10);
    const issueDate = date 
        ? new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }) 
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
        
    const isMonthly = (donorCategory && donorCategory.toLowerCase().includes('monthly')) || (purpose && purpose.toLowerCase().includes('monthly'));
    const finalDonorName = (name && name !== 'undefined' && name.trim()) ? name.trim() : 'Valued Philanthropist';
    const finalAddress = (address && address !== 'undefined' && address.trim()) ? address.trim() : 'Registered Donor Address On Record';
    const cleanPhone = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : '';
    const formattedPhone = cleanPhone ? `+91 ${cleanPhone}` : 'Provided Online';

    const subject = `Official Donation Receipt [Receipt #${safeReceipt}] - Kiran Charitable Trust`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${subject}</title>
    <style type="text/css">
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
        @media only screen and (max-width: 600px) {
            .email-outer-table { width: 100% !important; padding: 8px !important; }
            .email-main-card { width: 100% !important; border-radius: 8px !important; }
            .header-td { padding: 14px 16px !important; }
            .content-td { padding: 16px !important; }
            .meta-td { display: block !important; width: 100% !important; text-align: left !important; padding: 6px 12px !important; }
            .amount-val { font-size: 20px !important; }
            .signature-td { display: block !important; width: 100% !important; text-align: center !important; padding-top: 14px !important; border-left: none !important; border-top: 1px solid #e2e8f0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <table class="email-outer-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 10px;">
        <tr>
            <td align="center">
                <!-- Main Container Card -->
                <table class="email-main-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
                    
                    <!-- 1. Header with Trust Logo -->
                    <tr>
                        <td class="header-td" style="padding: 18px 24px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="52" valign="middle" style="padding-right: 14px;">
                                        <img src="cid:kctlogo" alt="Kiran Charitable Trust Logo" width="50" height="50" style="display: block; width: 50px; height: 50px; border-radius: 8px; object-fit: contain; border: 1px solid #e2e8f0;" />
                                    </td>
                                    <td valign="middle" style="border-left: 2px solid #0f52ba; padding-left: 14px;">
                                        <div style="font-size: 19px; font-weight: 800; color: #0b1a38; letter-spacing: -0.3px; line-height: 1.2;">
                                            Kiran Charitable Trust
                                        </div>
                                        <div style="font-size: 11.5px; font-weight: 600; color: #475569; margin-top: 3px; line-height: 1.4;">
                                            Healthcare • Education • Orphan Support • Food Security • Rural Empowerment
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- 2. Navy Hero Banner -->
                    <tr>
                        <td style="background-color: #07152d; padding: 22px 20px; text-align: center; color: #ffffff;">
                            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: #fbbf24; text-transform: uppercase;">
                                GOVERNMENT OF INDIA RECOGNIZED NGO
                            </div>
                            <div style="font-size: 22px; font-weight: 900; letter-spacing: 0.5px; color: #ffffff; margin: 8px 0 4px; text-transform: uppercase;">
                                KIRAN CHARITABLE TRUST
                            </div>
                            <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.5; margin: 4px 0 8px;">
                                Registered Office: Mandepudi, Nemalkallu, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
                                <a href="mailto:contact@kirancharitabletrust.org" style="color: #cbd5e1; text-decoration: none;">contact@kirancharitabletrust.org</a> &nbsp;|&nbsp; +91 77024 68889 &nbsp;|&nbsp; <a href="https://www.kirancharitabletrust.org" style="color: #cbd5e1; text-decoration: none;">www.kirancharitabletrust.org</a>
                            </div>
                        </td>
                    </tr>

                    <!-- 3. Body Content Area -->
                    <tr>
                        <td class="content-td" style="padding: 24px 22px;">
                            
                            <!-- Official Receipt Badge -->
                            <div style="text-align: center; margin-bottom: 18px;">
                                <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 12px; font-weight: 800; padding: 6px 18px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px;">
                                    OFFICIAL DONATION RECEIPT
                                </div>
                                <div style="margin-top: 6px; font-size: 11.5px; color: #64748b;">
                                    Thank you for your generous sustaining support towards our community initiatives.
                                </div>
                            </div>

                            <!-- Receipt Meta Bar -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 18px;">
                                <tr>
                                    <td class="meta-td" style="padding: 10px 14px; font-size: 12px; color: #475569;">
                                        <strong>Receipt No:</strong> <span style="color: #0f52ba; font-weight: 800; font-family: monospace; font-size: 12.5px;">${safeReceipt}</span>
                                    </td>
                                    <td class="meta-td" style="padding: 10px 14px; font-size: 12px; color: #475569; text-align: right;">
                                        <strong>Date &amp; Time:</strong> ${issueDate}
                                    </td>
                                </tr>
                            </table>

                            <!-- 4. Donor Identification Particulars Card -->
                            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; background-color: #ffffff;">
                                <div style="font-size: 11px; font-weight: 800; color: #07152d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                                    DONOR DETAILS
                                </div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12.5px; line-height: 1.75;">
                                    <tr>
                                        <td width="38%" style="color: #64748b; vertical-align: top; padding: 2px 0;">Donor Full Name:</td>
                                        <td style="font-weight: 700; color: #0f172a; text-transform: uppercase; padding: 2px 0;">${finalDonorName}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; vertical-align: top; padding: 2px 0;">Email Address:</td>
                                        <td style="color: #0f52ba; font-weight: 600; padding: 2px 0;"><a href="mailto:${email}" style="color: #0f52ba; text-decoration: none;">${email}</a></td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; vertical-align: top; padding: 2px 0;">Contact Mobile:</td>
                                        <td style="color: #0f172a; padding: 2px 0;">${formattedPhone}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; vertical-align: top; padding: 2px 0;">Residential Address:</td>
                                        <td style="color: #0f172a; padding: 2px 0;">${finalAddress}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; vertical-align: top; padding: 2px 0;">Contribution Mode:</td>
                                        <td style="color: #0f172a; font-weight: 600; padding: 2px 0;">
                                            ${isMonthly ? 'Automated Monthly AutoPay Mandate' : 'Charitable Contribution'}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- 5. Description & Amount Table -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 20px; font-size: 12.5px; background-color: #ffffff;">
                                <thead>
                                    <tr style="background-color: #07152d; color: #ffffff;">
                                        <th style="padding: 10px 14px; text-align: left; font-weight: 800; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Description / Cause
                                        </th>
                                        <th style="padding: 10px 14px; text-align: right; font-weight: 800; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">
                                            Amount (INR)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 14px; vertical-align: middle; background-color: #ffffff;">
                                            <div style="font-weight: 800; font-size: 13.5px; color: #0f172a;">
                                                ${purpose || 'General Trust Social Welfare & Community Drives'}
                                            </div>
                                            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
                                                Payment Gateway: SabPaisa PG (Canara Bank Verified)
                                            </div>
                                        </td>
                                        <td style="padding: 14px; text-align: right; vertical-align: middle; background-color: #eff6ff;">
                                            <div class="amount-val" style="font-size: 22px; font-weight: 900; color: #0f52ba;">
                                                ₹${formattedAmount}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <td colspan="2" style="padding: 9px 14px; font-size: 12px; color: #334155;">
                                            <strong>Amount in Words:</strong> ${amountWords}
                                        </td>
                                    </tr>
                                    <tr style="background-color: #ffffff;">
                                        <td style="padding: 9px 14px; font-size: 11.5px; color: #475569;">
                                            <strong>Transaction Reference:</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${txnRef}</span>
                                        </td>
                                        <td style="padding: 9px 14px; text-align: right; font-size: 11.5px;">
                                            <strong>Payment Status:</strong> <span style="color: #16a34a; font-weight: 900;">CONFIRMED / PAID</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <!-- 6. Electronic Signature & Verification Block -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                                <tr>
                                    <td width="55%" class="signature-td" style="vertical-align: middle; padding-right: 10px;">
                                        <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Computer Verified Receipt</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Electronic transaction confirmation record.</div>
                                    </td>
                                    <td width="45%" class="signature-td" style="text-align: right; vertical-align: middle; border-left: 1px solid #e2e8f0; padding-left: 14px;">
                                        <div style="font-family: 'Brush Script MT', cursive, Georgia, serif; font-size: 20px; font-weight: bold; color: #0f172a;">
                                            P. Kiranbabu
                                        </div>
                                        <div style="font-size: 12px; font-weight: 800; color: #0f52ba; margin-top: 1px;">Pallepogu Kiranbabu</div>
                                        <div style="font-size: 10.5px; color: #475569;">Founder &amp; Managing Trustee</div>
                                        <div style="font-size: 10px; color: #94a3b8;">Kiran Charitable Trust</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- 7. Footer Note -->
                    <tr>
                        <td style="background-color: #07152d; color: #cbd5e1; padding: 14px 18px; text-align: center; font-size: 11px; line-height: 1.6; border-top: 2px solid #0f52ba;">
                            Need assistance? Email <a href="mailto:contact@kirancharitabletrust.org" style="color: #38bdf8; text-decoration: none;">contact@kirancharitabletrust.org</a> or WhatsApp <a href="https://wa.me/917702468889" style="color: #38bdf8; text-decoration: none;">+91 77024 68889</a>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Official Donation Receipt #${safeReceipt} - Kiran Charitable Trust. Donor: ${finalDonorName}. Amount: ₹${formattedAmount} (${amountWords}). Txn ID: ${txnRef}. Thank you for your support.`
    });
}

// 5. Send Payment Failure Email with Proper Transaction Details & 1-Click Retry
async function sendPaymentFailureEmail({ name, email, amount, reason, transactionId, retryUrl }) {
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const defaultUrl = 'https://www.kirancharitabletrust.org/donate';
    const actionUrl = retryUrl || defaultUrl;
    const failureDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
    const txnRef = transactionId || ('ATTEMPT-' + Date.now().toString().slice(-6));

    const subject = `Payment Incomplete Notice (Attempt of ₹${formattedAmount}) - Kiran Charitable Trust`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 20px 10px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 16px 20px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="48" valign="middle">
                                        <img src="cid:kctlogo" alt="Kiran Logo" width="46" height="46" style="display: block; width: 46px; height: 46px; border-radius: 8px; object-fit: contain; border: 1px solid #e2e8f0;" />
                                    </td>
                                    <td valign="middle" style="padding-left: 12px; border-left: 2px solid #dc2626;">
                                        <div style="font-size: 17px; font-weight: 800; color: #0b1a38; line-height: 1.2;">Kiran Charitable Trust</div>
                                        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">Official Transaction Notice</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Banner -->
                    <tr>
                        <td style="background-color: #991b1b; padding: 20px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Payment Not Completed</h1>
                            <p style="margin: 6px 0 0; font-size: 12px; color: #fecaca;">Banking Network Transaction Notice</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 24px 20px; color: #1e293b;">
                            <h2 style="margin-top: 0; font-size: 16px; color: #0f172a;">Dear ${name || 'Valued Donor'},</h2>
                            <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
                                We noticed that your recent contribution attempt of <strong>₹${formattedAmount}</strong> could not be completed by your bank or card network.
                            </p>
                            <!-- Details Box -->
                            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 18px 0;">
                                <div style="font-size: 11px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">Attempt Details</div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12.5px; line-height: 1.7;">
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Attempted Amount:</td>
                                        <td style="font-weight: 800; color: #991b1b; text-align: right;">₹${formattedAmount}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Reference ID:</td>
                                        <td style="color: #0f172a; text-align: right; font-family: monospace;">${txnRef}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Date &amp; Time:</td>
                                        <td style="color: #0f172a; text-align: right;">${failureDate}</td>
                                    </tr>
                                    ${reason ? `<tr>
                                        <td style="color: #64748b; padding: 2px 0;">Reason:</td>
                                        <td style="color: #dc2626; font-weight: 600; text-align: right;">${reason}</td>
                                    </tr>` : ''}
                                </table>
                            </div>
                            <!-- Safe Note -->
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; margin-bottom: 20px; font-size: 12.5px; color: #1e3a8a; line-height: 1.5;">
                                <strong>Did your bank deduct money?</strong><br/>
                                If any amount was debited from your account, it is 100% safe. Banking networks automatically reverse and credit it back to your source account within <strong>3 to 5 business days</strong> per RBI rules.
                            </div>
                            <!-- Retry Button -->
                            <div style="text-align: center; margin: 24px 0;">
                                <a href="${actionUrl}" style="background-color: #0f52ba; color: #ffffff; padding: 13px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                                    Retry Contribution Online
                                </a>
                            </div>
                            <!-- Help Details -->
                            <div style="text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                                Need assistance? Call: <strong>+91 77024 68889</strong> | WhatsApp: <a href="https://wa.me/917702468889" style="color: #0f52ba; text-decoration: none;">+91 77024 68889</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #07152d; color: #cbd5e1; padding: 12px; text-align: center; font-size: 11px;">
                            Kiran Charitable Trust • Mandepudi, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Hello ${name}, your transaction attempt of ₹${formattedAmount} at Kiran Charitable Trust was not completed (${reason || 'Bank declined'}). If debited, funds will be auto-refunded within 3-5 business days. Retry here: ${actionUrl}`
    });
}

// 5b. Send Payment Pending / Verification In Progress Notice
async function sendPaymentPendingEmail({ name, email, amount, transactionId, purpose }) {
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const txnRef = transactionId || ('TXN-' + Date.now().toString().slice(-6));
    const txnDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
    const subject = `Payment Under Verification (₹${formattedAmount}) - Kiran Charitable Trust`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 20px 10px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 16px 20px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="48" valign="middle">
                                        <img src="cid:kctlogo" alt="Kiran Logo" width="46" height="46" style="display: block; width: 46px; height: 46px; border-radius: 8px; object-fit: contain; border: 1px solid #e2e8f0;" />
                                    </td>
                                    <td valign="middle" style="padding-left: 12px; border-left: 2px solid #d97706;">
                                        <div style="font-size: 17px; font-weight: 800; color: #0b1a38; line-height: 1.2;">Kiran Charitable Trust</div>
                                        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">Bank Verification In Progress</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Banner -->
                    <tr>
                        <td style="background-color: #b45309; padding: 20px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Payment Under Verification</h1>
                            <p style="margin: 6px 0 0; font-size: 12px; color: #fef3c7;">Banking Network Settlement Awaited</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 24px 20px; color: #1e293b;">
                            <h2 style="margin-top: 0; font-size: 16px; color: #0f172a;">Dear ${name || 'Valued Donor'},</h2>
                            <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
                                Your contribution of <strong>₹${formattedAmount}</strong> has been received by our gateway and is awaiting final reconciliation from your bank or UPI app.
                            </p>
                            <!-- Details Box -->
                            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 18px 0;">
                                <div style="font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">Transaction Status Details</div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12.5px; line-height: 1.7;">
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Amount:</td>
                                        <td style="font-weight: 800; color: #b45309; text-align: right;">₹${formattedAmount}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Transaction ID:</td>
                                        <td style="color: #0f172a; text-align: right; font-family: monospace;">${txnRef}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Date &amp; Time:</td>
                                        <td style="color: #0f172a; text-align: right;">${txnDate}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; padding: 2px 0;">Current Status:</td>
                                        <td style="color: #d97706; font-weight: 700; text-align: right;">AWAITING BANK CONFIRMATION</td>
                                    </tr>
                                </table>
                            </div>
                            <!-- Note -->
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; margin-bottom: 20px; font-size: 12.5px; color: #1e3a8a; line-height: 1.5;">
                                <strong>What happens next?</strong><br/>
                                Bank settlements typically clear within a few minutes. As soon as your bank confirms the transfer, your official <strong>Form 10BE 80G Tax Exemption Receipt</strong> will be emailed to you immediately.
                            </div>
                            <!-- Contact -->
                            <div style="text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                                Questions regarding your transfer? WhatsApp: <a href="https://wa.me/917702468889" style="color: #0f52ba; text-decoration: none;">+91 77024 68889</a> | Email: contact@kirancharitabletrust.org
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #07152d; color: #cbd5e1; padding: 12px; text-align: center; font-size: 11px;">
                            Kiran Charitable Trust • Mandepudi, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Dear ${name}, your donation of ₹${formattedAmount} (Txn ID: ${txnRef}) is currently being confirmed by your bank. Your 80G tax receipt will be emailed as soon as confirmation is received.`
    });
}

// 6. Send Monthly Recurring Reminder Email
async function sendMonthlyReminderEmail({ name, email, amount, dueDate, paymentUrl }) {
    const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    const subject = `Monthly Trust Donation Due Reminder (₹${amount}) - Kiran Charitable Trust`;
    const actionUrl = paymentUrl || 'https://www.kirancharitabletrust.org/donate';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #2563eb; padding: 24px; text-align: center; color: white;">
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="cid:kctlogo" alt="Kiran Charitable Trust" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain; background: #ffffff; border-radius: 10px; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.18);" />
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Monthly Contribution Reminder</h1>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px; color: #ffffff;">Kiran Charitable Trust Monthly Member Program</p>
        </div>
        <div style="padding: 32px 24px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Dear ${name},</h2>
            <p style="font-size: 14.5px; line-height: 1.6; color: #475569;">
                Thank you for being a pillar of Kiran Charitable Trust. This is a gentle reminder that your monthly donation pledge of <strong>₹${Number(amount).toLocaleString('en-IN')}</strong> is due on <strong>${formattedDate}</strong>.
            </p>
            <div style="background: #eef2ff; border-left: 4px solid #2563eb; padding: 18px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 6px; font-size: 14px;"><strong>Pledged Amount:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
                <p style="margin: 0; font-size: 14px;"><strong>Due Date:</strong> ${formattedDate}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                    Complete Monthly Donation (₹${Number(amount).toLocaleString('en-IN')})
                </a>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                After payment, your official 80G Tax Exemption Certificate will be issued automatically and your active standing refreshed.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Kiran Charitable Trust • Mandepudi, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
        </div>
    </div>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Dear ${name}, your monthly donation of ₹${amount} is due on ${formattedDate}. Complete it here: ${actionUrl}`
    });
}

// 7. Send Exact 30-Day Renewal Reminder Template
async function send30DayRenewalReminderEmail({ name, email, amount, dueDate, paymentUrl, scheduleId }) {
    const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    const formattedAmount = Number(amount || 500).toLocaleString('en-IN');
    const subject = `[Renewal Notice] Your 30-Day Sustaining Pledge (₹${formattedAmount}) is Due - Kiran Charitable Trust`;
    const actionUrl = paymentUrl || 'https://www.kirancharitabletrust.org/donate';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <!-- Blue Header with Logo -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 26px 20px; text-align: center; color: white;">
            <div style="text-align: center; margin-bottom: 12px;">
                <img src="cid:kctlogo" alt="Kiran Charitable Trust" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain; background: #ffffff; border-radius: 10px; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
            </div>
            <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Section 80G Certified Monthly Membership
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">30-Day Sustaining Pledge Renewal</h1>
            <p style="margin: 6px 0 0; opacity: 0.92; font-size: 13.5px; color: #ffffff;">Automated Monthly Giving Commitment • Schedule Ref: ${scheduleId || 'SCH-MONTHLY'}</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Dear ${name || 'Valued Member'},</h2>
            <p style="font-size: 14.5px; line-height: 1.6; color: #475569;">
                Thank you for being an indispensable pillar of hope for <strong>Kiran Charitable Trust</strong>. Exactly 30 days have elapsed since your last monthly sustaining commitment cycle.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Your recurring support directly provides nutritious hot meals to impoverished elders, distributes textbooks and uniforms to underprivileged students, and funds emergency rural medical camps in Palnadu &amp; Guntur.
            </p>

            <!-- Commitment Breakdown Card -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; font-weight: 800;">
                    Commitment Schedule Details
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                    <tr>
                        <td style="color: #64748b; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">Member Name:</td>
                        <td style="color: #0f172a; font-weight: 700; padding: 6px 0; text-align: right; border-bottom: 1px solid #f1f5f9;">${name}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">Pledged Monthly Amount:</td>
                        <td style="color: #059669; font-weight: 800; font-size: 16px; padding: 6px 0; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${formattedAmount}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">Billing Cycle:</td>
                        <td style="color: #0f172a; font-weight: 600; padding: 6px 0; text-align: right; border-bottom: 1px solid #f1f5f9;">Every 30 Days (Monthly Sustaining)</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">Renewal Due Date:</td>
                        <td style="color: #2563eb; font-weight: 700; padding: 6px 0; text-align: right; border-bottom: 1px solid #f1f5f9;">${formattedDate}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 6px 0;">Tax Deduction:</td>
                        <td style="color: #0f172a; font-weight: 600; padding: 6px 0; text-align: right;">50% Exempt under Section 80G</td>
                    </tr>
                </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="${actionUrl}" style="background: #2563eb; color: #ffffff; padding: 15px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.28);">
                    Renew Monthly Contribution (₹${formattedAmount})
                </a>
                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                    Instant 80G tax receipt generated and emailed immediately upon confirmation.
                </div>
            </div>

            <!-- Bank / UPI Option Note -->
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 6px; font-size: 13px; color: #1e3a8a; line-height: 1.5; margin-bottom: 24px;">
                <strong>Direct Bank Transfer Option:</strong><br/>
                Canara Bank | A/C: <strong>120038848782</strong> | IFSC: <strong>CNRB0013324</strong><br/>
                Account Name: <strong>Kiran Charitable Trust</strong> | Branch: <strong>Mandepudi</strong>
            </div>

            <!-- Help Contact -->
            <div style="text-align: center; font-size: 12.5px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 18px;">
                Need assistance or want to update your pledge tier?<br/>
                Phone / WhatsApp: <a href="https://wa.me/917702468889" style="color: #059669; font-weight: 700; text-decoration: none;">+91 77024 68889</a> | Email: <a href="mailto:contact@kirancharitabletrust.org" style="color: #2563eb; text-decoration: none;">contact@kirancharitabletrust.org</a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
            Kiran Charitable Trust • Mandepudi, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh<br/>
            Registered NGO No. 4/2026/BKIV • NITI Aayog Darpan: AP/2026/0123456 • 12A &amp; 80G Certified
        </div>
    </div>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Dear ${name}, your monthly sustaining donation of ₹${formattedAmount} is due on ${formattedDate}. Complete your renewal here: ${actionUrl}`
    });
}

// 8. Send 30-Day Impact Milestone & Gratitude Email Template
async function send30DayImpactUpdateEmail({ name, email, amount, paymentUrl, scheduleId }) {
    const formattedAmount = Number(amount || 500).toLocaleString('en-IN');
    const subject = `Your 30-Day Giving Impact Report - Kiran Charitable Trust`;
    const actionUrl = paymentUrl || 'https://www.kirancharitabletrust.org/donate';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 26px 20px; text-align: center; color: white;">
            <div style="text-align: center; margin-bottom: 12px;">
                <img src="cid:kctlogo" alt="Kiran Charitable Trust" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain; background: #ffffff; border-radius: 10px; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Your 30-Day Community Impact Report</h1>
            <p style="margin: 6px 0 0; opacity: 0.92; font-size: 13.5px; color: #ffffff;">Thank you for empowering lives in Palnadu &amp; Guntur</p>
        </div>

        <div style="padding: 32px 24px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Dear ${name || 'Cherished Supporter'},</h2>
            <p style="font-size: 14.5px; line-height: 1.6; color: #475569;">
                Over the past 30 days, your consistent monthly giving has turned compassion into measurable, life-changing ground reality. Here is what your collective support achieved this past month:
            </p>

            <div style="display: table; width: 100%; margin: 24px 0;">
                <div style="display: table-cell; width: 33.3%; text-align: center; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                    <div style="font-size: 22px; font-weight: 800; color: #059669;">1,250+</div>
                    <div style="font-size: 12px; color: #166534; font-weight: 600; margin-top: 4px;">Hot Meals Distributed</div>
                </div>
                <div style="width: 10px; display: table-cell;"></div>
                <div style="display: table-cell; width: 33.3%; text-align: center; padding: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
                    <div style="font-size: 22px; font-weight: 800; color: #2563eb;">45</div>
                    <div style="font-size: 12px; color: #1e40af; font-weight: 600; margin-top: 4px;">Student School Kits</div>
                </div>
                <div style="width: 10px; display: table-cell;"></div>
                <div style="display: table-cell; width: 33.3%; text-align: center; padding: 14px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
                    <div style="font-size: 22px; font-weight: 800; color: #ca8a04;">2</div>
                    <div style="font-size: 12px; color: #854d0e; font-weight: 600; margin-top: 4px;">Rural Health Camps</div>
                </div>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                As we embark on the next 30 days of community service, your continued monthly partnership makes all this possible without interruption.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background: #059669; color: #ffffff; padding: 14px 34px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                    Sustain Next 30-Day Cycle (₹${formattedAmount})
                </a>
            </div>
        </div>

        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Kiran Charitable Trust • Mandepudi, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
        </div>
    </div>`;

    return dispatchEmail({
        to: email,
        subject,
        html,
        text: `Dear ${name}, thank you for your 30-day sustaining support of ₹${formattedAmount}. View our impact report and renew your pledge: ${actionUrl}`
    });
}

// 9. Send Custom Admin Broadcast / Announcement Email Template
async function sendCustomDonorAnnouncementEmail({ name, email, subject, message, actionUrl, actionText }) {
    const emailSubject = subject || 'Official Update from Kiran Charitable Trust';
    const ctaUrl = actionUrl || 'https://www.kirancharitabletrust.org';
    const ctaText = actionText || 'Visit Official Trust Portal';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <div style="background: #1e3a8a; padding: 24px 20px; text-align: center; color: white;">
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="cid:kctlogo" alt="Kiran Charitable Trust" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain; background: #ffffff; border-radius: 10px; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">Kiran Charitable Trust</h1>
            <p style="margin: 5px 0 0; opacity: 0.9; font-size: 13px; color: #ffffff;">Official Community Announcement</p>
        </div>

        <div style="padding: 30px 24px; color: #1e293b;">
            <h2 style="margin-top: 0; font-size: 17px; color: #0f172a;">Dear ${name || 'Valued Donor & Supporter'},</h2>
            <div style="font-size: 14.5px; line-height: 1.7; color: #334155; white-space: pre-line;">
                ${message}
            </div>

            <div style="text-align: center; margin: 32px 0;">
                <a href="${ctaUrl}" style="background: #2563eb; color: #ffffff; padding: 13px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14.5px; display: inline-block;">
                    ${ctaText}
                </a>
            </div>

            <div style="text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                Need assistance? WhatsApp: +91 77024 68889 | contact@kirancharitabletrust.org
            </div>
        </div>

        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Kiran Charitable Trust • Mandepudi, Amaravathi, Palnadu, Guntur - 522018, Andhra Pradesh
        </div>
    </div>`;

    return dispatchEmail({
        to: email,
        subject: emailSubject,
        html,
        text: `Dear ${name},\n\n${message}\n\n${ctaUrl}`
    });
}

module.exports = {
    dispatchEmail,
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
