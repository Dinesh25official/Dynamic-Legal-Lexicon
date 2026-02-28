/**
 * Fix script: Drops and recreates tables that had wrong schemas
 * from a previous Supabase setup. Only affects: statutory_table, daily_term, term_statutes
 * Usage: node fix_tables.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

const steps = [
    // Drop the broken tables (in reverse dependency order)
    { name: 'Drop term_statutes', sql: 'DROP TABLE IF EXISTS term_statutes CASCADE' },
    { name: 'Drop daily_term', sql: 'DROP TABLE IF EXISTS daily_term CASCADE' },
    { name: 'Drop statutory_table', sql: 'DROP TABLE IF EXISTS statutory_table CASCADE' },

    // Recreate with correct schemas
    {
        name: 'Create statutory_table',
        sql: `CREATE TABLE statutory_table (
            id SERIAL PRIMARY KEY,
            statute_name VARCHAR(500) NOT NULL,
            section VARCHAR(100),
            description TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'Create term_statutes',
        sql: `CREATE TABLE term_statutes (
            id SERIAL PRIMARY KEY,
            term_id INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
            statute_id INTEGER NOT NULL REFERENCES statutory_table(id) ON DELETE CASCADE,
            relevance_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(term_id, statute_id)
        )`
    },
    {
        name: 'Create daily_term',
        sql: `CREATE TABLE daily_term (
            id SERIAL PRIMARY KEY,
            term_id INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
            display_date DATE NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    { name: 'Index term_statutes', sql: 'CREATE INDEX IF NOT EXISTS idx_term_statutes_term_id ON term_statutes(term_id)' },
    { name: 'Index daily_term', sql: 'CREATE INDEX IF NOT EXISTS idx_daily_term_date ON daily_term(display_date)' },

    // Seed statutes
    {
        name: 'Seed statutory_table',
        sql: `INSERT INTO statutory_table (statute_name, section, description, url) VALUES
            ('Indian Penal Code, 1860', 'Section 302', 'Punishment for murder.', 'https://indiankanoon.org/doc/1560742/'),
            ('Code of Criminal Procedure, 1973', 'Section 438', 'Anticipatory bail provisions.', 'https://indiankanoon.org/doc/1722/'),
            ('Indian Evidence Act, 1872', 'Section 3', 'Definitions of Court, Fact, Relevant, Evidence.', 'https://indiankanoon.org/doc/1953529/'),
            ('Constitution of India', 'Article 21', 'Protection of life and personal liberty.', 'https://indiankanoon.org/doc/1199182/'),
            ('Constitution of India', 'Article 14', 'Right to equality.', 'https://indiankanoon.org/doc/367586/'),
            ('Code of Civil Procedure, 1908', 'Order XXXIX Rule 1', 'Temporary injunctions.', 'https://indiankanoon.org/doc/1671654/'),
            ('Limitation Act, 1963', 'Section 3', 'Bar of limitation.', 'https://indiankanoon.org/doc/1317393/')
            ON CONFLICT DO NOTHING`
    },

    // Seed daily_term
    {
        name: 'Seed daily_term',
        sql: `INSERT INTO daily_term (term_id, display_date) VALUES
            (1, CURRENT_DATE),
            (7, CURRENT_DATE + INTERVAL '1 day'),
            (9, CURRENT_DATE + INTERVAL '2 days'),
            (3, CURRENT_DATE + INTERVAL '3 days'),
            (6, CURRENT_DATE + INTERVAL '4 days'),
            (14, CURRENT_DATE + INTERVAL '5 days'),
            (2, CURRENT_DATE + INTERVAL '6 days')
            ON CONFLICT (display_date) DO NOTHING`
    },
];

async function run() {
    console.log('🔧 Fixing mismatched tables...\n');

    for (const step of steps) {
        try {
            await pool.query(step.sql);
            console.log(`   ✅ ${step.name}`);
        } catch (err) {
            console.error(`   ❌ ${step.name}: ${err.message}`);
        }
    }

    // Verify
    console.log('\n📋 All tables:');
    const result = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    result.rows.forEach((row, i) => console.log(`   ${i + 1}. ${row.tablename}`));

    console.log('\n✅ Fix complete!');
    await pool.end();
}

run();
