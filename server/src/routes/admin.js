const express = require('express');
const router = express.Router();
const authorize = require('../middleware/roleAuth');

/**
 * @api {get} /admin/advocate/dashboard Protected Route for Advocates
 */
router.get('/advocate/dashboard', authorize('advocate'), (req, res) => {
    res.json({
        message: "Welcome Advocate! You have access to legal mappings.",
        user: req.user
    });
});

/**
 * @api {delete} /admin/admin/delete-term Protected Route for Admins Only
 */
router.delete('/delete-term', authorize('admin'), (req, res) => {
    res.json({
        message: "Term deleted. Admin privileges confirmed.",
        admin_id: req.user.id
    });
});

module.exports = router;
