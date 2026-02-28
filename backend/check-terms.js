const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkTerms() {
    try {
        const res = await pool.query(
            'SELECT "Legal Term" FROM legal_terms LIMIT 10'
        );
        console.log('Sample Terms:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkTerms();
