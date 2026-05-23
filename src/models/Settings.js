const db = require('../services/DatabaseService');

class Settings {
    static async getAll() {
        const doc = await db.getById('system', 'settings');
        return doc ? doc : this.getDefaults();
    }

    static async updateMultiple(settingsObj, userId = null) {
        settingsObj.updated_at = Date.now();
        if (userId) settingsObj.updated_by = userId;
        await db.set('system', 'settings', settingsObj);
    }

    static getDefaults() {
        return {
            email_enabled: 'false',
            email_smtp_host: 'smtp.gmail.com',
            email_smtp_port: '587',
            email_smtp_user: '',
            email_smtp_pass: '',
            email_recipients: '[]',
            email_from_name: 'WatchTower',
            email_from_address: 'alerts@example.com',
            telegram_enabled: 'false',
            telegram_bot_token: '',
            telegram_chat_ids: '[]',
            telegram_notify_down: 'true',
            telegram_notify_up: 'true'
        };
    }
}

module.exports = Settings;
