-- Create Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES app_users(id) ON DELETE CASCADE,
    term_id INTEGER REFERENCES terms_law_table(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, term_id) -- Prevent duplicate bookmarks for the same term/user
);
