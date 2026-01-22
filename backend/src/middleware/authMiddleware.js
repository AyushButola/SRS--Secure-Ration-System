const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_123';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        next();
    });
};

module.exports = { authenticateToken, verifyAdmin };
