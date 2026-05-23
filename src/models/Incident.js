const db = require('../services/DatabaseService');

class Incident {
    static async create(monitorId, error) {
        const data = {
            monitor_id: monitorId,
            error: error || null,
            status: 'open',
            started_at: Date.now()
        };
        return await db.create('incidents', data);
    }

    static async getOpenByMonitor(monitorId) {
        // Fetch all incidents for this monitor
        const incidents = await db.getByCondition('incidents', 'monitor_id', '==', monitorId);
        
        // Filter in JS to avoid composite index requirements in NoSQL databases
        const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'acknowledged');
        
        if (openIncidents.length === 0) return null;
        
        // Sort by most recent
        openIncidents.sort((a, b) => b.started_at - a.started_at);
        return openIncidents[0];
    }

    static async resolve(id) {
        await db.update('incidents', id, {
            status: 'resolved',
            resolved_at: Date.now()
        });
    }

    static async acknowledge(id) {
        await db.update('incidents', id, {
            status: 'acknowledged',
            acknowledged_at: Date.now()
        });
    }

    static async logAlert(incidentId, channel, status, error = null) {
        await db.create('alert_history', {
            incident_id: incidentId,
            channel,
            status,
            error,
            created_at: Date.now()
        });
    }
}

module.exports = Incident;
