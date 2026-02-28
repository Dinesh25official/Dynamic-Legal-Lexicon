/**
 * Full Supabase Setup Script — Bulletproof Edition
 * 
 * Strategy: Create all tables WITHOUT foreign keys first,
 * then add FK constraints via ALTER TABLE.
 * This avoids all PgBouncer/Supabase pooler issues.
 *
 * Usage: node run_full_setup.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DB_URL;

if (!connectionString) {
    console.error('❌ DB_URL is not set in your .env file.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

// ── Phase 1: Create all tables (NO foreign keys) ──
const createTables = [
    {
        name: 'app_users',
        sql: `CREATE TABLE IF NOT EXISTS app_users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'terms_law_table',
        sql: `CREATE TABLE IF NOT EXISTS terms_law_table (
            id SERIAL PRIMARY KEY,
            term VARCHAR(500) UNIQUE NOT NULL,
            oxford_definition TEXT NOT NULL,
            simplified_definition TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            search_vector TSVECTOR
        )`
    },
    {
        name: 'contexts',
        sql: `CREATE TABLE IF NOT EXISTS contexts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'case_law_table',
        sql: `CREATE TABLE IF NOT EXISTS case_law_table (
            id SERIAL PRIMARY KEY,
            case_name VARCHAR(500) NOT NULL,
            citation VARCHAR(255),
            court VARCHAR(255),
            year INTEGER,
            summary TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'statutory_table',
        sql: `CREATE TABLE IF NOT EXISTS statutory_table (
            id SERIAL PRIMARY KEY,
            statute_name VARCHAR(500) NOT NULL,
            section VARCHAR(100),
            description TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'term_contexts',
        sql: `CREATE TABLE IF NOT EXISTS term_contexts (
            id SERIAL PRIMARY KEY,
            term_id INTEGER NOT NULL,
            context_id INTEGER NOT NULL,
            meaning TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(term_id, context_id)
        )`
    },
    {
        name: 'term_cases',
        sql: `CREATE TABLE IF NOT EXISTS term_cases (
            id SERIAL PRIMARY KEY,
            term_id INTEGER NOT NULL,
            case_id INTEGER NOT NULL,
            relevance_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(term_id, case_id)
        )`
    },
    {
        name: 'term_statutes',
        sql: `CREATE TABLE IF NOT EXISTS term_statutes (
            id SERIAL PRIMARY KEY,
            term_id INTEGER NOT NULL,
            statute_id INTEGER NOT NULL,
            relevance_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(term_id, statute_id)
        )`
    },
    {
        name: 'daily_term',
        sql: `CREATE TABLE IF NOT EXISTS daily_term (
            id SERIAL PRIMARY KEY,
            term_id INTEGER NOT NULL,
            display_date DATE NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    },
    {
        name: 'bookmarks',
        sql: `CREATE TABLE IF NOT EXISTS bookmarks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            term_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, term_id)
        )`
    },
];

// ── Phase 2: Add foreign key constraints ──
const addConstraints = [
    `DO $$ BEGIN
        ALTER TABLE term_contexts ADD CONSTRAINT fk_tc_term FOREIGN KEY (term_id) REFERENCES terms_law_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE term_contexts ADD CONSTRAINT fk_tc_context FOREIGN KEY (context_id) REFERENCES contexts(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE term_cases ADD CONSTRAINT fk_tca_term FOREIGN KEY (term_id) REFERENCES terms_law_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE term_cases ADD CONSTRAINT fk_tca_case FOREIGN KEY (case_id) REFERENCES case_law_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE term_statutes ADD CONSTRAINT fk_ts_term FOREIGN KEY (term_id) REFERENCES terms_law_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE term_statutes ADD CONSTRAINT fk_ts_statute FOREIGN KEY (statute_id) REFERENCES statutory_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE daily_term ADD CONSTRAINT fk_dt_term FOREIGN KEY (term_id) REFERENCES terms_law_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE bookmarks ADD CONSTRAINT fk_bk_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    `DO $$ BEGIN
        ALTER TABLE bookmarks ADD CONSTRAINT fk_bk_term FOREIGN KEY (term_id) REFERENCES terms_law_table(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

// ── Phase 3: Indexes and triggers ──
const createIndexesAndTriggers = [
    `CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $func$
    BEGIN
      NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.term, '') || ' ' ||
        COALESCE(NEW.oxford_definition, '') || ' ' ||
        COALESCE(NEW.simplified_definition, '')
      );
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql`,

    `DROP TRIGGER IF EXISTS trg_search_vector ON terms_law_table`,

    `CREATE TRIGGER trg_search_vector
     BEFORE INSERT OR UPDATE ON terms_law_table
     FOR EACH ROW EXECUTE FUNCTION update_search_vector()`,

    `CREATE INDEX IF NOT EXISTS idx_search_vector ON terms_law_table USING GIN(search_vector)`,
    `CREATE INDEX IF NOT EXISTS idx_term_lower ON terms_law_table (LOWER(term))`,
    `CREATE INDEX IF NOT EXISTS idx_term_contexts_term_id ON term_contexts(term_id)`,
    `CREATE INDEX IF NOT EXISTS idx_term_contexts_context_id ON term_contexts(context_id)`,
    `CREATE INDEX IF NOT EXISTS idx_term_cases_term_id ON term_cases(term_id)`,
    `CREATE INDEX IF NOT EXISTS idx_term_statutes_term_id ON term_statutes(term_id)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_term_date ON daily_term(display_date)`,
];

// ── Phase 4: Seed data ──
const seedStatements = [
    `INSERT INTO terms_law_table (term, oxford_definition, simplified_definition) VALUES
    ('Habeas Corpus', 'A writ requiring a person under arrest to be brought before a judge or into court, especially to secure the person''s release unless lawful grounds are shown for their detention.', 'A legal order that says someone who is being held must be brought to court so a judge can decide if their detention is legal.'),
    ('Jurisdiction', 'The official power to make legal decisions and judgments.', 'The authority of a court to hear and decide a case.'),
    ('Tort', 'A wrongful act, other than a breach of contract, that results in injury to another person''s body, property, reputation, or the like.', 'A wrong done to someone that causes harm, and the person who was harmed can sue for money.'),
    ('Injunction', 'A judicial order that restrains a person from beginning or continuing an action threatening the legal right of another.', 'A court order telling someone to stop doing something or to do something specific.'),
    ('Bail', 'The temporary release of an accused person awaiting trial, sometimes on condition that a sum of money be lodged.', 'When an accused person is let out of jail before their trial, usually after paying money.'),
    ('Precedent', 'A previous case or legal decision that may be or must be followed in subsequent similar cases.', 'An earlier court decision that guides how judges should decide similar cases in the future.'),
    ('Mens Rea', 'The intention or knowledge of wrongdoing that constitutes part of a crime.', 'The mental state of intending to commit a crime.'),
    ('Stare Decisis', 'The legal principle of determining points in litigation according to precedent.', 'The rule that courts should follow earlier decisions when deciding similar cases.'),
    ('Due Process', 'Fair treatment through the normal judicial system, especially as a citizen''s entitlement.', 'The idea that everyone has the right to be treated fairly by the legal system.'),
    ('Writ', 'A form of written command in the name of a court or other legal authority to act, or abstain from acting.', 'A formal written order issued by a court.'),
    ('Plaintiff', 'A person who brings a case against another in a court of law.', 'The person who files a lawsuit against someone else in court.'),
    ('Defendant', 'An individual, company, or institution sued or accused in a court of law.', 'The person or organization being sued or charged with a crime in court.'),
    ('Affidavit', 'A written statement confirmed by oath or affirmation, for use as evidence in court.', 'A written statement that someone swears is true, used as evidence in court.'),
    ('Subpoena', 'A writ ordering a person to attend a court proceeding.', 'An official order requiring someone to appear in court or provide documents.'),
    ('Statute of Limitations', 'A law that sets the maximum time after an event within which legal proceedings may be initiated.', 'A deadline for filing a lawsuit. If you wait too long, you lose the right to sue.')
    ON CONFLICT (term) DO NOTHING`,

    `INSERT INTO contexts (name, description) VALUES
    ('Civil', 'Relating to civil law'),
    ('Criminal', 'Relating to criminal law'),
    ('Constitutional', 'Relating to constitutional law'),
    ('Corporate', 'Relating to corporate and business law'),
    ('Family', 'Relating to family law'),
    ('Property', 'Relating to property and real estate law'),
    ('Administrative', 'Relating to administrative and regulatory law'),
    ('International', 'Relating to international law and treaties')
    ON CONFLICT (name) DO NOTHING`,

    `INSERT INTO case_law_table (case_name, citation, court, year, summary, url) VALUES
    ('Maneka Gandhi v. Union of India', 'AIR 1978 SC 597', 'Supreme Court of India', 1978, 'Expanded the scope of Article 21.', 'https://indiankanoon.org/doc/1766147/'),
    ('Kesavananda Bharati v. State of Kerala', 'AIR 1973 SC 1461', 'Supreme Court of India', 1973, 'Established the Basic Structure Doctrine.', 'https://indiankanoon.org/doc/257876/'),
    ('Vishaka v. State of Rajasthan', 'AIR 1997 SC 3011', 'Supreme Court of India', 1997, 'Laid down guidelines for prevention of sexual harassment at workplace.', 'https://indiankanoon.org/doc/1031794/'),
    ('A.K. Gopalan v. State of Madras', 'AIR 1950 SC 27', 'Supreme Court of India', 1950, 'Early interpretation of preventive detention and personal liberty.', 'https://indiankanoon.org/doc/1857950/'),
    ('Olga Tellis v. Bombay Municipal Corporation', 'AIR 1986 SC 180', 'Supreme Court of India', 1985, 'Right to livelihood is part of right to life under Article 21.', 'https://indiankanoon.org/doc/709776/'),
    ('State of West Bengal v. Anwar Ali Sarkar', 'AIR 1952 SC 75', 'Supreme Court of India', 1952, 'Discussed the scope of equal protection under Article 14.', 'https://indiankanoon.org/doc/100472/')
    ON CONFLICT DO NOTHING`,

    `INSERT INTO statutory_table (statute_name, section, description, url) VALUES
    ('Indian Penal Code, 1860', 'Section 302', 'Punishment for murder.', 'https://indiankanoon.org/doc/1560742/'),
    ('Code of Criminal Procedure, 1973', 'Section 438', 'Anticipatory bail provisions.', 'https://indiankanoon.org/doc/1722/'),
    ('Indian Evidence Act, 1872', 'Section 3', 'Definitions of Court, Fact, Relevant, Evidence.', 'https://indiankanoon.org/doc/1953529/'),
    ('Constitution of India', 'Article 21', 'Protection of life and personal liberty.', 'https://indiankanoon.org/doc/1199182/'),
    ('Constitution of India', 'Article 14', 'Right to equality.', 'https://indiankanoon.org/doc/367586/'),
    ('Code of Civil Procedure, 1908', 'Order XXXIX Rule 1', 'Temporary injunctions.', 'https://indiankanoon.org/doc/1671654/'),
    ('Limitation Act, 1963', 'Section 3', 'Bar of limitation.', 'https://indiankanoon.org/doc/1317393/')
    ON CONFLICT DO NOTHING`,

    `INSERT INTO daily_term (term_id, display_date) VALUES
    (1, CURRENT_DATE),
    (7, CURRENT_DATE + INTERVAL '1 day'),
    (9, CURRENT_DATE + INTERVAL '2 days'),
    (3, CURRENT_DATE + INTERVAL '3 days'),
    (6, CURRENT_DATE + INTERVAL '4 days'),
    (14, CURRENT_DATE + INTERVAL '5 days'),
    (2, CURRENT_DATE + INTERVAL '6 days')
    ON CONFLICT (display_date) DO NOTHING`,
];

async function executePhase(name, statements, options = {}) {
    console.log(`\n${name}`);
    let success = 0;
    for (let i = 0; i < statements.length; i++) {
        const stmt = typeof statements[i] === 'object' ? statements[i] : { sql: statements[i], name: `Statement ${i + 1}` };
        const sql = stmt.sql || stmt;
        const label = stmt.name || `[${i + 1}/${statements.length}]`;
        try {
            await pool.query(sql);
            console.log(`   ✅ ${label}`);
            success++;
        } catch (err) {
            if (err.code === '42P07' || err.code === '42710' || err.code === '23505') {
                console.log(`   ⏭️  ${label} (already exists)`);
                success++;
            } else if (options.continueOnError) {
                console.warn(`   ⚠️  ${label}: ${err.message}`);
            } else {
                console.error(`   ❌ ${label}: ${err.message}`);
                throw err;
            }
        }
    }
    console.log(`   Done (${success}/${statements.length})`);
}

async function run() {
    console.log('══════════════════════════════════════════');
    console.log('  Supabase Full Setup — Legal Lexicon');
    console.log('══════════════════════════════════════════');

    try {
        // Phase 1: Create tables (NO foreign keys)
        await executePhase('📦 Phase 1: Creating tables...', createTables);

        // Phase 2: Add FK constraints
        await executePhase('🔗 Phase 2: Adding foreign key constraints...', addConstraints, { continueOnError: true });

        // Phase 3: Indexes & triggers
        await executePhase('📇 Phase 3: Creating indexes & triggers...', createIndexesAndTriggers, { continueOnError: true });

        // Phase 4: Seed data
        await executePhase('🌱 Phase 4: Seeding data...', seedStatements, { continueOnError: true });

        // Verify
        console.log('\n📋 Verification:');
        const result = await pool.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        );
        result.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. ${row.tablename}`);
        });

        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM app_users'),
            pool.query('SELECT COUNT(*) FROM terms_law_table'),
        ]);
        console.log(`\n📊 Users: ${counts[0].rows[0].count} | Terms: ${counts[1].rows[0].count}`);

        console.log('\n══════════════════════════════════════════');
        console.log('  ✅ Supabase setup complete!');
        console.log('══════════════════════════════════════════');
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
    } finally {
        await pool.end();
    }
}

run();
