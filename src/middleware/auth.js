const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-in-production');
        req.user = decoded;
        next();
    } catch (err) {
        if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Invalid token' });
        return res.redirect('/login');
    }
};
