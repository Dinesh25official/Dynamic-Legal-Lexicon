const db = require('../../../config/db');

/**
 * Get the currently active Daily Term.
 * Joins daily_term with legal_terms if definitions are missing.
 */
const getActiveDailyTerm = async () => {
    const result = await db.query(
        `SELECT dt.legal_term, 
                COALESCE(dt."Fixed Definition", lt."Fixed (Oxford) Definition") as "Fixed (Oxford) Definition",
                COALESCE(dt."Simplified Definition", lt."Simplified Definition") as "Simplified Definition"
         FROM daily_term dt
         LEFT JOIN legal_terms lt ON LOWER(dt.legal_term) = LOWER(lt."Legal Term")
         WHERE dt.is_active = true
         LIMIT 1`
    );
    return result.rows[0] || null;
};

/**
 * Get all terms in the Daily Term pool.
 */
const getAllDailyTerms = async () => {
    const result = await db.query(
        `SELECT dt.legal_term, dt.is_active,
                COALESCE(dt."Fixed Definition", lt."Fixed (Oxford) Definition") as oxford_definition,
                COALESCE(dt."Simplified Definition", lt."Simplified Definition") as simplified_definition
         FROM daily_term dt
         LEFT JOIN legal_terms lt ON LOWER(dt.legal_term) = LOWER(lt."Legal Term")
         ORDER BY dt.legal_term ASC`
    );
    return result.rows;
};

/**
 * Add a term to the Daily Pool.
 */
const addToDailyPool = async (term, fixed_definition = null, simplified_definition = null) => {
    const result = await db.query(
        `INSERT INTO daily_term (legal_term, "Fixed Definition", "Simplified Definition", is_active)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (legal_term) DO UPDATE 
         SET "Fixed Definition" = EXCLUDED."Fixed Definition",
             "Simplified Definition" = EXCLUDED."Simplified Definition"
         RETURNING *`,
        [term, fixed_definition, simplified_definition]
    );
    return result.rows[0];
};

/**
 * Delete a term from the Daily Pool.
 */
const removeFromDailyPool = async (term) => {
    const result = await db.query(
        `DELETE FROM daily_term WHERE LOWER(legal_term) = LOWER($1) RETURNING *`,
        [term]
    );
    return result.rows[0];
};

/**
 * Rotate the active daily term from the pool.
 */
const rotateDailyTerm = async () => {
    // 1. Deactivate current active term
    await db.query('UPDATE daily_term SET is_active = false');

    // 2. Pick a random term from the pool
    const poolResult = await db.query('SELECT legal_term FROM daily_term');
    if (poolResult.rows.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * poolResult.rows.length);
    const newTerm = poolResult.rows[randomIndex].legal_term;

    // 3. Set new term to active
    const result = await db.query(
        `UPDATE daily_term SET is_active = true WHERE legal_term = $1 RETURNING *`,
        [newTerm]
    );

    return result.rows[0];
};

/**
 * Manually set a term in the pool as active.
 */
const setActiveTerm = async (term) => {
    await db.query('UPDATE daily_term SET is_active = false');
    const result = await db.query(
        `UPDATE daily_term SET is_active = true WHERE LOWER(legal_term) = LOWER($1) RETURNING *`,
        [term]
    );
    return result.rows[0];
};

module.exports = {
    getActiveDailyTerm,
    getAllDailyTerms,
    addToDailyPool,
    removeFromDailyPool,
    rotateDailyTerm,
    setActiveTerm,
    getDailyTerm: getActiveDailyTerm, // Legacy support
    setDailyTerm: (term) => addToDailyPool(term) // Legacy support
};
