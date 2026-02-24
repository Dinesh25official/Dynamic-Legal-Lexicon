const express = require('express');
const router = express.Router();
const lexiconController = require('./lexicon.controller');

/**
 * @route   GET /api/lexicon/search
 * @desc    Search legal terms by keyword with optional context filter
 * @query   q, context, page, limit
 */
router.get('/search', lexiconController.search);

/**
 * @route   GET /api/lexicon/term-of-the-day
 * @desc    Get today's featured legal term
 * @note    Must be BEFORE /term/:id to avoid route conflicts
 */
router.get('/term-of-the-day', lexiconController.getTermOfTheDay);

/**
 * @route   GET /api/lexicon/term/:id
 * @desc    Get full term detail by ID (contexts, cases, statutes)
 */
router.get('/term/:id', lexiconController.getTermById);

module.exports = router;
