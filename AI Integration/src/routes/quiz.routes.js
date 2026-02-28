const express = require('express');
const router = express.Router();
const { generateText } = require('../services/gemini.service');

// Helper to shuffle array randomly
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Random legal terms pool
async function getTermContext(termId) {
    const terms = [
        `Term: Theft
Definition: Taking someone's movable property without consent and with dishonest intention. (IPC Section 378)
Key Case: State of Maharashtra v. Wasudeo Ramchandra Kaidalwar (1981) - Intention is important.`,
        `Term: Murder
Definition: Causing death of a person with intention or knowledge that the act is likely to cause death. (IPC Section 300)
Key Case: Bachan Singh v. State of Punjab (1980) - Death penalty guidelines established.`,
        `Term: Assault
Definition: Making any gesture or preparation to use criminal force on another person causing apprehension. (IPC Section 351)`,
        `Term: Fraud
Definition: Intentional deception made for personal gain or to damage another individual. (IPC Section 420)`,
        `Term: Negligence
Definition: Failure to take proper care in doing something, resulting in damage or injury to another. (Tort Law)`,
        `Term: Defamation
Definition: Making a false statement that injures the reputation of another person. (IPC Section 499)`,
        `Term: Bail
Definition: Temporary release of an accused person awaiting trial, sometimes on condition that a sum of money is lodged to guarantee their appearance in court.`,
        `Term: Contract
Definition: A legally binding agreement between two or more parties that is enforceable by law. Requires offer, acceptance, and consideration.`,
        `Term: Tort
Definition: A civil wrong that causes someone to suffer loss or harm, resulting in legal liability for the person who commits the act.`,
        `Term: Habeas Corpus
Definition: A legal action requiring a person under arrest to be brought before a judge. Protects against unlawful imprisonment.`,
    ];

    const random = terms[Math.floor(Math.random() * terms.length)];
    return random;
}

// Generate quiz
router.post('/generate', async (req, res) => {
    const { termId } = req.body;
    if (!termId) return res.status(400).json({ error: 'termId is required' });

    try {
        const context = await getTermContext(termId);

        const prompt = `
You are a legal quiz generator. Based on the legal term information below, generate exactly 4 multiple choice questions to test a student's understanding.

${context}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Make questions varied and educational
- Shuffle the position of the correct answer randomly
- Return ONLY valid JSON, no extra text, no markdown, no backticks

Return this exact JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct option text here"
    }
  ]
}
`;

        const raw = await generateText(prompt);

        // Clean response - remove markdown backticks if any
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Shuffle options for each question randomly
        parsed.questions = parsed.questions.map(q => {
            const shuffled = shuffle([...q.options]);
            return { ...q, options: shuffled };
        });

        // Shuffle question order too
        parsed.questions = shuffle(parsed.questions);

        res.json(parsed);

    } catch (err) {
        console.error('Quiz generation error:', err.message);
        res.status(500).json({ error: 'Failed to generate quiz: ' + err.message });
    }
});

module.exports = router;