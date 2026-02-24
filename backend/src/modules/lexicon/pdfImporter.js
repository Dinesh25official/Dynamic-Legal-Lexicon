const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const db = require('../../config/db');

// ============================================================
// 1. TEXT EXTRACTION
// ============================================================

/**
 * Extract text from a PDF file.
 * Tries pdf-parse first (for digital/text PDFs).
 * Falls back to Tesseract.js OCR if no text is found (scanned PDFs).
 */
const extractTextFromPDF = async (filePath) => {
    console.log(`📄 Reading PDF: ${filePath}`);

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const extractedText = pdfData.text.trim();

    if (extractedText.length > 100) {
        console.log(`✅ Digital PDF detected — extracted ${extractedText.length} characters`);
        return {
            text: extractedText,
            method: 'pdf-parse',
            pages: pdfData.numpages,
        };
    }

    console.log('🔍 Low text content — falling back to OCR (this may take a while)...');
    const ocrResult = await Tesseract.recognize(filePath, 'eng', {
        logger: (info) => {
            if (info.status === 'recognizing text') {
                console.log(`  OCR progress: ${Math.round(info.progress * 100)}%`);
            }
        },
    });

    console.log(`✅ OCR complete — extracted ${ocrResult.data.text.length} characters`);
    return {
        text: ocrResult.data.text,
        method: 'tesseract-ocr',
        pages: pdfData.numpages,
    };
};

// ============================================================
// 2. TERM PARSING
// ============================================================

/**
 * Parse raw text into structured { term, description } objects.
 * Supports multiple dictionary formats:
 *   - "Term — Description"
 *   - "Term – Description"
 *   - "Term - Description"
 *   - "Term: Description"
 *   - "ALL CAPS TERM\nDescription on next line"
 *   - "1. Term — Description"
 */
const parseTerms = (rawText) => {
    const terms = [];
    const lines = rawText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        let term = null;
        let description = null;

        // Pattern 1: "Term — Description" or "Term – Description"
        const emDashMatch = line.match(/^([A-Za-z][A-Za-z\s'.,-]{1,80})\s*[—–]\s*(.+)$/);
        if (emDashMatch) {
            term = emDashMatch[1].trim();
            description = emDashMatch[2].trim();
        }

        // Pattern 2: "Term: Description"
        if (!term) {
            const colonMatch = line.match(/^([A-Z][A-Za-z\s'.,-]{1,60}):\s+(.{20,})$/);
            if (colonMatch) {
                term = colonMatch[1].trim();
                description = colonMatch[2].trim();
            }
        }

        // Pattern 3: "Term - Description"
        if (!term) {
            const hyphenMatch = line.match(/^([A-Za-z][A-Za-z\s'.,-]{1,60})\s+-\s+(.{20,})$/);
            if (hyphenMatch) {
                term = hyphenMatch[1].trim();
                description = hyphenMatch[2].trim();
            }
        }

        // Pattern 4: ALL CAPS TERM on its own line, description on next line(s)
        if (!term) {
            const capsMatch = line.match(/^([A-Z][A-Z\s'.,-]{2,60})$/);
            if (capsMatch && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (nextLine.length > 20 && /^[A-Za-z]/.test(nextLine)) {
                    term = capsMatch[1].trim();
                    description = '';
                    i++;
                    while (i < lines.length && lines[i].length > 0 && !/^[A-Z][A-Z\s'.,-]{2,60}$/.test(lines[i])) {
                        description += (description ? ' ' : '') + lines[i];
                        i++;
                    }
                    description = description.trim();
                    if (term && description) {
                        terms.push({ term: formatTerm(term), description });
                    }
                    continue;
                }
            }
        }

        // Pattern 5: Numbered — "1. Term — Description"
        if (!term) {
            const numberedMatch = line.match(/^\d+[\.\)]\s+([A-Za-z][A-Za-z\s'.,-]{1,60})\s*[—–:\-]\s*(.{10,})$/);
            if (numberedMatch) {
                term = numberedMatch[1].trim();
                description = numberedMatch[2].trim();
            }
        }

        if (term && description) {
            // Collect continuation lines
            let j = i + 1;
            while (j < lines.length) {
                const nextLine = lines[j];
                if (
                    nextLine.match(/^[A-Z][A-Z\s'.,-]{2,60}$/) ||
                    nextLine.match(/^[A-Za-z][A-Za-z\s'.,-]{1,80}\s*[—–]\s*.+$/) ||
                    nextLine.match(/^[A-Z][A-Za-z\s'.,-]{1,60}:\s+.{20,}$/) ||
                    nextLine.match(/^\d+[\.\)]\s+[A-Za-z]/)
                ) {
                    break;
                }
                description += ' ' + nextLine;
                j++;
            }
            i = j;
            terms.push({ term: formatTerm(term), description: description.trim() });
        } else {
            i++;
        }
    }

    console.log(`📝 Parsed ${terms.length} terms from text`);
    return terms;
};

/**
 * Format term to Title Case if all caps
 */
const formatTerm = (term) => {
    if (term === term.toUpperCase()) {
        return term
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return term;
};

// ============================================================
// 3. DATABASE IMPORT
// ============================================================

/**
 * Bulk insert parsed terms into the database.
 * Uses ON CONFLICT to skip duplicates.
 */
const importTermsToDatabase = async (terms) => {
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const { term, description } of terms) {
        try {
            const result = await db.query(
                `INSERT INTO terms_law_table (term, description)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id`,
                [term, description]
            );

            if (result.rows.length > 0) {
                imported++;
            } else {
                skipped++;
            }
        } catch (err) {
            errors.push({ term, error: err.message });
        }
    }

    console.log(`✅ Import complete: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);
    return { imported, skipped, errors };
};

// ============================================================
// 4. FULL PIPELINE
// ============================================================

/**
 * Full import pipeline: PDF → text → parse → database
 */
const importPDF = async (filePath) => {
    const extraction = await extractTextFromPDF(filePath);
    const terms = parseTerms(extraction.text);

    if (terms.length === 0) {
        return {
            success: false,
            message: 'No legal terms could be parsed from the PDF. The format may not be recognized.',
            extraction: {
                method: extraction.method,
                pages: extraction.pages,
                textLength: extraction.text.length,
            },
            preview: extraction.text.substring(0, 500),
        };
    }

    const result = await importTermsToDatabase(terms);

    return {
        success: true,
        message: 'Successfully processed PDF',
        extraction: {
            method: extraction.method,
            pages: extraction.pages,
            textLength: extraction.text.length,
        },
        result,
        sampleTerms: terms.slice(0, 5).map((t) => ({
            term: t.term,
            description: t.description.substring(0, 100) + '...',
        })),
    };
};

module.exports = {
    extractTextFromPDF,
    parseTerms,
    importTermsToDatabase,
    importPDF,
};
