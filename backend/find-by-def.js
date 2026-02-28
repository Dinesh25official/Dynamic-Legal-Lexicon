const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function findTermByDef() {
    try {
        const query = 'formed or done for a particular purpose only';
        const res = await pool.query(
            'SELECT "Legal Term", "Fixed (Oxford) Definition" FROM legal_terms WHERE "Fixed (Oxford) Definition" ILIKE $1 OR "Simplified Definition" ILIKE $1',
            [`%${query}%`]
        );
        console.log('RESULTS BY DEFINITION:', res.rows);

        const adHocCheck = await pool.query(
            'SELECT "Legal Term" FROM legal_terms WHERE "Legal Term" ILIKE $1',
            ['%ad%']
        );
        console.log('Ad% count:', adHocCheck.rows.length);
        console.log('Sample Ad%:', adHocCheck.rows.slice(0, 10));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

findTermByDef();
