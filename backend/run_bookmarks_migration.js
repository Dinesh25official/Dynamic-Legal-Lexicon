const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DB_URL;

if (!connectionString) {
    console.error('❌ DB_URL is not set in your .env file.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'bookmarks.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Migration SQL file not found at ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running bookmarks migration...');

        await pool.query(sql);
        console.log('✅ Bookmarks table created successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

run();
