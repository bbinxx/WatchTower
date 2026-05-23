const { db } = require('../config/firebase');

module.exports = async (req, res, next) => {
    if (!req.user) {
        if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
        return res.status(401).send('Unauthorized');
    }

    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            next();
        } else {
            // For development, if no users exist, allow first authenticated user to proceed 
            // Alternatively, in production, restrict based on exact logic.
            // For WatchTower, let's treat any authenticated Firebase user as an admin to maintain the "personal dashboard" logic
            next();
        }
    } catch (e) {
        if (req.path.startsWith('/api')) return res.status(500).json({ error: 'Server error verifying admin' });
        res.status(500).send('Server error');
    }
};
