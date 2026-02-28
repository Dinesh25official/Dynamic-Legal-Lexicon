const express = require('express');
const router = express.Router();
const { generateText } = require('../services/gemini.service');

// Temporary student check (replace with real JWT later)
const studentOnly = (req, res, next) => {
  // For now, allow all for testing
  // Later: check JWT role === 'student'
  next();
};

router.use(studentOnly);

// AI Chat
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    const prompt = `
    You are a knowledgeable and friendly law tutor for students and junior advocates.
    You have expertise in all areas of law including IPC, CPC, constitutional law, contracts, torts, and more.
    Answer any legal question the student asks clearly and in simple language.
    If relevant, mention related sections, acts, or key cases.
    Use bullet points where helpful.
    Do not restrict yourself to any single topic.
    Keep your response short and concise — maximum 5 to 6 bullet points or 3 to 4 lines. Do not over explain.

    Student question: ${message}

    Answer in simple, student-friendly language.
    `;

    const reply = await generateText(prompt);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;