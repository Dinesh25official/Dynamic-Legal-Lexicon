const express = require('express');
const router = express.Router();
const lexiconController = require('./lexicon.controller');

/**
 * @route   GET /api/lexicon/search/term
 * @desc    SEARCH ENGINE 1: Enter a term name → get its description
 * @query   q (term name), page, limit
 * @example /api/lexicon/search/term?q=action
 */
router.get('/search/term', lexiconController.searchByTerm);

/**
 * @route   GET /api/lexicon/search/description
 * @desc    SEARCH ENGINE 2: Enter description keywords → get the matching term
 * @query   q (description text), page, limit
 * @example /api/lexicon/search/description?q=proceedings+instituted+in+court
 */
router.get('/search/description', lexiconController.searchByDescription);

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
