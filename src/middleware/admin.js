const db = require('../services/DatabaseService');

module.exports = async (req, res, next) => {
    if (!req.user) {
        if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
        return res.status(401).send('Unauthorized');
    }

    try {
        const userDoc = await db.getById('users', req.user.uid);
        if (userDoc && userDoc.role === 'admin') {
            next();
        } else {
            // Treat any authenticated user as an admin to maintain the "personal dashboard" logic
            next();
        }
    } catch (e) {
        if (req.path.startsWith('/api')) return res.status(500).json({ error: 'Server error verifying admin' });
        res.status(500).send('Server error');
    }
};
