const db = require('../../../config/db');

/**
 * Find user by email
 */
const findByEmail = async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

/**
 * Create a new user
 */
const createUser = async ({ full_name, email, password, role }) => {
    const result = await db.query(
        'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
        [full_name, email, password, role || 'public']
    );
    return result.rows[0];
};

module.exports = {
    findByEmail,
    createUser
};
