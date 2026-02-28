const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function debugBookmarks() {
    try {
        console.log('--- RAW JOIN QUERY ---');
        const res = await pool.query(
            `SELECT 
                b.id as bookmark_id, 
                lt."Legal Term" as term, 
                lt."Fixed (Oxford) Definition" as oxford_definition, 
                lt."Simplified Definition" as simplified_definition, 
                b.created_at
             FROM bookmarks b
             JOIN legal_terms lt ON b.legal_term = lt."Legal Term"
             LIMIT 5`
        );
        console.log('Results:', JSON.stringify(res.rows, null, 2));

        console.log('\n--- BOOKMARKS TABLE SAMPLE ---');
        const bRes = await pool.query('SELECT * FROM bookmarks LIMIT 5');
        console.log('Bookmarks:', bRes.rows);

        console.log('\n--- LEGAL TERMS SAMPLE ---');
        const lRes = await pool.query('SELECT "Legal Term" FROM legal_terms LIMIT 5');
        console.log('Legal Terms:', lRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

debugBookmarks();
