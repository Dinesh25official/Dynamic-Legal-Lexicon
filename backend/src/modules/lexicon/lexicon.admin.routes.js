const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const csvImporter = require('./services/csvImporter');
const lexiconModel = require('./models/lexicon.model');
const statutoryModel = require('./models/statutory.model');
const dailyTermModel = require('./models/dailyTerm.model');
const { authorize } = require('../../middleware/auth');

// ========================
// All admin routes require admin role
// ========================
router.use(authorize(['admin']));

// ========================
// Multer Configuration
// ========================
const uploadsDir = path.join(__dirname, '../../../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/csv',
            'text/plain',
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    },
});

// ========================
// Routes
// ========================

/**
 * GET /api/admin/lexicon
 * List all terms (paginated) for admin table
 */
router.get('/lexicon', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await lexiconModel.getAllTerms(page, limit);

        // Map for frontend
        result.terms = result.terms.map(t => ({
            id: t["Legal Term"], // Alias for frontend compatibility
            term: t["Legal Term"],
            oxford_definition: t["Fixed (Oxford) Definition"],
            simplified_definition: t["Simplified Definition"]
        }));

        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Admin list terms error:', error);
        res.status(500).json({ success: false, message: 'Failed to list terms' });
    }
});

/**
 * PUT /api/admin/lexicon/:id
 * Update a term (id is the term name)
 */
router.put('/lexicon/:id', async (req, res) => {
    try {
        const { term, oxford_definition, simplified_definition } = req.body;

        if (!term && !oxford_definition && !simplified_definition) {
            return res.status(400).json({ success: false, message: 'At least one field is required' });
        }

        const updatedRaw = await lexiconModel.updateTerm(req.params.id, {
            term,
            fixed_definition: oxford_definition,
            simplified_definition,
        });

        if (!updatedRaw) {
            return res.status(404).json({ success: false, message: 'Term not found' });
        }

        const updated = {
            id: updatedRaw["Legal Term"],
            term: updatedRaw["Legal Term"],
            oxford_definition: updatedRaw["Fixed (Oxford) Definition"],
            simplified_definition: updatedRaw["Simplified Definition"]
        };

        res.json({ success: true, message: 'Term updated', term: updated });
    } catch (error) {
        console.error('Admin update term error:', error);
        res.status(500).json({ success: false, message: 'Failed to update term' });
    }
});

/**
 * DELETE /api/admin/lexicon/:id
 * Delete a term (id is the term name)
 */
router.delete('/lexicon/:id', async (req, res) => {
    try {
        const deletedRaw = await lexiconModel.deleteTerm(req.params.id);

        if (!deletedRaw) {
            return res.status(404).json({ success: false, message: 'Term not found' });
        }

        res.json({ success: true, message: `Term "${deletedRaw["Legal Term"]}" deleted` });
    } catch (error) {
        console.error('Admin delete term error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete term' });
    }
});

/**
 * POST /api/admin/lexicon/import-csv
 * Upload CSV and import terms
 */
