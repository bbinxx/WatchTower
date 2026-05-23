const db = require('../config/database');

class Settings {
    static getAll() {
        const rows = db.prepare('SELECT key, value FROM system_settings').all();
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }

    static get(key) {
        const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
        return row ? row.value : null;
    }

    static update(key, value, userId = null) {
        return db.prepare('UPDATE system_settings SET value = ?, updated_at = unixepoch(), updated_by = ? WHERE key = ?').run(value, userId, key);
    }

    static updateMultiple(settingsObj, userId = null) {
        const stmt = db.prepare('UPDATE system_settings SET value = ?, updated_at = unixepoch(), updated_by = ? WHERE key = ?');
        const updateTransaction = db.transaction((settings) => {
            for (const [key, value] of Object.entries(settings)) {
                stmt.run(String(value), userId, key);
            }
        });
        updateTransaction(settingsObj);
    }
}

module.exports = Settings;
