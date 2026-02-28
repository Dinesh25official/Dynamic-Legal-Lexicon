const express = require('express');
const lexiconRoutes = require('./lexicon.routes');
const lexiconAdminRoutes = require('./lexicon.admin.routes');
const bookmarkRoutes = require('./bookmark.routes');

const router = express.Router();

// Mount public routes
router.use('/', lexiconRoutes);
router.use('/bookmarks', bookmarkRoutes);

module.exports = {
    router,
    adminRouter: lexiconAdminRoutes
};
