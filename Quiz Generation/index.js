require('dotenv').config();
const express = require('express');
const cors = require('cors');
const quizRoutes = require('./src/routes/quiz.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/quiz', quizRoutes);

app.get('/', (req, res) => {
  res.send('Quiz Generation Backend is Running ✅');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Quiz Server running on http://localhost:${PORT}`);
});