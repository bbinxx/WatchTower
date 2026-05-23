module.exports = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        if (req.path.startsWith('/api')) return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        res.status(403).send('Forbidden. Admin access required.');
    }
};
