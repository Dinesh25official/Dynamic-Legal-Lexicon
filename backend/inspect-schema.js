const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function inspectSchema() {
    try {
        console.log('--- COLUMNS IN legal_terms ---');
        const cols = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'legal_terms'"
        );
        console.log(cols.rows.map(r => r.column_name));

        console.log('\n--- COLUMNS IN bookmarks ---');
        const bCols = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'bookmarks'"
        );
        console.log(bCols.rows.map(r => r.column_name));

        console.log('\n--- FULL JOIN DEBUG ---');
        const join = await pool.query(`
            SELECT lt.* 
            FROM bookmarks b 
            JOIN legal_terms lt ON b.legal_term = lt."Legal Term" 
            LIMIT 1
        `);
        if (join.rows.length > 0) {
            console.log('Sample Join Data Keys:', Object.keys(join.rows[0]));
            console.log('Sample Data:', join.rows[0]);
        } else {
            console.log('JOIN RETURNED NO ROWS. Check if legal_term in bookmarks matches "Legal Term" exactly.');
            const bSample = await pool.query('SELECT legal_term FROM bookmarks LIMIT 1');
            const lSample = await pool.query('SELECT "Legal Term" FROM legal_terms LIMIT 1');
            console.log('Bookmark legal_term:', bSample.rows[0]?.legal_term);
            console.log('Legal Term name:', lSample.rows[0]?.['Legal Term']);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectSchema();
