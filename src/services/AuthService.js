const { admin } = require('../config/firebase');

/**
 * Generic Auth Service to abstract away Firebase Auth.
 * If you want to migrate to another auth provider, change this file.
 */
class AuthService {
    static async verifyToken(idToken) {
        // Here we verify the session cookie that was generated during login
        return await admin.auth().verifySessionCookie(idToken, true);
    }

    static async verifyIdToken(idToken) {
        return await admin.auth().verifyIdToken(idToken);
    }

    static async createSession(idToken, expiresInMs) {
        return await admin.auth().createSessionCookie(idToken, { expiresIn: expiresInMs });
    }
}

module.exports = AuthService;
