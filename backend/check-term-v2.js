const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkTermDetails() {
    try {
        const res = await pool.query(
            'SELECT "Legal Term", length("Legal Term") as len, ascii(SUBSTRING("Legal Term", 1, 1)) as first_char FROM legal_terms WHERE "Legal Term" ILIKE $1',
            ['%Statutory Interpretation%']
        );
        console.log('Results:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkTermDetails();
