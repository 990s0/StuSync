import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateStudyQuestions(itinerary, subject) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Based on the following study itinerary for the subject "${subject}":\n"${itinerary}"\n\nGenerate 3 to 5 study questions that cover these topics to help a student study. Format the output as a clean, list of questions.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating study questions with Gemini:", error);
    return "Error generating questions. Please try again later.";
  }
}
