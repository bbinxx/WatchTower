const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

class EmailService {
    static async getTransporter() {
        const settings = await Settings.getAll();
        if (settings.email_enabled !== 'true') return null;

        return nodemailer.createTransport({
            host: settings.email_smtp_host,
            port: parseInt(settings.email_smtp_port, 10),
            secure: parseInt(settings.email_smtp_port, 10) === 465,
            auth: {
                user: settings.email_smtp_user,
                pass: settings.email_smtp_pass,
            }
        });
    }

    static async sendEmail(to, subject, html) {
        const settings = await Settings.getAll();
        if (settings.email_enabled !== 'true') return { success: false, error: 'Email disabled' };

        const transporter = await this.getTransporter();
        if (!transporter) return { success: false, error: 'Transporter configuration invalid' };

        try {
            await transporter.sendMail({
                from: `"${settings.email_from_name}" <${settings.email_from_address}>`,
                to: to,
                subject: subject,
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }
    }

    static async sendTestEmail(to) {
        return this.sendEmail(
            to,
            'Test Email from WatchTower',
            '<h3>Success!</h3><p>Your email configuration in WatchTower is working correctly.</p>'
        );
    }
}

module.exports = EmailService;
