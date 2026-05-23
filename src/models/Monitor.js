const db = require('../services/DatabaseService');

class Monitor {
    static async getAll() {
        return await db.getAll('monitors');
    }

    static async getById(id) {
        return await db.getById('monitors', id);
    }

    static async create(data) {
        data.created_at = Date.now();
        data.status = data.status || 'unknown';
        return await db.create('monitors', data);
    }

    static async update(id, data) {
        await db.update('monitors', id, data);
    }

    static async updateStatus(id, status) {
        await db.update('monitors', id, { status });
    }

    static async delete(id) {
        // Cascade delete incidents and checks
        await db.deleteByCondition('incidents', 'monitor_id', '==', id);
        await db.deleteByCondition('checks', 'monitor_id', '==', id);
        
        // Delete the monitor itself
        await db.delete('monitors', id);
    }
}

module.exports = Monitor;
