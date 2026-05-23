const { db } = require('../config/firebase');

class Monitor {
    static async getAll() {
        const snapshot = await db.collection('monitors').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getById(id) {
        const doc = await db.collection('monitors').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    static async create(data) {
        data.created_at = Date.now();
        data.status = data.status || 'unknown';
        const docRef = await db.collection('monitors').add(data);
        return docRef.id;
    }

    static async update(id, data) {
        await db.collection('monitors').doc(id).update(data);
    }

    static async updateStatus(id, status) {
        await db.collection('monitors').doc(id).update({ status });
    }

    static async delete(id) {
        // Cascade delete incidents and checks manually
        const incidentsSnap = await db.collection('incidents').where('monitor_id', '==', id).get();
        const batch = db.batch();
        
        incidentsSnap.forEach(doc => {
            batch.delete(doc.ref);
            // Alert history could also be deleted here if stored as subcollections or separate docs
        });

        const checksSnap = await db.collection('checks').where('monitor_id', '==', id).get();
        checksSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        batch.delete(db.collection('monitors').doc(id));
        await batch.commit();
    }
}

module.exports = Monitor;
