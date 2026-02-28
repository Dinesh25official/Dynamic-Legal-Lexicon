-- ============================================
-- Migration: Rebuild terms table for new dataset
-- Columns: term, oxford_definition, simplified_definition
-- ============================================

-- Drop dependent tables first (if they exist)
DROP TABLE IF EXISTS term_cases CASCADE;
DROP TABLE IF EXISTS term_contexts CASCADE;
DROP TABLE IF EXISTS term_statutes CASCADE;
DROP TABLE IF EXISTS daily_term CASCADE;

-- Drop and recreate main terms table
DROP TABLE IF EXISTS terms_law_table CASCADE;

CREATE TABLE terms_law_table (
    id SERIAL PRIMARY KEY,
    term VARCHAR(500) UNIQUE NOT NULL,
    oxford_definition TEXT NOT NULL,
    simplified_definition TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector
);

-- Full-text search trigger: auto-update search_vector on insert/update
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

CREATE TRIGGER trg_search_vector
BEFORE INSERT OR UPDATE ON terms_law_table
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Indexes for fast lookup
CREATE INDEX idx_search_vector ON terms_law_table USING GIN(search_vector);
CREATE INDEX idx_term_lower ON terms_law_table (LOWER(term));
