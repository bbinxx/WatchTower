const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Monitor = require('../models/Monitor');
const Check = require('../models/Check');
const SettingsController = require('../controllers/settingsController');
const MonitorService = require('../services/MonitorService');
const AuthService = require('../services/AuthService');

// --- FIREBASE CONFIG (Public) ---
router.get('/firebase-config', (req, res) => {
    try {
        let config = {};
        
        // If user provided a JSON string
        if (process.env.FIREBASE_PUBLIC_CONFIG) {
            config = JSON.parse(process.env.FIREBASE_PUBLIC_CONFIG);
        } else {
            // If user provided individual variables
            config = {
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                databaseURL: process.env.FIREBASE_DATABASE_URL,
                projectId: process.env.FIREBASE_PROJECT_ID,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.FIREBASE_APP_ID,
                measurementId: process.env.FIREBASE_MEASUREMENT_ID
            };
        }
        res.json(config);
    } catch (e) {
        res.json({});
    }
});

// --- AUTH ---
// Login happens on the client, and we receive a token.
router.post('/login', async (req, res) => {
    const idToken = req.body.token;
    if (!idToken) return res.status(400).json({ error: 'Token missing' });

    try {
        const decodedToken = await AuthService.verifyIdToken(idToken);
        // Create session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await AuthService.createSession(idToken, expiresIn);
        
        const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
        res.cookie('token', sessionCookie, options);
        
        res.json({ success: true, user: { uid: decodedToken.uid, email: decodedToken.email } });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

// --- MONITORS ---
router.get('/monitors', auth, async (req, res) => {
    const monitors = await Monitor.getAll();
    res.json(monitors);
});

router.post('/monitors', auth, async (req, res) => {
    const data = { ...req.body, user_id: req.user.uid };
    if (data.notification_override && typeof data.notification_override !== 'string') {
        data.notification_override = JSON.stringify(data.notification_override);
    }
    const id = await Monitor.create(data);
    const monitor = await Monitor.getById(id);
    const checkResult = await MonitorService.runCheck(monitor);
    res.status(201).json({ ...(await Monitor.getById(id)), checkResult });
});

router.put('/monitors/:id', auth, async (req, res) => {
    const data = req.body;
    if (data.notification_override && typeof data.notification_override !== 'string') {
        data.notification_override = JSON.stringify(data.notification_override);
    }
    await Monitor.update(req.params.id, data);
    const monitor = await Monitor.getById(req.params.id);
    const checkResult = await MonitorService.runCheck(monitor);
    res.json({ message: 'Monitor updated', ...(await Monitor.getById(req.params.id)), checkResult });
});

router.delete('/monitors/:id', auth, async (req, res) => {
    await Monitor.delete(req.params.id);
    res.json({ message: 'Monitor deleted' });
});

// --- CHECKS ---
router.get('/monitors/:id/checks', auth, async (req, res) => {
    const checks = await Check.getRecentByMonitor(req.params.id, 100);
    res.json(checks);
});

// --- SETTINGS (Admin Only) ---
router.get('/settings', auth, admin, SettingsController.getSettings);
router.put('/settings/email', auth, admin, SettingsController.updateEmailSettings);
router.put('/settings/telegram', auth, admin, SettingsController.updateTelegramSettings);
router.post('/settings/email/test', auth, admin, SettingsController.testEmail);
router.post('/settings/telegram/test', auth, admin, SettingsController.testTelegram);

// --- HEALTH & VERSION ---
router.get('/health', (req, res) => {
    const pkg = require('../../../package.json');
    res.json({ status: 'ok', version: pkg.version, uptime: process.uptime(), timestamp: Date.now() });
});

module.exports = router;
