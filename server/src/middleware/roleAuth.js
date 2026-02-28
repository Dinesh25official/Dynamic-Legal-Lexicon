const jwt = require('jsonwebtoken');

/**
 * Final Gatekeeper Middleware (Member 2 Spec)
 * This middleware checks if the user has the required role.
 */
const authorize = (requiredRole) => {
    return (req, res, next) => {
        // 1. Get token from header (Bearer <token>)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        try {
            // 2. Verify and decode using the JWT Secret
            // Using JWT_SECRET from our .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Attach user to request
            req.user = decoded;

            // 4. Role Check: Compare token role vs required role
            // Bypasses if role is 'admin'
            if (req.user.role !== requiredRole && req.user.role !== 'admin') {
                return res.status(403).json({ error: `Forbidden: Requires ${requiredRole} role.` });
            }

            next(); // User is authorized!
        } catch (err) {
            res.status(400).json({ error: "Invalid token signature." });
        }
    };
};

module.exports = authorize;
