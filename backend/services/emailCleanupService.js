const tls = require('tls');

const IMAP_HOST = process.env.IMAP_HOST || 'imap.secureserver.net';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
const EMAIL_USER = process.env.EMAIL_USER || 'contact@kirancharitabletrust.org';
const EMAIL_PASS = process.env.EMAIL_PASS || 'Kir@n_Charity@1988';

/**
 * Automatically purges sent OTP / Verification Code emails older than `daysOld` (default 3 days)
 * directly from the Titan / GoDaddy "Sent" mailbox over secure IMAP.
 */
function cleanExpiredSentOtpEmails(daysOld = 3) {
    return new Promise((resolve) => {
        if (!EMAIL_PASS || EMAIL_PASS === 'your_email_password') {
            console.log('[EMAIL CLEANUP] Skipped: No email credentials configured.');
            return resolve({ success: false, reason: 'unconfigured' });
        }

        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(cutoffDate.getDate()).padStart(2, '0');
        const mon = months[cutoffDate.getMonth()];
        const year = cutoffDate.getFullYear();
        const imapDate = `${day}-${mon}-${year}`;

        console.log(`[EMAIL CLEANUP] Connecting to ${IMAP_HOST}:993 to purge OTP emails older than ${daysOld} days (sent before ${imapDate})...`);

        let resolved = false;
        const finish = (result) => {
            if (!resolved) {
                resolved = true;
                resolve(result);
            }
        };

        const socket = tls.connect(IMAP_PORT, IMAP_HOST, { rejectUnauthorized: false });
        let tag = 1;
        let buffer = '';
        let deletedCount = 0;

        const send = (cmd) => {
            const t = `A${tag++}`;
            socket.write(`${t} ${cmd}\r\n`);
            return t;
        };

        socket.on('data', (d) => {
            buffer += d.toString();
            const lines = buffer.split('\r\n');
            buffer = lines.pop(); // keep last incomplete chunk

            for (const line of lines) {
                // Greeting from Titan IMAP
                if (line.includes('* OK') && tag === 1) {
                    send(`LOGIN ${EMAIL_USER} ${EMAIL_PASS}`);
                } else if (line.includes('A1 OK')) {
                    // Login successful, select "Sent" folder
                    send('SELECT "Sent"');
                } else if (line.includes('A2 OK')) {
                    // Search for Verification Code emails sent before cutoff date
                    send(`SEARCH BEFORE ${imapDate} TEXT "Verification Code"`);
                } else if (line.startsWith('* SEARCH')) {
                    const ids = line.replace('* SEARCH', '').trim().split(/\s+/).filter(Boolean);
                    deletedCount = ids.length;
                    if (deletedCount > 0) {
                        const range = ids.join(',');
                        console.log(`[EMAIL CLEANUP] Purging ${deletedCount} expired OTP emails from Sent folder...`);
                        send(`STORE ${range} +FLAGS (\\Deleted)`);
                        send('EXPUNGE');
                    } else {
                        console.log(`[EMAIL CLEANUP] Zero OTP emails older than ${daysOld} days found in Sent.`);
                    }
                    send('LOGOUT');
                } else if (line.includes('LOGOUT') || line.includes('BYE')) {
                    socket.end();
                    console.log(`[EMAIL CLEANUP] Completed successfully. Expunged: ${deletedCount} emails.`);
                    finish({ success: true, deletedCount });
                } else if (line.includes('A1 NO') || line.includes('A1 BAD')) {
                    console.warn('[EMAIL CLEANUP] Authentication failed on Titan IMAP.');
                    socket.end();
                    finish({ success: false, reason: 'auth_failed' });
                }
            }
        });

        socket.on('error', (err) => {
            console.warn('[EMAIL CLEANUP] IMAP socket error:', err.message);
            finish({ success: false, error: err.message });
        });

        // Safety timeout of 15 seconds
        setTimeout(() => {
            socket.destroy();
            finish({ success: false, reason: 'timeout' });
        }, 15000);
    });
}

/**
 * Start periodic automated purge of expired sent OTP emails every `intervalHours` (default 24h)
 */
function startAutoCleanupCron(intervalHours = 24) {
    // Initial run 15 seconds after server start
    setTimeout(() => {
        cleanExpiredSentOtpEmails(3).catch(e => console.warn('[EMAIL CLEANUP NOTICE]:', e.message));
    }, 15000);

    // Recurring interval
    const intervalMs = intervalHours * 60 * 60 * 1000;
    setInterval(() => {
        cleanExpiredSentOtpEmails(3).catch(e => console.warn('[EMAIL CLEANUP NOTICE]:', e.message));
    }, intervalMs);

    console.log(`⏰ [EMAIL CLEANUP CRON] Scheduled to auto-purge sent OTP emails older than 3 days from Titan every ${intervalHours} hours.`);
}

module.exports = {
    cleanExpiredSentOtpEmails,
    startAutoCleanupCron
};
