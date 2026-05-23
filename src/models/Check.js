const { db } = require('../config/firebase');

class Check {
    static async create(data) {
        data.created_at = Date.now();
        const docRef = await db.collection('checks').add(data);
        return docRef.id;
    }

    static async getRecentByMonitor(monitorId, limit = 50) {
        const snapshot = await db.collection('checks')
            .where('monitor_id', '==', monitorId)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}

module.exports = Check;
