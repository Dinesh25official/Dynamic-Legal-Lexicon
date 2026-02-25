const lexiconModel = require('./lexicon.model');

/**
 * GET /api/lexicon/search/term
 * Search Engine 1: User enters a TERM → returns the exact description
 * Query params: q (term name), page, limit
 */
const searchByTerm = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a term to search. Use ?q=action',
            });
        }

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const results = await lexiconModel.searchByTerm(q, parsedPage, parsedLimit);

        return res.status(200).json({
            success: true,
            message: results.terms.length > 0
                ? `Found description for term "${q}"`
                : `No term found matching "${q}"`,
            searchType: 'term → description',
            data: results,
        });
    } catch (error) {
        console.error('Term search error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while searching by term',
            error: error.message,
        });
    }
};

/**
 * GET /api/lexicon/search/description
 * Search Engine 2: User enters a DESCRIPTION → returns the matching term
 * Query params: q (description text/keywords), page, limit
 */
const searchByDescription = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide description keywords to search. Use ?q=insurance+guarantee',
            });
        }

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const results = await lexiconModel.searchByDescription(q, parsedPage, parsedLimit);

        return res.status(200).json({
            success: true,
            message: results.terms.length > 0
                ? `Found ${results.pagination.total} term(s) matching your description`
                : `No terms found matching description "${q}"`,
            searchType: 'description → term',
            data: results,
        });
    } catch (error) {
        console.error('Description search error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while searching by description',
            error: error.message,
        });
    }
};

/**
 * GET /api/lexicon/term/:id
 * Get full term detail by ID with contexts, cases, and statutes.
 */
const getTermById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid term ID. Please provide a valid numeric ID.',
            });
        }

        const term = await lexiconModel.getTermById(parseInt(id, 10));

        if (!term) {
            return res.status(404).json({
                success: false,
                message: `Term with ID ${id} not found`,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Term detail for "${term.term}"`,
            data: term,
        });
    } catch (error) {
        console.error('Get term error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the term',
            error: error.message,
        });
    }
};

/**
 * GET /api/lexicon/term-of-the-day
 * Returns today's featured legal term.
 */
const getTermOfTheDay = async (req, res) => {
    try {
        const term = await lexiconModel.getTermOfTheDay();

        if (!term) {
            return res.status(404).json({
                success: false,
                message: 'No terms available. Please seed the database with legal terms.',
            });
        }

        return res.status(200).json({
            success: true,
            message: `Term of the Day: "${term.term}"`,
            data: term,
        });
    } catch (error) {
        console.error('Term of the Day error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the Term of the Day',
            error: error.message,
        });
    }
};

module.exports = {
    searchByTerm,
    searchByDescription,
    getTermById,
    getTermOfTheDay,
};
