const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkData() {
    try {
        const res = await pool.query(
            'SELECT "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition" FROM legal_terms WHERE "Legal Term" = $1',
            ['Accord and Satisfaction']
        );
        console.log('TERM DATA:', JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkData();
