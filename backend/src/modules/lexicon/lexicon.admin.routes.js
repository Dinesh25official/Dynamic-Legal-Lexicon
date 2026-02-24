const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const csvImporter = require('./csvImporter');

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
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
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
 * @route   POST /api/lexicon/admin/import-csv
 * @desc    Upload a CSV file with legal terms and import into database
 * @body    file (file) — CSV with "term" and "definition" columns
 */
router.post('/import-csv', (req, res, next) => {
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
                message: 'No CSV file uploaded. Please upload a file with field name "file".',
                hint: 'CSV must have "term" and "definition" columns.',
            });
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📥 CSV Upload received: ${req.file.originalname}`);
        console.log(`   Size: ${(req.file.size / 1024).toFixed(2)} KB`);
        console.log(`${'='.repeat(50)}\n`);

        // Run the CSV import pipeline
        const result = await csvImporter.importCSV(req.file.path);

        // Clean up uploaded file after processing
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to clean up uploaded file:', err);
        });

        const statusCode = result.success ? 200 : 422;
        return res.status(statusCode).json({
            success: result.success,
            message: result.message,
            data: {
                file: {
                    name: req.file.originalname,
                    size: `${(req.file.size / 1024).toFixed(2)} KB`,
                },
                totalParsed: result.totalParsed || 0,
                result: result.result || null,
                sampleTerms: result.sampleTerms || null,
            },
        });
    } catch (error) {
        console.error('CSV import error:', error);

        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while importing the CSV',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/lexicon/admin/import-text
 * @desc    Directly import a single term (useful for manual additions)
 * @body    { term: "...", definition: "..." }
 */
router.post('/import-text', async (req, res) => {
    try {
        const { term, definition } = req.body;

        if (!term || !definition) {
            return res.status(400).json({
                success: false,
                message: 'Both "term" and "definition" are required.',
            });
        }

        const result = await csvImporter.importTermsToDatabase([
            { term: term.trim(), description: definition.trim() },
        ]);

        return res.status(200).json({
            success: true,
            message: `Term "${term}" processed`,
            data: result,
        });
    } catch (error) {
        console.error('Import error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while importing the term',
            error: error.message,
        });
    }
});

module.exports = router;
