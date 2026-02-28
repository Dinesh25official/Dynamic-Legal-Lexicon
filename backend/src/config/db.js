const { Pool } = require('pg');
require('dotenv').config();

// Support both DB_URL (Supabase cloud) and individual DB_ variables (local fallback)
const pool = process.env.DB_URL
    ? new Pool({
        connectionString: process.env.DB_URL,
        ssl: { rejectUnauthorized: false }, // Required for Supabase/cloud
    })
    : new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
    });

pool.on('connect', () => {
    const dbType = process.env.DB_URL ? '☁️  Supabase Cloud' : '🏠 Local PostgreSQL';
    console.log(`✅ Connected to ${dbType} database`);
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
