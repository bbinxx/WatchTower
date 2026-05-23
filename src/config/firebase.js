const admin = require('firebase-admin');

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Parse the JSON string stored in the .env file
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT in .env');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        console.log('Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
    } else {
        console.warn('⚠️ No FIREBASE_SERVICE_ACCOUNT found in .env. Falling back to default.');
        admin.initializeApp();
    }
} catch (e) {
    console.error('Firebase initialization failed:', e.message);
}

const db = admin.firestore();

async function verifyConnection() {
    try {
        // A simple query to verify connection
        await db.collection('system').limit(1).get();
        console.log('✅ Firebase Firestore connected successfully.');
    } catch (e) {
        console.error('❌ Firebase connection failed:', e.message);
    }
}

module.exports = { admin, db, verifyConnection };
