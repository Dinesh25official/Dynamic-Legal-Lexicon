const express = require('express');
const router = express.Router();
const bookmarkModel = require('./models/bookmark.model');
const { authorize } = require('../../middleware/auth');

// All bookmark routes require authentication
router.use(authorize());

/**
 * GET /api/lexicon/bookmarks
 * Get all bookmarks for the logged-in user
 */
router.get('/', async (req, res) => {
    try {
        const bookmarksRaw = await bookmarkModel.getBookmarksByUser(req.user.id);
        console.log('DEBUG: Bookmarks Raw Data fetched:', JSON.stringify(bookmarksRaw, null, 2));

        // Explicitly map to ensure frontend gets exactly what it needs
        const bookmarks = bookmarksRaw.map(b => ({
            id: b.bookmark_id,
            term: b.term || b.term_name || b["Legal Term"] || "Unknown Term",
            oxford_definition: b.oxford_definition || b["Fixed (Oxford) Definition"] || "",
            simplified_definition: b.simplified_definition || b["Simplified Definition"] || "",
            created_at: b.created_at
        }));

        res.json({ success: true, data: bookmarks });
    } catch (err) {
        console.error('Get Bookmarks Error:', err);
        res.status(500).json({ message: 'Failed to fetch bookmarks' });
    }
});

/**
 * POST /api/lexicon/bookmarks
 * Add a term to bookmarks
 */
router.post('/', async (req, res) => {
    const { termId } = req.body;
    if (!termId) return res.status(400).json({ message: 'termId is required' });

    try {
        const bookmark = await bookmarkModel.addBookmark(req.user.id, termId);
        res.status(201).json({ success: true, data: bookmark });
    } catch (err) {
        console.error('Add Bookmark Error:', err);
        res.status(500).json({ message: 'Failed to add bookmark' });
    }
});

/**
 * DELETE /api/lexicon/bookmarks/:termId
 * Remove a bookmark
 */
router.delete('/:termId', async (req, res) => {
    try {
        const removed = await bookmarkModel.deleteBookmark(req.user.id, req.params.termId);
        if (!removed) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }
        res.json({ success: true, message: 'Bookmark removed' });
    } catch (err) {
        console.error('Delete Bookmark Error:', err);
        res.status(500).json({ message: 'Failed to remove bookmark' });
    }
});

module.exports = router;
