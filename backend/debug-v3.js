const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function debug() {
    try {
        const res = await pool.query(
            `SELECT 
                b.id as bookmark_id, 
                lt."Legal Term" as term, 
                lt."Fixed (Oxford) Definition" as oxford_definition, 
                lt."Simplified Definition" as simplified_definition
             FROM bookmarks b
             JOIN legal_terms lt ON b.legal_term = lt."Legal Term"
             LIMIT 1`
        );

        if (res.rows.length > 0) {
            const row = res.rows[0];
            console.log('KEYS FOUND:', Object.keys(row));
            console.log('VALUES PREVIEW:');
            console.log('term:', row.term);
            console.log('oxford_definition length:', row.oxford_definition ? row.oxford_definition.length : 'NULL');
            console.log('simplified_definition length:', row.simplified_definition ? row.simplified_definition.length : 'NULL');
            console.log('FULL ROW:', JSON.stringify(row, null, 2));
        } else {
            console.log('NO BOOKMARKS MATCHED LEGAL TERMS. Check case sensitivity or empty tables.');
            const anyB = await pool.query('SELECT legal_term FROM bookmarks LIMIT 3');
            console.log('Sample bookmarks:', anyB.rows);
            const anyL = await pool.query('SELECT "Legal Term" FROM legal_terms LIMIT 3');
            console.log('Sample legal terms:', anyL.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

debug();
