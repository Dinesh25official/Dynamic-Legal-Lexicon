const db = require('../../config/db');

/**
 * SEARCH ENGINE 1: Search by Term Name
 * When user enters a term, returns ALL matching terms and their descriptions.
 * Exact matches rank highest, then partial matches (e.g., "action" finds
 * "action", "actionable", "cause of action", etc.)
 */
const searchByTerm = async (query, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
        `SELECT 
            t.id,
            t.term,
            t.description,
            t.etymology,
            t.pronunciation,
            t.created_at,
            CASE 
                WHEN LOWER(t.term) = LOWER($1) THEN 1.0
                ELSE 0.5
            END AS relevance
        FROM terms_law_table t
        WHERE LOWER(t.term) LIKE LOWER($2)
        ORDER BY relevance DESC, t.term ASC
        LIMIT $3 OFFSET $4`,
        [query.trim(), `%${query.trim()}%`, limit, offset]
    );

    const countResult = await db.query(
        `SELECT COUNT(*) AS total
        FROM terms_law_table t
        WHERE LOWER(t.term) LIKE LOWER($1)`,
        [`%${query.trim()}%`]
    );

    return {
        searchType: 'term',
        terms: dataResult.rows,
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
        },
    };
};

/**
 * SEARCH ENGINE 2: Search by Description
 * When user enters a description (or keywords from it), returns the matching term(s).
 * Uses ILIKE for phrase matching + full-text search for keyword matching.
 */
const searchByDescription = async (query, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const tsQuery = query
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 2) // skip very short words
        .map((word) => `${word}:*`)
        .join(' & ');

    // If tsQuery is empty (all words were too short), use ILIKE only
    const hasTsQuery = tsQuery.length > 0;

    let dataQuery, countQuery, params;

    if (hasTsQuery) {
        dataQuery = `SELECT 
                t.id,
                t.term,
                t.description,
                t.etymology,
                t.pronunciation,
                t.created_at,
                CASE 
                    WHEN LOWER(t.description) LIKE LOWER($1) THEN 1.0
                    ELSE ts_rank(t.search_vector, to_tsquery('english', $2)) * 0.5
                END AS relevance
            FROM terms_law_table t
            WHERE 
                LOWER(t.description) LIKE LOWER($1)
                OR t.search_vector @@ to_tsquery('english', $2)
            ORDER BY relevance DESC, t.term ASC
            LIMIT $3 OFFSET $4`;

        countQuery = `SELECT COUNT(*) AS total
            FROM terms_law_table t
            WHERE 
                LOWER(t.description) LIKE LOWER($1)
                OR t.search_vector @@ to_tsquery('english', $2)`;

        params = [`%${query.trim()}%`, tsQuery, limit, offset];
    } else {
        dataQuery = `SELECT 
                t.id,
                t.term,
                t.description,
                t.etymology,
                t.pronunciation,
                t.created_at,
                1.0 AS relevance
            FROM terms_law_table t
            WHERE LOWER(t.description) LIKE LOWER($1)
            ORDER BY t.term ASC
            LIMIT $2 OFFSET $3`;

        countQuery = `SELECT COUNT(*) AS total
            FROM terms_law_table t
            WHERE LOWER(t.description) LIKE LOWER($1)`;

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
            page,
            limit,
            total: parseInt(countResult.rows[0].total, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
        },
    };
};

/**
 * Get a single term by ID with all related data:
 * contexts, case laws, and statutes.
 */
const getTermById = async (id) => {
    const termResult = await db.query(
        `SELECT id, term, description, etymology, pronunciation, created_at, updated_at
     FROM terms_law_table WHERE id = $1`,
        [id]
    );

    if (termResult.rows.length === 0) {
        return null;
    }

    const term = termResult.rows[0];

    const contextsResult = await db.query(
        `SELECT c.id, c.name, c.description AS context_description, tc.meaning
     FROM term_contexts tc
     INNER JOIN contexts c ON tc.context_id = c.id
     WHERE tc.term_id = $1
     ORDER BY c.name`,
        [id]
    );

    const casesResult = await db.query(
        `SELECT cl.id, cl.case_name, cl.citation, cl.court, cl.year, cl.summary, cl.url, tcl.relevance_note
     FROM term_cases tcl
     INNER JOIN case_law_table cl ON tcl.case_id = cl.id
     WHERE tcl.term_id = $1
     ORDER BY cl.year DESC`,
        [id]
    );

    const statutesResult = await db.query(
        `SELECT s.id, s.statute_name, s.section, s.description, s.url, ts.relevance_note
     FROM term_statutes ts
     INNER JOIN statutory_table s ON ts.statute_id = s.id
     WHERE ts.term_id = $1
     ORDER BY s.statute_name`,
        [id]
    );

    return {
        ...term,
        contexts: contextsResult.rows,
        cases: casesResult.rows,
        statutes: statutesResult.rows,
    };
};

/**
 * Get Term of the Day.
 * Falls back to a random term if none is scheduled for today.
 */
const getTermOfTheDay = async () => {
    const todayResult = await db.query(
        `SELECT t.id, t.term, t.description, t.etymology, t.pronunciation, t.created_at,
            dt.display_date
     FROM daily_term dt
     INNER JOIN terms_law_table t ON dt.term_id = t.id
     WHERE dt.display_date = CURRENT_DATE`
    );

    if (todayResult.rows.length > 0) {
        const term = todayResult.rows[0];

        const contextsResult = await db.query(
            `SELECT c.id, c.name, tc.meaning
       FROM term_contexts tc
       INNER JOIN contexts c ON tc.context_id = c.id
       WHERE tc.term_id = $1
       ORDER BY c.name`,
            [term.id]
        );

        return {
            ...term,
            contexts: contextsResult.rows,
            isScheduled: true,
        };
    }

    // Fallback: random term
    const randomResult = await db.query(
        `SELECT id, term, description, etymology, pronunciation, created_at
     FROM terms_law_table
     ORDER BY RANDOM()
     LIMIT 1`
    );

    if (randomResult.rows.length === 0) {
        return null;
    }

    const term = randomResult.rows[0];

    const contextsResult = await db.query(
        `SELECT c.id, c.name, tc.meaning
     FROM term_contexts tc
     INNER JOIN contexts c ON tc.context_id = c.id
     WHERE tc.term_id = $1
     ORDER BY c.name`,
        [term.id]
    );

    return {
        ...term,
        contexts: contextsResult.rows,
        isScheduled: false,
    };
};

module.exports = {
    searchByTerm,
    searchByDescription,
    getTermById,
    getTermOfTheDay,
};
