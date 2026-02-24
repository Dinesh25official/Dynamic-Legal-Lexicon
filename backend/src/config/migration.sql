-- ============================================================
-- Dynamic Legal Lexicon — Database Migration
-- Run this file against your PostgreSQL database to create
-- all required tables, indexes, and triggers.
-- ============================================================

-- 1. Core Legal Terms Table
CREATE TABLE IF NOT EXISTS terms_law_table (
    id              SERIAL PRIMARY KEY,
    term            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    etymology       TEXT,
    pronunciation   VARCHAR(255),
    search_vector   TSVECTOR,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_terms_search_vector
    ON terms_law_table USING GIN(search_vector);

-- Index on term for alphabetical/exact lookups
CREATE INDEX IF NOT EXISTS idx_terms_term
    ON terms_law_table (LOWER(term));

-- Auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.term, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_search_vector ON terms_law_table;
CREATE TRIGGER trg_update_search_vector
    BEFORE INSERT OR UPDATE ON terms_law_table
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- 2. Contexts Table (Civil, Criminal, Constitutional, etc.)
CREATE TABLE IF NOT EXISTS contexts (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Term-Context Mapping (many-to-many with context-specific meaning)
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

-- 4. Case Law Table
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

-- 5. Statutory Table
CREATE TABLE IF NOT EXISTS statutory_table (
    id              SERIAL PRIMARY KEY,
    statute_name    VARCHAR(500) NOT NULL,
    section         VARCHAR(100),
    description     TEXT,
    url             TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Term-Cases Linking (many-to-many)
CREATE TABLE IF NOT EXISTS term_cases (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    case_id         INTEGER NOT NULL REFERENCES case_law_table(id) ON DELETE CASCADE,
    relevance_note  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_term_cases_term_id ON term_cases(term_id);

-- 7. Term-Statutes Linking (many-to-many)
CREATE TABLE IF NOT EXISTS term_statutes (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    statute_id      INTEGER NOT NULL REFERENCES statutory_table(id) ON DELETE CASCADE,
    relevance_note  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_id, statute_id)
);

CREATE INDEX IF NOT EXISTS idx_term_statutes_term_id ON term_statutes(term_id);

-- 8. Daily Term (Term of the Day)
CREATE TABLE IF NOT EXISTS daily_term (
    id              SERIAL PRIMARY KEY,
    term_id         INTEGER NOT NULL REFERENCES terms_law_table(id) ON DELETE CASCADE,
    display_date    DATE NOT NULL UNIQUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_term_date ON daily_term(display_date);
