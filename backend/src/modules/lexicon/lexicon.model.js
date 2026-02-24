const db = require('../../config/db');

/**
 * Search legal terms using PostgreSQL full-text search.
 * Supports term search, description search, and optional context filtering.
 */
const searchTerms = async (query, contextFilter, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    let baseQuery = '';
    let countQuery = '';
    const params = [];
    let paramIndex = 1;

    if (query && query.trim() !== '') {
        // Convert user query to tsquery format (add :* for prefix matching)
        const tsQuery = query
            .trim()
            .split(/\s+/)
            .map((word) => `${word}:*`)
            .join(' & ');

        params.push(tsQuery);

        baseQuery = `
      SELECT 
        t.id,
        t.term,
        t.description,
        t.etymology,
        t.pronunciation,
        ts_rank(t.search_vector, to_tsquery('english', $${paramIndex})) AS relevance,
        t.created_at
      FROM terms_law_table t
    `;

        countQuery = `
      SELECT COUNT(*) AS total
      FROM terms_law_table t
    `;

        if (contextFilter) {
            baseQuery += `
        INNER JOIN term_contexts tc ON t.id = tc.term_id
        INNER JOIN contexts c ON tc.context_id = c.id
      `;
            countQuery += `
        INNER JOIN term_contexts tc ON t.id = tc.term_id
        INNER JOIN contexts c ON tc.context_id = c.id
      `;
        }

        baseQuery += ` WHERE t.search_vector @@ to_tsquery('english', $${paramIndex})`;
        countQuery += ` WHERE t.search_vector @@ to_tsquery('english', $${paramIndex})`;
        paramIndex++;

        if (contextFilter) {
            params.push(contextFilter);
            baseQuery += ` AND LOWER(c.name) = LOWER($${paramIndex})`;
            countQuery += ` AND LOWER(c.name) = LOWER($${paramIndex})`;
            paramIndex++;
        }

        baseQuery += ` ORDER BY relevance DESC`;
    } else {
        baseQuery = `
      SELECT 
        t.id,
        t.term,
        t.description,
        t.etymology,
        t.pronunciation,
        0 AS relevance,
        t.created_at
      FROM terms_law_table t
    `;

        countQuery = `
      SELECT COUNT(*) AS total
      FROM terms_law_table t
    `;

        if (contextFilter) {
            baseQuery += `
        INNER JOIN term_contexts tc ON t.id = tc.term_id
        INNER JOIN contexts c ON tc.context_id = c.id
        WHERE LOWER(c.name) = LOWER($${paramIndex})
      `;
            countQuery += `
        INNER JOIN term_contexts tc ON t.id = tc.term_id
        INNER JOIN contexts c ON tc.context_id = c.id
        WHERE LOWER(c.name) = LOWER($${paramIndex})
      `;
            params.push(contextFilter);
            paramIndex++;
        }

        baseQuery += ` ORDER BY t.term ASC`;
    }

    params.push(limit);
    baseQuery += ` LIMIT $${paramIndex}`;
    paramIndex++;

    params.push(offset);
    baseQuery += ` OFFSET $${paramIndex}`;

    const [dataResult, countResult] = await Promise.all([
        db.query(baseQuery, params),
        db.query(countQuery, params.slice(0, params.length - 2)),
    ]);

    return {
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
    searchTerms,
    getTermById,
    getTermOfTheDay,
};
