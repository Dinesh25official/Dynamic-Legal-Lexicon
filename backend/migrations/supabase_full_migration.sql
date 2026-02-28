-- ============================================================
-- Dynamic Legal Lexicon — Full Supabase Migration
-- Creates ALL tables in correct dependency order.
-- Safe to re-run (uses IF NOT EXISTS throughout).
-- ============================================================

-- ─── 1. App Users (Auth) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(50) DEFAULT 'student',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. Core Legal Terms ────────────────────────────────────
CREATE TABLE IF NOT EXISTS terms_law_table (
    id                      SERIAL PRIMARY KEY,
    term                    VARCHAR(500) UNIQUE NOT NULL,
    oxford_definition       TEXT NOT NULL,
    simplified_definition   TEXT NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_vector           TSVECTOR
);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.term, '') || ' ' ||
    COALESCE(NEW.oxford_definition, '') || ' ' ||
    COALESCE(NEW.simplified_definition, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_vector ON terms_law_table;
CREATE TRIGGER trg_search_vector
BEFORE INSERT OR UPDATE ON terms_law_table
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_vector ON terms_law_table USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_term_lower ON terms_law_table (LOWER(term));

-- ─── 3. Contexts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contexts (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 4. Case Law ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_law_table (
    id              SERIAL PRIMARY KEY,
    case_name       VARCHAR(500) NOT NULL,
    citation        VARCHAR(255),
    court           VARCHAR(255),
    year            INTEGER,
    summary         TEXT,
    url             TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 5. Statutory References ────────────────────────────────
CREATE TABLE IF NOT EXISTS statutory_table (
    id              SERIAL PRIMARY KEY,
    statute_name    VARCHAR(500) NOT NULL,
    section         VARCHAR(100),
    description     TEXT,
    url             TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 6. Term-Context Mapping (many-to-many) ─────────────────
CREATE TABLE IF NOT EXISTS term_contexts (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    context_id      INTEGER NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
    meaning         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_id, context_id)
);

CREATE INDEX IF NOT EXISTS idx_term_contexts_term_id ON term_contexts(term_id);
CREATE INDEX IF NOT EXISTS idx_term_contexts_context_id ON term_contexts(context_id);

-- ─── 7. Term-Cases Linking (many-to-many) ───────────────────
CREATE TABLE IF NOT EXISTS term_cases (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    case_id         INTEGER NOT NULL REFERENCES case_law_table(id) ON DELETE CASCADE,
    relevance_note  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_term_cases_term_id ON term_cases(term_id);

-- ─── 8. Term-Statutes Linking (many-to-many) ────────────────
CREATE TABLE IF NOT EXISTS term_statutes (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    statute_id      INTEGER NOT NULL REFERENCES statutory_table(id) ON DELETE CASCADE,
    relevance_note  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_id, statute_id)
);

CREATE INDEX IF NOT EXISTS idx_term_statutes_term_id ON term_statutes(term_id);

-- ─── 9. Daily Term (Term of the Day) ────────────────────────
CREATE TABLE IF NOT EXISTS daily_term (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    display_date    DATE NOT NULL UNIQUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_term_date ON daily_term(display_date);

-- ─── 10. Bookmarks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES app_users(id) ON DELETE CASCADE,
    term_id         INTEGER REFERENCES terms_law_table(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, term_id)
);
