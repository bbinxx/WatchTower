const AuthService = require('../services/AuthService');

module.exports = async (req, res, next) => {
    // Check Authorization header or cookies
    const authHeader = req.headers.authorization;
    let idToken = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.split('Bearer ')[1];
    } else if (req.cookies && req.cookies.token) {
        idToken = req.cookies.token;
    }

    if (!idToken) {
        if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
        return res.redirect('/login');
    }

    try {
        const decodedToken = await AuthService.verifyToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Invalid token' });
        return res.redirect('/login');
    }
};
