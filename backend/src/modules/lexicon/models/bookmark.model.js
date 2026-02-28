const db = require('../../../config/db');

/**
 * Get all bookmarks for a specific user
 */
const getBookmarksByUser = async (userId) => {
    const result = await db.query(
        `SELECT 
            b.id as bookmark_id, 
            b.legal_term as term, 
            lt."Fixed (Oxford) Definition" as oxford_definition, 
            lt."Simplified Definition" as simplified_definition, 
            b.created_at
         FROM bookmarks b
         LEFT JOIN legal_terms lt ON LOWER(b.legal_term) = LOWER(lt."Legal Term")
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
    );
    return result.rows;
};

/**
 * Add a new bookmark
 */
const addBookmark = async (userId, term) => {
    // Check if already exists
    const check = await db.query(
        'SELECT id FROM bookmarks WHERE user_id = $1 AND legal_term = $2',
        [userId, term]
    );

    if (check.rows.length > 0) return check.rows[0];

    const result = await db.query(
        `INSERT INTO bookmarks (user_id, legal_term)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, term]
    );
    return result.rows[0];
};

/**
 * Remove a bookmark
 */
const deleteBookmark = async (userId, term) => {
    const result = await db.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND legal_term = $2 RETURNING *',
        [userId, term]
    );
    return result.rows[0] || null;
};

module.exports = {
    getBookmarksByUser,
    addBookmark,
    deleteBookmark
};
