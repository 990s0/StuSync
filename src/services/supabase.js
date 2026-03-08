import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Official Supabase client - handles schema cache, auth tokens, and retries automatically
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase SDK Initialized with URL:", SUPABASE_URL);

let currentUser = null;

export const getCurrentUser = () => currentUser;

/**
 * Signs up a new user using the official Supabase Auth SDK
 */
export async function signUp(email, password, username) {
  try {
    console.log("Supabase Auth: Signing up...", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });

    if (error) throw error;
    currentUser = data.user;
    return { success: true, data };
  } catch (error) {
    console.error("Supabase Signup Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Signs in an existing user using the official Supabase Auth SDK
 */
export async function signIn(email, password) {
  try {
    console.log("Supabase Auth: Signing in...", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    currentUser = data.user;
    return { success: true, session: data.session };
  } catch (error) {
    console.error("Supabase Signin Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new study session in Supabase using the official SDK
 */
export async function createSession(sessionData) {
  try {
    console.log("Supabase: Creating session...", sessionData);
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{
        title: sessionData.title || "Study Session",
        subject: sessionData.subject,
        room: sessionData.room,
        itinerary: sessionData.itinerary,
        host_name: sessionData.host_name || "Student",
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error("Supabase Create Session Error:", error);
      return { success: false, error: error.message };
    }

    console.log("Supabase: Session created successfully!", data);
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Supabase Create Session Exception:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all active study sessions using the official SDK
 */
export async function getSessions() {
  try {
    console.log("Supabase: Fetching sessions...");
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Fetch Sessions Error:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Supabase Fetch Sessions Exception:", error.message);
    return [];
  }
}

/**
 * Test the connection to the database
 */
export async function testConnection() {
  try {
    console.log("Supabase: Testing connection...");
    const { data, error } = await supabase
      .from('game_sessions')
      .select('id')
      .limit(1);

    if (error) {
      console.error("Supabase Connection Test Failed:", error.message);
      return { success: false, error: error.message };
    }
    console.log("Supabase Connection Successful!");
    return { success: true };
  } catch (error) {
    console.error("Supabase Connection Test Exception:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Saves generated quiz questions for a session
 */
export async function saveQuestions(sessionId, questions) {
  try {
    const rows = questions.map((q, i) => ({
      session_id: sessionId,
      question: q.question,
      choices: q.choices,
      correct: q.correct,
      order_index: i,
    }));
    const { data, error } = await supabase.from('questions').insert(rows).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('saveQuestions error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all questions for a session, ordered
 */
export async function getQuestions(sessionId) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('getQuestions error:', error.message);
    return [];
  }
}

/**
 * Saves a player's answer to a question
 */
export async function saveResponse(sessionId, questionId, userId, answerIndex, timeTaken) {
  try {
    const { error } = await supabase.from('responses').insert([{
      session_id: sessionId,
      question_id: questionId,
      user_id: userId,
      answer_index: answerIndex,
      time_taken: timeTaken,
    }]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('saveResponse error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Gets the leaderboard for a session
 */
export async function getLeaderboard(sessionId) {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('user_id, answer_index, time_taken, questions(correct)')
      .eq('session_id', sessionId);
    if (error) throw error;

    // Compute scores: 1000 pts for correct, bonus for speed
    const scores = {};
    (data || []).forEach(r => {
      const uid = r.user_id || 'Anonymous';
      const isCorrect = r.answer_index === r.questions?.correct;
      const bonus = isCorrect ? Math.max(0, 1000 - Math.floor(r.time_taken * 50)) : 0;
      scores[uid] = (scores[uid] || 0) + bonus;
    });

    return Object.entries(scores)
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('getLeaderboard error:', error.message);
    return [];
  }
}
