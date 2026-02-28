const db = require('../../../config/db');

/**
 * SEARCH ENGINE 1: Search by Term Name
 * Returns matching terms with both Oxford and Simplified definitions.
 * Exact matches rank highest.
 */
const searchByTerm = async (query, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
        `SELECT 
            t."Legal Term", t."Fixed (Oxford) Definition", t."Simplified Definition",
            (
                SELECT json_agg(json_build_object(
                    'statute_name', s.statute_name,
                    'section', s.section,
                    'description', s.description,
                    'url', s.url
                ))
                FROM statutory_table s
                WHERE LOWER(TRIM(s."Legal Term")) = LOWER(TRIM(t."Legal Term"))
            ) as statutory,
            CASE 
                WHEN LOWER(t."Legal Term") = LOWER($1) THEN 1.0
                ELSE 0.5
            END AS relevance
        FROM legal_terms t
        WHERE LOWER(t."Legal Term") LIKE LOWER($2)
        ORDER BY relevance DESC, t."Legal Term" ASC
        LIMIT $3 OFFSET $4`,
        [query.trim(), `%${query.trim()}%`, limit, offset]
    );

    const countResult = await db.query(
        `SELECT COUNT(*) AS total FROM legal_terms
         WHERE LOWER("Legal Term") LIKE LOWER($1)`,
        [`%${query.trim()}%`]
    );

    return {
        searchType: 'term',
        terms: dataResult.rows,
        pagination: {
            page, limit,
            total: parseInt(countResult.rows[0].total, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
        },
    };
};

/**
 * SEARCH ENGINE 2: Search by Description (keyword matching)
 * When user enters a description in their own words, matches keywords
 * against BOTH definitions.
 */
