const { db } = require('../config/firebase');

class Incident {
    static async create(monitorId, error) {
        const data = {
            monitor_id: monitorId,
            error: error || null,
            status: 'open',
            started_at: Date.now()
        };
        const docRef = await db.collection('incidents').add(data);
        return docRef.id;
    }

    static async getOpenByMonitor(monitorId) {
        const snapshot = await db.collection('incidents')
            .where('monitor_id', '==', monitorId)
            .where('status', 'in', ['open', 'acknowledged'])
            .orderBy('started_at', 'desc')
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    static async resolve(id) {
        await db.collection('incidents').doc(id).update({
            status: 'resolved',
            resolved_at: Date.now()
        });
    }

    static async acknowledge(id) {
        await db.collection('incidents').doc(id).update({
            status: 'acknowledged',
            acknowledged_at: Date.now()
        });
    }

    static async logAlert(incidentId, channel, status, error = null) {
        await db.collection('alert_history').add({
            incident_id: incidentId,
            channel,
            status,
            error,
            created_at: Date.now()
        });
    }
}

module.exports = Incident;
