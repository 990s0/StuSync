// Test Gemini Script
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
console.log("Key Loaded:", API_KEY ? "Yes (hidden)" : "No");

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = "Reply with 'API is working!' briefly.";
    const result = await model.generateContent(prompt);
    console.log("Response:", result.response.text());
  } catch(e) {
    console.error("Gemini Error:", e);
  }
}

testGemini();
