const db = require('../config/database');

class Incident {
    static create(monitorId, error) {
        return db.prepare('INSERT INTO incidents (monitor_id, error) VALUES (?, ?)').run(monitorId, error);
    }

    static getOpenByMonitor(monitorId) {
        return db.prepare("SELECT * FROM incidents WHERE monitor_id = ? AND status != 'resolved' ORDER BY started_at DESC LIMIT 1").get(monitorId);
    }

    static resolve(id) {
        return db.prepare("UPDATE incidents SET status = 'resolved', resolved_at = unixepoch() WHERE id = ?").run(id);
    }

    static acknowledge(id) {
        return db.prepare("UPDATE incidents SET status = 'acknowledged', acknowledged_at = unixepoch() WHERE id = ?").run(id);
    }

    static logAlert(incidentId, channel, status, error = null) {
        return db.prepare('INSERT INTO alert_history (incident_id, channel, status, error) VALUES (?, ?, ?, ?)').run(incidentId, channel, status, error);
    }
}

module.exports = Incident;
