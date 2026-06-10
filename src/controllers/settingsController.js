const Settings = require('../models/Settings');
const EmailService = require('../services/EmailService');
const TelegramService = require('../services/TelegramService');

exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        const safe = { ...settings };
        delete safe.email_smtp_pass;
        delete safe.telegram_bot_token;
        res.json(safe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateEmailSettings = async (req, res) => {
    try {
        const { email_recipients } = req.body;
        await Settings.updateMultiple({ email_recipients: JSON.stringify(email_recipients || []) }, req.user.uid);
        res.json({ message: 'Email recipients updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTelegramSettings = async (req, res) => {
    try {
        const { telegram_chat_ids } = req.body;
        await Settings.updateMultiple({ telegram_chat_ids: JSON.stringify(telegram_chat_ids || []) }, req.user.uid);
        await TelegramService.init();
        res.json({ message: 'Telegram chat IDs updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.testEmail = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        if (settings.email_enabled !== 'true') return res.status(400).json({ error: 'Email disabled in env' });

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
        if (settings.telegram_enabled !== 'true') return res.status(400).json({ error: 'Telegram disabled in env' });

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
