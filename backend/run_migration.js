/**
 * Migration Runner for Supabase Cloud Database
 * Runs the full migration SQL on the cloud database to create all tables.
 * Usage: node run_migration.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DB_URL;

if (!connectionString) {
    console.error('❌ DB_URL is not set in your .env file.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function runMigration() {
    console.log('🚀 Starting migration on Supabase Cloud...\n');

    try {
        // Read the consolidated migration file
        const sqlPath = path.join(__dirname, 'migrations', 'supabase_full_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Run the entire SQL file
        await pool.query(sql);
        console.log('✅ Migration completed successfully!\n');

        // List all created tables
        const result = await pool.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        );
        console.log('📋 Tables in Supabase:');
        result.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. ${row.tablename}`);
        });
        console.log(`\n   Total: ${result.rows.length} tables`);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();
