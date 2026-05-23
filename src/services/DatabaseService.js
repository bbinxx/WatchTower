const { db } = require('../config/firebase');

/**
 * Generic Database Service to abstract away Firebase Firestore.
 * If you want to migrate to another database in the future, 
 * you ONLY need to change the logic in this file!
 */
class DatabaseService {
    static async getAll(collectionName) {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getById(collectionName, id) {
        const doc = await db.collection(collectionName).doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    static async create(collectionName, data) {
        const docRef = await db.collection(collectionName).add(data);
        return docRef.id;
    }

    static async update(collectionName, id, data) {
        await db.collection(collectionName).doc(id).update(data);
    }

    static async set(collectionName, id, data) {
        await db.collection(collectionName).doc(id).set(data, { merge: true });
    }

    static async delete(collectionName, id) {
        await db.collection(collectionName).doc(id).delete();
    }

    static async getByCondition(collectionName, field, operator, value) {
        const snapshot = await db.collection(collectionName).where(field, operator, value).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getByMultipleConditions(collectionName, conditions) {
        let query = db.collection(collectionName);
        for (const cond of conditions) {
            query = query.where(cond.field, cond.operator, cond.value);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // For cascading deletes
    static async deleteByCondition(collectionName, field, operator, value) {
        const snapshot = await db.collection(collectionName).where(field, operator, value).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}

module.exports = DatabaseService;
