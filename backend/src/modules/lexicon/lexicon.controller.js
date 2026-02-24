const lexiconModel = require('./lexicon.model');

/**
 * GET /api/lexicon/search
 * Query params: q (search query), context (filter), page, limit
 */
const search = async (req, res) => {
    try {
        const { q, context, page = 1, limit = 10 } = req.query;

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const results = await lexiconModel.searchTerms(q, context, parsedPage, parsedLimit);

        return res.status(200).json({
            success: true,
            message: q
                ? `Search results for "${q}"${context ? ` in ${context} context` : ''}`
                : 'All legal terms',
            data: results,
        });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while searching terms',
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
    search,
    getTermById,
    getTermOfTheDay,
};
