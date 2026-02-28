const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function findTerm() {
    try {
        console.log('--- SEARCHING FOR AD HOC ---');
        const res = await pool.query(
            'SELECT "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition" FROM legal_terms WHERE "Legal Term" ILIKE $1 OR "Fixed (Oxford) Definition" ILIKE $1',
            ['%formed or done for a particular purpose%']
        );
        console.log('Matches by definition text:', res.rows);

        console.log('\n--- SEARCHING FOR "OFFICIAL SECRETS" VECTOR ---');
        const vecRes = await pool.query(
            'SELECT "Legal Term", search_vector FROM legal_terms WHERE "Legal Term" = $1',
            ['official secrets']
        );
        console.log('Official Secrets Vector:', vecRes.rows[0]);

        console.log('\n--- SEARCHING FOR ANY TERM WITH "AD HOC" ---');
        const adHoc = await pool.query(
            'SELECT "Legal Term" FROM legal_terms WHERE "Legal Term" ILIKE $1',
            ['%ad%hoc%']
        );
        console.log('Ad Hoc results:', adHoc.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

findTerm();
