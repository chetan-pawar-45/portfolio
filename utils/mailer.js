/* ═══════════════════════════════════════════════
   MAILER UTILITY — Nodemailer email sender
   ═══════════════════════════════════════════════
   Sends a notification email to you whenever
   someone submits the contact form.
   ═══════════════════════════════════════════════ */

const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send notification email when a new contact message is received.
 * @param {{ name: string, email: string, subject?: string, message: string }} data
 */
async function sendNotificationEmail({ name, email, subject, message }) {
    // Skip if email credentials are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('📧 Email not configured — skipping notification.');
        return;
    }

    const mailOptions = {
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: email,
        subject: `🔔 New Portfolio Message: ${subject || 'No Subject'}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #e2e8f0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #00c9ff, #0072ff); padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; color: #fff;">📬 New Contact Message</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Someone reached out through your portfolio!</p>
                </div>

                <!-- Body -->
                <div style="padding: 32px 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #718096; font-size: 13px; width: 100px;">Name</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #718096; font-size: 13px;">Email</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                <a href="mailto:${email}" style="color: #00c9ff; text-decoration: none;">${email}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #718096; font-size: 13px;">Subject</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">${subject || 'No Subject'}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 24px;">
                        <p style="color: #718096; font-size: 13px; margin-bottom: 8px;">Message</p>
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; line-height: 1.7; white-space: pre-wrap;">${message}</div>
                    </div>

                    <!-- Reply Button -->
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="mailto:${email}?subject=Re: ${subject || 'Your Portfolio Message'}" 
                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00c9ff, #0072ff); color: #fff; font-weight: 600; border-radius: 50px; text-decoration: none; font-size: 14px;">
                            Reply to ${name} →
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 20px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); color: #4a5568; font-size: 12px;">
                    Sent from your Portfolio Backend • ${new Date().toLocaleString()}
                </div>
            </div>
        `,
        text: `New contact from ${name} (${email})\n\nSubject: ${subject || 'No Subject'}\n\nMessage:\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Notification email sent:', info.messageId);
    return info;
}

module.exports = { sendNotificationEmail };
