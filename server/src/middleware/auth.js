const jwt = require('jsonwebtoken');

/**
 * Security Lead: Role-Based Middleware (RBAC)
 * Checks if the token is valid AND if the user has the right role.
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // If roles are specified, check if user's role is allowed
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Permission denied for your role" });
            }

            // Attach user to request for other developers to use
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: "Token is not valid" });
        }
    };
};

module.exports = { authorize };
