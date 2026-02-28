require('dotenv').config();

const express = require('express');
const cors = require('cors');
const aiRoutes = require('./src/routes/ai.routes');
const quizRoutes = require('./src/routes/quiz.routes');
const app = express();

// Enable CORS for frontend (React/Vite – adjust if frontend port is different)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Mount AI routes (only chat in current version)
app.use('/api', aiRoutes);
app.use('/api/quiz', quizRoutes);
// Simple root test route
app.get('/', (req, res) => {
  res.send('Dynamic Legal Lexicon AI Module is running on port 5001! 🚀');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Changed to port 5001
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});