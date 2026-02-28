const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DB_URL, // Updated to match Security Lead guide
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
