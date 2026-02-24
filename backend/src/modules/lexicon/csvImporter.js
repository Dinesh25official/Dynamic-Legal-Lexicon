const fs = require('fs');
const { parse } = require('csv-parse');
const db = require('../../config/db');

/**
 * Parse a CSV file and return an array of { term, definition } objects.
 * Supports CSV files with columns: term, definition
 */
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const records = [];

        const parser = parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true,
            relax_column_count: true,
        });

        parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
                // Normalize column names (case-insensitive)
                const normalized = {};
                for (const key in record) {
                    normalized[key.trim().toLowerCase()] = record[key];
                }

                const term = normalized['term'] || normalized['word'] || normalized['name'] || '';
                const definition = normalized['definition'] || normalized['description'] || normalized['meaning'] || '';

                if (term.trim() && definition.trim()) {
                    records.push({
                        term: term.trim(),
                        description: definition.trim(),
                    });
                }
            }
        });

        parser.on('error', (err) => {
            reject(err);
        });

        parser.on('end', () => {
            console.log(`📝 Parsed ${records.length} terms from CSV`);
            resolve(records);
        });

        fs.createReadStream(filePath).pipe(parser);
    });
};

/**
 * Import parsed terms into the database.
 * Checks if term exists first, then inserts or skips.
 */
const importTermsToDatabase = async (terms) => {
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const { term, description } of terms) {
        try {
            // Check if term already exists
            const existing = await db.query(
                'SELECT id FROM terms_law_table WHERE LOWER(term) = LOWER($1)',
                [term]
            );

            if (existing.rows.length > 0) {
                skipped++;
                continue;
            }

            // Insert new term
            await db.query(
                'INSERT INTO terms_law_table (term, description) VALUES ($1, $2)',
                [term, description]
            );
            imported++;
        } catch (err) {
            console.error(`Error importing term "${term}":`, err.message);
            errors.push({ term, error: err.message });
        }
    }

    console.log(`✅ CSV Import complete: ${imported} new, ${skipped} existing, ${errors.length} errors`);
    return { imported, skipped, errors };
};

/**
 * Full CSV import pipeline: file → parse → database
 */
const importCSV = async (filePath) => {
    console.log(`📄 Processing CSV: ${filePath}`);

    const terms = await parseCSV(filePath);

    if (terms.length === 0) {
        return {
            success: false,
            message: 'No terms found in the CSV file. Make sure it has "term" and "definition" columns.',
        };
    }

    const result = await importTermsToDatabase(terms);

    return {
        success: true,
        message: `Successfully processed ${terms.length} terms from CSV`,
        totalParsed: terms.length,
        result,
        sampleTerms: terms.slice(0, 5).map((t) => ({
            term: t.term,
            description: t.description.substring(0, 120) + (t.description.length > 120 ? '...' : ''),
        })),
    };
};

module.exports = {
    parseCSV,
    importTermsToDatabase,
    importCSV,
};
