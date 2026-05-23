const Settings = require('../models/Settings');
const EmailService = require('../services/EmailService');
const TelegramService = require('../services/TelegramService');

exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateEmailSettings = async (req, res) => {
    try {
        const {
            email_enabled,
            email_smtp_host,
            email_smtp_port,
            email_smtp_user,
            email_smtp_pass,
            email_from_name,
            email_from_address,
            email_recipients
        } = req.body;

        await Settings.updateMultiple({
            email_enabled,
            email_smtp_host,
            email_smtp_port,
            email_smtp_user,
            email_smtp_pass,
            email_from_name,
            email_from_address,
            email_recipients: JSON.stringify(email_recipients || [])
        }, req.user.uid);

        res.json({ message: 'Email settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTelegramSettings = async (req, res) => {
    try {
        const {
            telegram_enabled,
            telegram_bot_token,
            telegram_chat_ids,
            telegram_notify_down,
            telegram_notify_up
        } = req.body;

        await Settings.updateMultiple({
            telegram_enabled,
            telegram_bot_token,
            telegram_chat_ids: JSON.stringify(telegram_chat_ids || []),
            telegram_notify_down,
            telegram_notify_up
        }, req.user.uid);

        // Re-initialize bot with new settings
        await TelegramService.init();

        res.json({ message: 'Telegram settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.testEmail = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        if (settings.email_enabled !== 'true') return res.status(400).json({ error: 'Email notifications are disabled' });

        const recipients = JSON.parse(settings.email_recipients || '[]');
        if (recipients.length === 0) return res.status(400).json({ error: 'No recipients configured' });

        const result = await EmailService.sendTestEmail(recipients[0]);
        if (result.success) {
            res.json({ message: 'Test email sent successfully' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.testTelegram = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        if (settings.telegram_enabled !== 'true') return res.status(400).json({ error: 'Telegram notifications are disabled' });

        const chatIds = JSON.parse(settings.telegram_chat_ids || '[]');
        if (chatIds.length === 0) return res.status(400).json({ error: 'No chat IDs configured' });

        const result = await TelegramService.sendTestMessage(chatIds[0]);
        if (result.success) {
            res.json({ message: 'Test message sent successfully' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
