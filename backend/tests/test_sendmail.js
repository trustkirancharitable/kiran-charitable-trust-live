const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'contact@kirancharitabletrust.org',
    pass: 'Kir@n_Charity@1988'
  }
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: '"Kiran Charitable Trust" <contact@kirancharitabletrust.org>',
      to: 'sfayazmr@gmail.com',
      subject: 'Test Verification OTP: 123456',
      text: 'Your verification OTP code is: 123456'
    });
    console.log('EMAIL SENT SUCCESSFULLY:', info.messageId);
  } catch (err) {
    console.error('SENDMAIL ERROR:', err);
  }
}

main();
