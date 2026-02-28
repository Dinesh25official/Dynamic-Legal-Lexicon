const express = require('express');
const router = express.Router();
const { generateText } = require('../services/gemini.service');

// Fake data for now (we will connect real DB later)
async function getTermContext(termId) {
  return `Term: Theft
Official Definition: Taking someone's property without permission with dishonest intention (IPC 378)
Simplified: Stealing movable property dishonestly.`;
}

router.post('/generate', async (req, res) => {
  const { termId } = req.body;

  if (!termId) {
    return res.status(400).json({ error: "termId is required" });
  }

  try {
    const context = await getTermContext(termId);

    const prompt = `
Create exactly 4 easy MCQ questions on this legal term for law students.
Use ONLY this information:

${context}

Return ONLY a valid JSON array like this (nothing else):

[
  {
    "question": "Question here?",
    "options": ["A. Option1", "B. Option2", "C. Option3", "D. Option4"],
    "correct": "B",
    "explanation": "Short explanation"
  }
]
`;

    const raw = await generateText(prompt);
    const questions = JSON.parse(raw);

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

module.exports = router;