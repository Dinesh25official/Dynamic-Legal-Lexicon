const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DB_URL
    ? new Pool({
        connectionString: process.env.DB_URL,
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
    });

async function test() {
    try {
        console.log('Testing connection...');
        const res = await pool.query('SELECT 1');
        console.log('✅ Connection successful');

        console.log('Checking for users table in all schemas...');
        const tableSearch = await pool.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'users'
        `);
        if (tableSearch.rows.length > 0) {
            console.log('Found users table in:', tableSearch.rows.map(r => `${r.table_schema}.${r.table_name}`));
        } else {
            console.log('❌ Table "users" not found in ANY schema.');
        }
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

test();
