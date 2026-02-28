const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function findKeys() {
    try {
        const res = await pool.query('SELECT * FROM legal_terms LIMIT 1');
        console.log('EXACT KEYS IN ROW:', Object.keys(res.rows[0]));
        console.log('SAMPLE ROW:', JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

findKeys();
