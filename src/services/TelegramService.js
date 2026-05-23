const TelegramBot = require('node-telegram-bot-api');
const Settings = require('../models/Settings');
const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');

let botInstance = null;

class TelegramService {
    static init() {
        const settings = Settings.getAll();
        if (settings.telegram_enabled === 'true' && settings.telegram_bot_token) {
            try {
                if (botInstance) {
                    botInstance.stopPolling();
                }
                botInstance = new TelegramBot(settings.telegram_bot_token, { polling: true });
                this.setupCommands();
                console.log('Telegram Bot initialized');
            } catch (err) {
                console.error('Failed to init Telegram bot', err);
            }
        } else {
            if (botInstance) {
                botInstance.stopPolling();
                botInstance = null;
            }
        }
    }

    static setupCommands() {
        if (!botInstance) return;

        botInstance.onText(/\/start/, (msg) => {
            botInstance.sendMessage(msg.chat.id, 'Welcome to WatchTower Bot! Your Chat ID is: ' + msg.chat.id);
        });

        botInstance.onText(/\/status(?:\s+(.+))?/, (msg, match) => {
            const monitorName = match[1];
            const monitors = Monitor.getAll();
            if (monitorName) {
                const monitor = monitors.find(m => m.name.toLowerCase() === monitorName.toLowerCase());
                if (monitor) {
                    botInstance.sendMessage(msg.chat.id, `Monitor ${monitor.name} is currently ${monitor.status.toUpperCase()}`);
                } else {
                    botInstance.sendMessage(msg.chat.id, `Monitor ${monitorName} not found.`);
                }
            } else {
                const up = monitors.filter(m => m.status === 'up').length;
                const down = monitors.filter(m => m.status === 'down').length;
                botInstance.sendMessage(msg.chat.id, `WatchTower Status:\n✅ UP: ${up}\n🔴 DOWN: ${down}\nTotal: ${monitors.length}`);
            }
        });

        botInstance.onText(/\/help/, (msg) => {
            const helpText = `
WatchTower Bot Commands:
/start - Welcome message and get Chat ID
/status - Get overall status
/status [monitor_name] - Get specific monitor status
/help - Show this help
            `;
            botInstance.sendMessage(msg.chat.id, helpText);
        });

        botInstance.on('callback_query', (query) => {
            const action = query.data;
            const msg = query.message;
            
            if (action.startsWith('ack_')) {
                const incidentId = action.split('_')[1];
                Incident.acknowledge(incidentId);
                botInstance.answerCallbackQuery(query.id, { text: 'Incident acknowledged!' });
                botInstance.sendMessage(msg.chat.id, `Incident #${incidentId} has been acknowledged.`);
            } else if (action === 'view_dashboard') {
                botInstance.answerCallbackQuery(query.id, { text: 'Opening dashboard...' });
            }
        });
    }

    static async sendMessage(chatId, text, options = {}) {
        if (!botInstance) return { success: false, error: 'Bot not initialized' };
        try {
            await botInstance.sendMessage(chatId, text, options);
            return { success: true };
        } catch (error) {
            console.error('Telegram send error:', error);
            return { success: false, error: error.message };
        }
    }

    static async sendTestMessage(chatId) {
        return this.sendMessage(chatId, 'Test message from WatchTower Bot! 🚀');
    }
}

module.exports = TelegramService;
