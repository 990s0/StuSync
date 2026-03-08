import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function generateStudyQuestions(itinerary, subject) {
  if (!API_KEY) {
    console.error("Gemini Error: API key is missing. Ensure EXPO_PUBLIC_GEMINI_API_KEY is set in .env");
    return "Error: Gemini API key is missing.";
  }

  try {
    console.log(`Gemini REST Request: Subject="${subject}", Itinerary="${itinerary.substring(0, 50)}..."`);
    
    // Switched to gemini-2.0-flash-lite based on models list from the API.
    // Lite models have much higher quota availability on free tier accounts.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: `Based on the following study itinerary for the subject "${subject}":\n"${itinerary}"\n\nGenerate 3 to 5 study questions that cover these topics to help a student study. Format the output as a clean, list of questions.`
        }]
      }]
    };

    const response = await axios.post(url, payload);
    
    if (response.data && response.data.candidates && response.data.candidates[0].content) {
      const text = response.data.candidates[0].content.parts[0].text;
      console.log("Gemini REST Response received successfully");
      return text;
    } else {
      console.error("Unexpected Gemini REST Response format:", JSON.stringify(response.data));
      return "Error: Received unexpected response from Gemini.";
    }
  } catch (error) {
    const errorData = error.response?.data?.error || error;
    console.error("Gemini REST API Error:", JSON.stringify(errorData, null, 2));
    
    if (error.response?.status === 429) {
      return "Error: Gemini Quota Exceeded. The free tier for this model might be limited in your region. Please try again later.";
    }
    if (error.response?.status === 404) {
      return "Error: Gemini model not found on v1 endpoint. Your API key might be restricted to specific versions.";
    }
    
    return `Error generating questions: ${errorData.message || error.message || "Unknown error"}`;
  }
}

export async function generateQuizQuestions(itinerary, subject) {
  if (!API_KEY) return [];

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;
    const payload = {
      contents: [{
        parts: [{
          text: `You are generating a Kahoot-style quiz for the subject "${subject}" based on this study itinerary:\n"${itinerary}"\n\nGenerate exactly 5 multiple choice questions. Return ONLY a valid JSON array with no markdown or extra text. Use this exact format:\n[{"question": "...", "choices": ["A", "B", "C", "D"], "correct": 0}]\nWhere "correct" is the 0-based index of the correct choice.`
        }]
      }]
    };

    const response = await axios.post(url, payload);
    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleaned);
    console.log('Quiz questions generated:', questions.length);
    return questions;
  } catch (error) {
    console.error('Quiz generation error:', error.message);
    return [];
  }
}
