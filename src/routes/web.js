const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Serve static HTML files based on routes
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/dashboard', auth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

router.get('/settings', auth, admin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/settings.html'));
});

router.get('/settings/notifications', auth, admin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/settings.html'));
});

router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

module.exports = router;
