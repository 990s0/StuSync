import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

function buildFallbackStudyQuestions(itinerary, subject) {
  const topics = (itinerary || '')
    .split(/[,;\n]/)
    .map(t => t.trim())
    .filter(Boolean);
  const displaySubject = subject || 'this class';

  const basePrompt = topics.length
    ? `Based on the study plan for ${displaySubject} covering topics like ${topics.slice(0, 3).join(', ')}`
    : `Based on the study plan for ${displaySubject}`;

  const qs = [
    `${basePrompt}, what are the key concepts a student should review first?`,
    `For ${displaySubject}, create a practice question that checks understanding of one core idea from the plan.`,
    `Ask a question that helps connect two related topics from the study plan for ${displaySubject}.`,
    `Write a question that would test a student's ability to apply one of the topics in a real-world scenario.`,
    `Create a question that encourages the student to summarize one of the major topics in their own words.`,
  ];

  return qs.map((q, idx) => `${idx + 1}. ${q}`).join('\n');
}

function buildFallbackQuiz(itinerary, subject) {
  const topics = (itinerary || '')
    .split(/[,;\n]/)
    .map(t => t.trim())
    .filter(Boolean);
  const displaySubject = subject || 'this class';
  const mainTopic = topics[0] || displaySubject;

  return [
    {
      question: `Which of the following is most directly related to ${mainTopic}?`,
      choices: [
        mainTopic,
        'Photosynthesis',
        'The French Revolution',
        'Plate tectonics',
      ],
      correct: 0,
    },
    {
      question: `What is a good reason to review ${mainTopic} before an exam in ${displaySubject}?`,
      choices: [
        `It is a core idea for understanding other topics in ${displaySubject}.`,
        'It will always be the easiest question on the exam.',
        'It is not important for this course.',
        'It only appears in optional readings.',
      ],
      correct: 0,
    },
    {
      question: `Which study strategy best helps you remember concepts from ${mainTopic}?`,
      choices: [
        'Explaining the concept to a friend in your own words.',
        'Re-reading the syllabus once.',
        'Ignoring mistakes on practice problems.',
        'Studying only the night before.',
      ],
      correct: 0,
    },
    {
      question: `When working on problems about ${mainTopic}, what should you focus on first?`,
      choices: [
        'Understanding the definitions and assumptions involved.',
        'Memorizing random trivia.',
        'Skipping all examples.',
        'Avoiding practice questions.',
      ],
      correct: 0,
    },
    {
      question: `How could you check whether you truly understand ${mainTopic}?`,
      choices: [
        'By solving new practice problems without looking at the solution.',
        'By glancing at notes once.',
        'By only watching a video at double speed.',
        'By hoping it is not on the exam.',
      ],
      correct: 0,
    },
  ];
}

export async function generateStudyQuestions(itinerary, subject) {
  if (!API_KEY) {
    console.warn("Groq API key missing. Using local fallback study questions.");
    return buildFallbackStudyQuestions(itinerary, subject);
  }

  try {
    console.log(`Groq Request: Subject="${subject}", Itinerary="${itinerary.substring(0, 50)}..."`);
    
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const payload = {
      model: 'llama-3.1-70b-versatile',
      messages: [{
        role: 'user',
        content: `Based on the following study itinerary for the subject "${subject}":\n"${itinerary}"\n\nGenerate 3 to 5 study questions that cover these topics to help a student study. Format the output as a clean list of questions.`
      }],
      temperature: 0.7,
      max_tokens: 1024
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.choices && response.data.choices[0].message) {
      const text = response.data.choices[0].message.content;
      console.log("Groq Response received successfully");
      return text;
    } else {
      console.error("Unexpected Groq Response format:", JSON.stringify(response.data));
      return buildFallbackStudyQuestions(itinerary, subject);
    }
  } catch (error) {
    const errorData = error.response?.data?.error || error;
    console.error("Groq API Error:", JSON.stringify(errorData, null, 2));
    
    if (error.response?.status === 429) {
      console.warn("Groq quota exceeded. Falling back to local study questions.");
      return buildFallbackStudyQuestions(itinerary, subject);
    }
    
    return buildFallbackStudyQuestions(itinerary, subject);
  }
}

export async function generateQuizQuestions(itinerary, subject) {
  if (!API_KEY) {
    console.warn('Groq API key missing. Using local fallback quiz questions.');
    return buildFallbackQuiz(itinerary, subject);
  }

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const payload = {
      model: 'llama-3.1-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are generating a Kahoot-style quiz for the subject "${subject}" based on this study itinerary:\n"${itinerary}"\n\nGenerate exactly 5 multiple choice questions. Return ONLY a valid JSON array with no markdown or extra text. Use this exact format:\n[{"question": "...", "choices": ["A", "B", "C", "D"], "correct": 0}]\nWhere "correct" is the 0-based index of the correct choice.`
      }],
      temperature: 0.7,
      max_tokens: 2048
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const raw = response.data?.choices?.[0]?.message?.content || '[]';
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleaned);
    console.log('Quiz questions generated:', questions.length);
    return questions;
  } catch (error) {
    console.error('Quiz generation error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    console.error('Quiz generation error, using fallback questions:', error.message);
    return buildFallbackQuiz(itinerary, subject);
  }
}
