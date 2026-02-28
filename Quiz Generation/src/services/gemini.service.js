require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateText(prompt) {
  const response = await genAI.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return response.text;
}

module.exports = { generateText };