const searchByDescription = async (query, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    // Build full-text search query from user's words
    const tsQuery = query
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map((word) => `${word}:*`)
        .join(' & ');

    const hasTsQuery = tsQuery.length > 0;

    let dataQuery, countQuery, params;

    if (hasTsQuery) {
        // Match using ILIKE on both definitions + full-text search
        dataQuery = `SELECT 
                t."Legal Term", t."Fixed (Oxford) Definition", t."Simplified Definition",
                (
                    SELECT json_agg(json_build_object(
                        'statute_name', s.statute_name,
                        'section', s.section,
                        'description', s.description,
                        'url', s.url
                    ))
                    FROM statutory_table s
                    WHERE LOWER(TRIM(s."Legal Term")) = LOWER(TRIM(t."Legal Term"))
                ) as statutory,
                CASE 
                    WHEN LOWER(t."Fixed (Oxford) Definition") LIKE LOWER($1) THEN 1.0
                    WHEN LOWER(t."Simplified Definition") LIKE LOWER($1) THEN 0.9
                    ELSE ts_rank(to_tsvector('english', COALESCE(t.search_vector, '')), to_tsquery('english', $2)) * 0.5
                END AS relevance
            FROM legal_terms t
            WHERE 
                LOWER(t."Fixed (Oxford) Definition") LIKE LOWER($1)
                OR LOWER(t."Simplified Definition") LIKE LOWER($1)
                OR to_tsvector('english', COALESCE(t.search_vector, '')) @@ to_tsquery('english', $2)
            ORDER BY relevance DESC, t."Legal Term" ASC
            LIMIT $3 OFFSET $4`;

        countQuery = `SELECT COUNT(*) AS total FROM legal_terms
            WHERE 
                LOWER("Fixed (Oxford) Definition") LIKE LOWER($1)
                OR LOWER("Simplified Definition") LIKE LOWER($1)
                OR to_tsvector('english', COALESCE(search_vector, '')) @@ to_tsquery('english', $2)`;

        params = [`%${query.trim()}%`, tsQuery, limit, offset];
    } else {
        // Short words: ILIKE only
        dataQuery = `SELECT 
                t."Legal Term", t."Fixed (Oxford) Definition", t."Simplified Definition",
                (
                    SELECT json_agg(json_build_object(
                        'statute_name', s.statute_name,
                        'section', s.section,
                        'description', s.description,
                        'url', s.url
                    ))
                    FROM statutory_table s
                    WHERE LOWER(TRIM(s."Legal Term")) = LOWER(TRIM(t."Legal Term"))
                ) as statutory,
                1.0 AS relevance
            FROM legal_terms t
            WHERE 
                LOWER(t."Fixed (Oxford) Definition") LIKE LOWER($1)
                OR LOWER(t."Simplified Definition") LIKE LOWER($1)
            ORDER BY t."Legal Term" ASC
            LIMIT $2 OFFSET $3`;

        countQuery = `SELECT COUNT(*) AS total FROM legal_terms
            WHERE 
                LOWER("Fixed (Oxford) Definition") LIKE LOWER($1)
                OR LOWER("Simplified Definition") LIKE LOWER($1)`;

        params = [`%${query.trim()}%`, limit, offset];
    }

    const dataResult = await db.query(dataQuery, params);
    const countParams = hasTsQuery
        ? [`%${query.trim()}%`, tsQuery]
        : [`%${query.trim()}%`];
    const countResult = await db.query(countQuery, countParams);

    return {
        searchType: 'description',
        terms: dataResult.rows,
        pagination: {
            page, limit,
            total: parseInt(countResult.rows[0].total, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
        },
    };
};

/**
 * Get a single term by Term Name
 */
const getTermByValue = async (term) => {
    // Check legal_terms table first
    let result = await db.query(
        `SELECT "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition", 'legal_terms' as source
         FROM legal_terms WHERE LOWER("Legal Term") = LOWER($1)`,
        [term]
    );

    // If not found, check daily_term table
    if (result.rows.length === 0) {
        result = await db.query(
            `SELECT legal_term as "Legal Term", "Fixed Definition" as "Fixed (Oxford) Definition", "Simplified Definition", 'daily_term' as source
             FROM daily_term WHERE LOWER(legal_term) = LOWER($1)`,
            [term]
        );
    }

    return result.rows[0] || null;
};

/**
 * Get Term of the Day (random fallback, mostly from daily_term table now)
 */
const getTermOfTheDay = async () => {
    // Attempt to get an active term from daily_term
    let result = await db.query(
        `SELECT legal_term as "Legal Term", "Fixed Definition" as "Fixed (Oxford) Definition", "Simplified Definition"
         FROM daily_term 
         WHERE is_active = true
         LIMIT 1`
    );

    // If no active daily term exists, fallback to a random term from legal_terms
    if (result.rows.length === 0) {
        result = await db.query(
            `SELECT "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition"
             FROM legal_terms 
             ORDER BY md5("Legal Term" || CAST(CURRENT_DATE AS TEXT)) 
             LIMIT 1`
        );
    }

    return result.rows[0] || null;
};

/**
 * Get all terms (paginated) for admin
 */
const getAllTerms = async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
        `SELECT "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition"
         FROM legal_terms ORDER BY "Legal Term" ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    const countResult = await db.query(
        `SELECT COUNT(*) AS total FROM legal_terms`
    );

    return {
        terms: dataResult.rows,
        pagination: {
            page, limit,
            total: parseInt(countResult.rows[0].total, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
        },
    };
};

/**
 * Update a term by Term Name
 */
const updateTerm = async (originalTerm, { term, fixed_definition, simplified_definition }) => {
    const result = await db.query(
        `UPDATE legal_terms
         SET "Legal Term" = COALESCE($1, "Legal Term"),
             "Fixed (Oxford) Definition" = COALESCE($2, "Fixed (Oxford) Definition"),
             "Simplified Definition" = COALESCE($3, "Simplified Definition")
         WHERE "Legal Term" = $4
         RETURNING "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition"`,
        [term, fixed_definition, simplified_definition, originalTerm]
    );
    return result.rows[0] || null;
};

/**
 * Delete a term by Term Name
 */
const deleteTerm = async (term) => {
    const result = await db.query(
        `DELETE FROM legal_terms WHERE "Legal Term" = $1 RETURNING "Legal Term"`,
        [term]
    );
    return result.rows[0] || null;
};

module.exports = {
    searchByTerm,
    searchByDescription,
    getTermById: getTermByValue, // Alias for compatibility
    getTermByValue,
    getTermOfTheDay,
    getAllTerms,
    updateTerm,
    deleteTerm,
};