router.post('/lexicon/import-csv', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error',
                hint: 'Make sure the field name is "file" and the file is a CSV.',
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No CSV file uploaded.',
            });
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📥 CSV Upload received: ${req.file.originalname}`);
        console.log(`${'='.repeat(50)}\n`);

        const result = await csvImporter.importCSV(req.file.path);

        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to clean up:', err);
        });

        res.status(result.success ? 200 : 422).json({
            success: result.success,
            message: result.message,
            data: {
                file: { name: req.file.originalname },
                totalParsed: result.totalParsed || 0,
                result: result.result || null,
            },
        });
    } catch (error) {
        console.error('CSV import error:', error);
        if (req.file) fs.unlink(req.file.path, () => { });
        res.status(500).json({ success: false, message: 'CSV import failed' });
    }
});

/**
 * POST /api/admin/lexicon/import-text
 * Add a single term manually
 */
router.post('/lexicon/import-text', async (req, res) => {
    try {
        const { term, oxford_definition, simplified_definition } = req.body;

        if (!term || !oxford_definition || !simplified_definition) {
            return res.status(400).json({ success: false, message: '"term", "oxford_definition", and "simplified_definition" are required.' });
        }

        const result = await csvImporter.importTermsToDatabase([
            { term: term.trim(), oxford_definition: oxford_definition.trim(), simplified_definition: simplified_definition.trim() },
        ]);

        res.json({ success: true, message: `Term "${term}" added`, data: result });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, message: 'Failed to add term' });
    }
});

/**
 * GET /api/admin/statutory
 * List all statutory references (paginated)
 */
router.get('/statutory', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await statutoryModel.getStatutoryList(page, limit);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Admin list statutes error:', error);
        res.status(500).json({ success: false, message: 'Failed to list statutes' });
    }
});

/**
 * PUT /api/admin/statutory/:ctid
 * Update a statutory reference
 */
router.put('/statutory/:ctid', async (req, res) => {
    try {
        const result = await statutoryModel.updateStatutory(req.params.ctid, req.body);
        if (!result) return res.status(404).json({ success: false, message: 'Statutory reference not found' });
        res.json({ success: true, message: 'Statutory reference updated', data: result });
    } catch (error) {
        console.error('Admin update statute error:', error);
        res.status(500).json({ success: false, message: 'Failed to update statute' });
    }
});

/**
 * DELETE /api/admin/statutory/:ctid
 * Delete a statutory reference
 */
router.delete('/statutory/:ctid', async (req, res) => {
    try {
        const result = await statutoryModel.deleteStatutory(req.params.ctid);
        if (!result) return res.status(404).json({ success: false, message: 'Statutory reference not found' });
        res.json({ success: true, message: 'Statutory reference deleted' });
    } catch (error) {
        console.error('Admin delete statute error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete statute' });
    }
});

/**
 * GET /api/admin/daily-pool
 * List all terms in the daily pool
 */
router.get('/daily-pool', async (req, res) => {
    try {
        const result = await dailyTermModel.getAllDailyTerms();
        res.json({ success: true, pool: result });
    } catch (error) {
        console.error('Admin list pool error:', error);
        res.status(500).json({ success: false, message: 'Failed to list daily pool' });
    }
});

/**
 * POST /api/admin/daily-pool
 * Add term to daily pool
 */
router.post('/daily-pool', async (req, res) => {
    try {
        const { term, oxford_definition, simplified_definition } = req.body;
        const result = await dailyTermModel.addToDailyPool(term, oxford_definition, simplified_definition);
        res.json({ success: true, message: `"${term}" added to pool`, data: result });
    } catch (error) {
        console.error('Admin add pool error:', error);
        res.status(500).json({ success: false, message: 'Failed to add to pool' });
    }
});

/**
 * DELETE /api/admin/daily-pool/:term
 * Remove term from daily pool
 */
router.delete('/daily-pool/:term', async (req, res) => {
    try {
        const result = await dailyTermModel.removeFromDailyPool(req.params.term);
        res.json({ success: true, message: `Term removed from pool` });
    } catch (error) {
        console.error('Admin delete pool error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove from pool' });
    }
});

/**
 * POST /api/admin/daily-pool/set-active/:term
 * Manually set a term as active
 */
router.post('/daily-pool/set-active/:term', async (req, res) => {
    try {
        const result = await dailyTermModel.setActiveTerm(req.params.term);
        res.json({ success: true, message: `"${req.params.term}" is now active`, data: result });
    } catch (error) {
        console.error('Admin set active error:', error);
        res.status(500).json({ success: false, message: 'Failed to set active term' });
    }
});

/**
 * POST /api/admin/lexicon/daily-term
 * Set the legal term of the day (Legacy)
 */
router.post('/daily-term', async (req, res) => {
    try {
        const { term } = req.body;
        if (!term) return res.status(400).json({ success: false, message: 'Term is required' });

        const result = await dailyTermModel.setActiveTerm(term);
        res.json({ success: true, message: `"${term}" set as Term of the Day`, data: result });
    } catch (error) {
        console.error('Set daily term error:', error);
        res.status(500).json({ success: false, message: 'Failed to set daily term' });
    }
});

/**
 * POST /api/admin/lexicon/statutory
 * Add a statutory reference to a term
 */
router.post('/statutory', async (req, res) => {
    try {
        const { term, statute_name, section, description, url } = req.body;
        if (!term || !statute_name) {
            return res.status(400).json({ success: false, message: 'Term and Statute Name are required' });
        }

        const result = await statutoryModel.addStatutory({ term, statute_name, section, description, url });
        res.json({ success: true, message: 'Statutory reference added', data: result });
    } catch (error) {
        console.error('Add statutory error:', error);
        res.status(500).json({ success: false, message: 'Failed to add statutory reference' });
    }
});

module.exports = router;
