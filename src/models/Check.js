const db = require('../services/DatabaseService');

class Check {
    static async create(data) {
        data.created_at = Date.now();
        return await db.create('checks', data);
    }

    static async getRecentByMonitor(monitorId, limit = 50) {
        // Querying just by monitor_id avoids composite index requirements
        // We fetch them all, sort, and slice in JS to stay decoupled
        const checks = await db.getByCondition('checks', 'monitor_id', '==', monitorId);
        
        checks.sort((a, b) => b.created_at - a.created_at);
        return checks.slice(0, limit);
    }
}

module.exports = Check;
