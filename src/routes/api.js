const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Monitor = require('../models/Monitor');
const Check = require('../models/Check');
const SettingsController = require('../controllers/settingsController');

const MonitorService = require('../services/MonitorService');

// --- AUTH ---
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = User.getByEmail(email);
    
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            { expiresIn: '1d' }
        );
        res.cookie('token', token, { httpOnly: true });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

// --- MONITORS ---
router.get('/monitors', auth, (req, res) => {
    res.json(Monitor.getAll());
});

router.post('/monitors', auth, async (req, res) => {
    const data = { ...req.body, user_id: req.user.id };
    if (data.notification_override && typeof data.notification_override !== 'string') {
        data.notification_override = JSON.stringify(data.notification_override);
    }
    const id = Monitor.create(data);
    const monitor = Monitor.getById(id);
    const checkResult = await MonitorService.runCheck(monitor);
    res.status(201).json({ ...Monitor.getById(id), checkResult });
});

router.put('/monitors/:id', auth, async (req, res) => {
    const data = req.body;
    if (data.notification_override && typeof data.notification_override !== 'string') {
        data.notification_override = JSON.stringify(data.notification_override);
    }
    Monitor.update(req.params.id, data);
    const monitor = Monitor.getById(req.params.id);
    const checkResult = await MonitorService.runCheck(monitor);
    res.json({ message: 'Monitor updated', ...Monitor.getById(req.params.id), checkResult });
});

router.delete('/monitors/:id', auth, (req, res) => {
    Monitor.delete(req.params.id);
    res.json({ message: 'Monitor deleted' });
});

// --- CHECKS ---
router.get('/monitors/:id/checks', auth, (req, res) => {
    res.json(Check.getRecentByMonitor(req.params.id, 100));
});

// --- SETTINGS (Admin Only) ---
router.get('/settings', auth, admin, SettingsController.getSettings);
router.put('/settings/email', auth, admin, SettingsController.updateEmailSettings);
router.put('/settings/telegram', auth, admin, SettingsController.updateTelegramSettings);
router.post('/settings/email/test', auth, admin, SettingsController.testEmail);
router.post('/settings/telegram/test', auth, admin, SettingsController.testTelegram);

// --- WEBHOOKS ---
router.post('/webhooks/telegram', (req, res) => {
    // Pass to bot if needed, node-telegram-bot-api handles this internally if configured for webhooks.
    // We are using polling in this implementation for simplicity, but we can accept it and log.
    res.sendStatus(200);
});

module.exports = router;
