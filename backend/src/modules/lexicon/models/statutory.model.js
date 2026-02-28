const db = require('../../../config/db');

/**
 * Get all statutory references (paginated).
 */
const getStatutoryList = async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const data = await db.query(
        `SELECT ctid, "Legal Term" as term, statute_name, section, description, url
         FROM statutory_table
         ORDER BY statute_name ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    const count = await db.query('SELECT COUNT(*) FROM statutory_table');

    return {
        statutes: data.rows,
        total: parseInt(count.rows[0].count, 10)
    };
};

/**
 * Get statutory references for a specific legal term.
 * Matches using the "Legal Term" column in statutory_table.
 */
const getStatutoryByTerm = async (term) => {
    const result = await db.query(
        `SELECT ctid, statute_name, section, description, url
         FROM statutory_table
         WHERE LOWER(TRIM("Legal Term")) = LOWER(TRIM($1))`,
        [term]
    );
    return result.rows;
};

/**
 * Add a new statutory reference.
 */
const addStatutory = async ({ term, statute_name, section, description, url }) => {
    const result = await db.query(
        `INSERT INTO statutory_table ("Legal Term", statute_name, section, description, url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ctid, *`,
        [term, statute_name, section, description, url]
    );
    return result.rows[0];
};

/**
 * Update a statutory reference by ctid.
 */
const updateStatutory = async (ctid, { term, statute_name, section, description, url }) => {
    const result = await db.query(
        `UPDATE statutory_table
         SET "Legal Term" = COALESCE($1, "Legal Term"),
             statute_name = COALESCE($2, statute_name),
             section = COALESCE($3, section),
             description = COALESCE($4, description),
             url = COALESCE($5, url)
         WHERE ctid = $6::tid
         RETURNING ctid, *`,
        [term, statute_name, section, description, url, ctid]
    );
    return result.rows[0];
};

/**
 * Delete a statutory reference by ctid.
 */
const deleteStatutory = async (ctid) => {
    const result = await db.query(
        `DELETE FROM statutory_table WHERE ctid = $1::tid RETURNING *`,
        [ctid]
    );
    return result.rows[0];
};

module.exports = {
    getStatutoryList,
    getStatutoryByTerm,
    addStatutory,
    updateStatutory,
    deleteStatutory
};
