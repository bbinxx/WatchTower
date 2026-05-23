const db = require('../config/database');

class Monitor {
    static getAll() {
        return db.prepare('SELECT * FROM monitors').all();
    }

    static getById(id) {
        return db.prepare('SELECT * FROM monitors WHERE id = ?').get(id);
    }

    static create(data) {
        const stmt = db.prepare(`
            INSERT INTO monitors (name, type, url, interval, notification_override, use_global_notifications, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(data.name, data.type, data.url, data.interval, data.notification_override, data.use_global_notifications, data.user_id);
        return info.lastInsertRowid;
    }

    static update(id, data) {
        const stmt = db.prepare(`
            UPDATE monitors 
            SET name = ?, type = ?, url = ?, interval = ?, notification_override = ?, use_global_notifications = ?
            WHERE id = ?
        `);
        return stmt.run(data.name, data.type, data.url, data.interval, data.notification_override, data.use_global_notifications, id);
    }

    static updateStatus(id, status) {
        return db.prepare('UPDATE monitors SET status = ? WHERE id = ?').run(status, id);
    }

    static delete(id) {
        return db.prepare('DELETE FROM monitors WHERE id = ?').run(id);
    }
}

module.exports = Monitor;
