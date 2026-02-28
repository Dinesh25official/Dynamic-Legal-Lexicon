const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkVariations() {
    try {
        const res = await pool.query(
            'SELECT "Legal Term" FROM legal_terms WHERE "Legal Term" ILIKE $1 OR "Legal Term" ILIKE $2',
            ['%interpretation%', '%intepretation%']
        );
        console.log('Results:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkVariations();
