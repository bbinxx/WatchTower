const EmailService = require('./EmailService');
const TelegramService = require('./TelegramService');
const Settings = require('../models/Settings');
const Incident = require('../models/Incident');

class AlertService {
    static async handleDown(monitor, incident) {
        const settings = Settings.getAll();
        
        let emailRecipients = [];
        let telegramChatIds = [];

        if (monitor.use_global_notifications) {
            try { emailRecipients = JSON.parse(settings.email_recipients || '[]'); } catch(e){}
            try { telegramChatIds = JSON.parse(settings.telegram_chat_ids || '[]'); } catch(e){}
        } else if (monitor.notification_override) {
            try {
                const override = JSON.parse(monitor.notification_override);
                emailRecipients = override.email || [];
                telegramChatIds = override.telegram || [];
            } catch(e){}
        }

        // Email
        if (settings.email_enabled === 'true' && emailRecipients.length > 0) {
            const subject = `🔴 DOWN ALERT - ${monitor.name}`;
            const html = `
                <h2>Monitor is DOWN</h2>
                <p><strong>Name:</strong> ${monitor.name}</p>
                <p><strong>URL:</strong> ${monitor.url}</p>
                <p><strong>Error:</strong> ${incident.error}</p>
                <p><strong>Started at:</strong> ${new Date(incident.started_at * 1000).toISOString()}</p>
            `;
            
            for (const email of emailRecipients) {
                const res = await EmailService.sendEmail(email, subject, html);
                Incident.logAlert(incident.id, 'email', res.success ? 'success' : 'failed', res.error);
            }
        }

        // Telegram
        if (settings.telegram_enabled === 'true' && telegramChatIds.length > 0 && settings.telegram_notify_down === 'true') {
            const text = `🔴 *DOWN ALERT* - ${monitor.name}\n\n*URL:* ${monitor.url}\n*Error:* ${incident.error}\n*Started at:* ${new Date(incident.started_at * 1000).toISOString()} UTC`;
            
            const options = {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Acknowledge', callback_data: `ack_${incident.id}` },
                            { text: 'View Dashboard', url: 'http://localhost:3000/dashboard', callback_data: 'view_dashboard' }
                        ]
                    ]
                }
            };

            for (const chatId of telegramChatIds) {
                const res = await TelegramService.sendMessage(chatId, text, options);
                Incident.logAlert(incident.id, 'telegram', res.success ? 'success' : 'failed', res.error);
            }
        }
    }

    static async handleUp(monitor, incident) {
        const settings = Settings.getAll();
        
        let emailRecipients = [];
        let telegramChatIds = [];

        if (monitor.use_global_notifications) {
            try { emailRecipients = JSON.parse(settings.email_recipients || '[]'); } catch(e){}
            try { telegramChatIds = JSON.parse(settings.telegram_chat_ids || '[]'); } catch(e){}
        } else if (monitor.notification_override) {
            try {
                const override = JSON.parse(monitor.notification_override);
                emailRecipients = override.email || [];
                telegramChatIds = override.telegram || [];
            } catch(e){}
        }

        const duration = Math.round((incident.resolved_at - incident.started_at) / 60); // minutes

        // Email
        if (settings.email_enabled === 'true' && emailRecipients.length > 0) {
            const subject = `🟢 RECOVERED - ${monitor.name}`;
            const html = `
                <h2>Monitor is UP</h2>
                <p><strong>Name:</strong> ${monitor.name}</p>
                <p><strong>Downtime Duration:</strong> ${duration} minutes</p>
                <p><strong>Resolved at:</strong> ${new Date(incident.resolved_at * 1000).toISOString()}</p>
            `;
            
            for (const email of emailRecipients) {
                await EmailService.sendEmail(email, subject, html);
            }
        }

        // Telegram
        if (settings.telegram_enabled === 'true' && telegramChatIds.length > 0 && settings.telegram_notify_up === 'true') {
            const text = `🟢 *RECOVERED* - ${monitor.name}\n\n*Downtime duration:* ${duration} minutes\n*Resolved at:* ${new Date(incident.resolved_at * 1000).toISOString()} UTC`;
            
            const options = { parse_mode: 'Markdown' };

            for (const chatId of telegramChatIds) {
                await TelegramService.sendMessage(chatId, text, options);
            }
        }
    }
}

module.exports = AlertService;
