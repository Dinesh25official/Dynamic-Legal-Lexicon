const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

async function debugSearch() {
    const query = 'formed or done for a particular purpose only';
    try {
        console.log('--- CHECKING AD HOC IN DB ---');
        const adHoc = await pool.query(
            'SELECT "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition" FROM legal_terms WHERE "Legal Term" ILIKE $1',
            ['%ad hoc%']
        );
        console.log('Ad Hoc Results:', adHoc.rows);

        console.log('\n--- SIMULATING SEARCH RANKING ---');
        const tsQuery = 'formed & done & particular & purpose'; // common legal words
        const res = await pool.query(`
            SELECT 
                "Legal Term", 
                "Fixed (Oxford) Definition",
                ts_rank(to_tsvector('english', COALESCE(search_vector, '')), to_tsquery('english', $1)) as rank
            FROM legal_terms
            WHERE 
                LOWER("Fixed (Oxford) Definition") LIKE LOWER($2)
                OR LOWER("Simplified Definition") LIKE LOWER($2)
                OR to_tsvector('english', COALESCE(search_vector, '')) @@ to_tsquery('english', $1)
            ORDER BY rank DESC, "Legal Term" ASC
            LIMIT 5
        `, [tsQuery, `%${query}%`]);
        console.log('Search Results with Ranking:', res.rows.map(r => ({ term: r['Legal Term'], rank: r.rank })));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

debugSearch();
