const db = require('../services/DatabaseService');

class Settings {
    static async getAll() {
        const doc = await db.getById('system', 'settings');
        const env = this.getDefaults();

        if (doc) {
            env.email_recipients = doc.email_recipients || env.email_recipients;
            env.telegram_chat_ids = doc.telegram_chat_ids || env.telegram_chat_ids;
        }

        return env;
    }

    static async updateMultiple(settingsObj, userId = null) {
        const allowed = {};
        if (settingsObj.email_recipients !== undefined) allowed.email_recipients = settingsObj.email_recipients;
        if (settingsObj.telegram_chat_ids !== undefined) allowed.telegram_chat_ids = settingsObj.telegram_chat_ids;

        allowed.updated_at = Date.now();
        if (userId) allowed.updated_by = userId;
        await db.set('system', 'settings', allowed);
    }

    static getDefaults() {
        return {
            email_enabled: process.env.EMAIL_ENABLED || 'false',
            email_smtp_host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
            email_smtp_port: process.env.EMAIL_SMTP_PORT || '587',
            email_smtp_user: process.env.EMAIL_SMTP_USER || '',
            email_smtp_pass: process.env.EMAIL_SMTP_PASS || '',
            email_from_name: process.env.EMAIL_FROM_NAME || 'WatchTower',
            email_from_address: process.env.EMAIL_FROM_ADDRESS || 'alerts@example.com',
            email_recipients: process.env.EMAIL_RECIPIENTS || '[]',
            telegram_enabled: process.env.TELEGRAM_ENABLED || 'false',
            telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
            telegram_chat_ids: process.env.TELEGRAM_CHAT_IDS || '[]',
            telegram_notify_down: process.env.TELEGRAM_NOTIFY_DOWN || 'true',
            telegram_notify_up: process.env.TELEGRAM_NOTIFY_UP || 'true'
        };
    }
}

module.exports = Settings;
