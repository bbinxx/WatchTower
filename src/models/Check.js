const db = require('../config/database');

class Check {
    static create(data) {
        const stmt = db.prepare(`
            INSERT INTO checks (monitor_id, status, response_time, status_code, error)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(data.monitor_id, data.status, data.response_time, data.status_code, data.error);
    }

    static getRecentByMonitor(monitorId, limit = 50) {
        return db.prepare('SELECT * FROM checks WHERE monitor_id = ? ORDER BY created_at DESC LIMIT ?').all(monitorId, limit);
    }
}

module.exports = Check;
