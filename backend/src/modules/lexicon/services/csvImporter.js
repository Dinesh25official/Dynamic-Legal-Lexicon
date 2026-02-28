const fs = require('fs');
const { parse } = require('csv-parse');
const db = require('../../../config/db');

/**
 * Parse a CSV file with columns:
 * "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition"
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
                // Normalize column names (case-insensitive, trim)
                const normalized = {};
                for (const key in record) {
                    normalized[key.trim().toLowerCase()] = record[key];
                }

                // Match various possible column name formats
                const term =
                    normalized['legal term'] ||
                    normalized['legal_term'] ||
                    normalized['term'] ||
                    normalized['word'] ||
                    '';

                const oxford =
                    normalized['fixed (oxford) definition'] ||
                    normalized['fixed(oxford) definition'] ||
                    normalized['oxford_definition'] ||
                    normalized['oxford definition'] ||
                    normalized['fixed definition'] ||
                    normalized['definition'] ||
                    '';

                const simplified =
                    normalized['simplified definition'] ||
                    normalized['simplified_definition'] ||
                    normalized['simple definition'] ||
                    normalized['simple'] ||
                    normalized['meaning'] ||
                    '';

                if (term.trim()) {
                    records.push({
                        term: term.trim(),
                        oxford_definition: oxford.trim() || 'N/A',
                        simplified_definition: simplified.trim() || 'N/A',
                    });
                }
            }
        });

        parser.on('error', (err) => reject(err));

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

    for (const { term, oxford_definition, simplified_definition } of terms) {
        try {
            const existing = await db.query(
                `SELECT "Legal Term" FROM legal_terms WHERE LOWER("Legal Term") = LOWER($1)`,
                [term]
            );

            if (existing.rows.length > 0) {
                skipped++;
                continue;
            }

            await db.query(
                `INSERT INTO legal_terms ("Legal Term", "Fixed (Oxford) Definition", "Simplified Definition") VALUES ($1, $2, $3)`,
                [term, oxford_definition, simplified_definition]
            );
            imported++;
        } catch (err) {
            console.error(`Error importing "${term}":`, err.message);
            errors.push({ term, error: err.message });
        }
    }

    console.log(`✅ Import: ${imported} new, ${skipped} existing, ${errors.length} errors`);
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
            message: 'No terms found. CSV needs "Legal Term", "Fixed (Oxford) Definition", "Simplified Definition" columns.',
        };
    }

    const result = await importTermsToDatabase(terms);

    return {
        success: true,
        message: `Processed ${terms.length} terms`,
        totalParsed: terms.length,
        result,
        sampleTerms: terms.slice(0, 5).map((t) => ({
            term: t.term,
            oxford: t.oxford_definition.substring(0, 80) + (t.oxford_definition.length > 80 ? '...' : ''),
            simplified: t.simplified_definition.substring(0, 80) + (t.simplified_definition.length > 80 ? '...' : ''),
        })),
    };
};

module.exports = { parseCSV, importTermsToDatabase, importCSV };
