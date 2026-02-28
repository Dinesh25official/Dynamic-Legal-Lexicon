const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function findPotentialMatches() {
    try {
        const res = await pool.query(
            'SELECT "Legal Term", "Fixed (Oxford) Definition" FROM legal_terms WHERE "Fixed (Oxford) Definition" ILIKE $1 AND "Fixed (Oxford) Definition" ILIKE $2',
            ['%purpose%', '%particular%']
        );
        console.log('Terms with "purpose" and "particular":');
        res.rows.forEach(r => console.log(`- ${r['Legal Term']}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

findPotentialMatches();
