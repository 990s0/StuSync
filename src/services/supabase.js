import axios from 'axios';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabaseClient = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

let sessionToken = null;
let currentUser = null;

export const getCurrentUser = () => currentUser;

const supabaseAuthClient = axios.create({
  baseURL: `${SUPABASE_URL}/auth/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Signs up a new user
 */
export async function signUp(email, password, username) {
  try {
    console.log("Supabase Auth: Signing up...", email);
    const response = await supabaseAuthClient.post('/signup', {
      email,
      password,
      data: { username } // Store username in user metadata
    });
    
    const user = response.data.user || response.data;
    if (user) {
      currentUser = user;
      sessionToken = response.data.access_token || response.data.session?.access_token;
      // Also save to a public profiles table for easier querying
      // We use the ID from the user object
      await saveProfile(user.id, email, username);
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Supabase Signup Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data?.msg || error.message };
  }
}

/**
 * Signs in an existing user
 */
export async function signIn(email, password) {
  try {
    console.log("Supabase Auth: Signing in...", email);
    const response = await supabaseAuthClient.post('/token?grant_type=password', {
      email,
      password
    });
    
    if (response.data.user) {
      currentUser = response.data.user;
      sessionToken = response.data.access_token;
    }
    
    return { success: true, session: response.data };
  } catch (error) {
    console.error("Supabase Signin Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data?.error_description || error.message };
  }
}

/**
 * Saves user profile data to the 'profiles' table
 */
export async function saveProfile(userId, email, username) {
  try {
    await supabaseClient.post('/profiles', {
      id: userId,
      email: email,
      username: username,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Supabase Profile Save Error:", error.response?.data || error.message);
    return { success: false };
  }
}

/**
 * Creates a new study session in Supabase
 */
export async function createSession(sessionData) {
  try {
    console.log("Supabase: Creating session...", sessionData);
    const response = await supabaseClient.post('/sessions', {
      title: sessionData.title || "Study Session",
      class: sessionData.class,
      building: sessionData.building,
      itinerary: sessionData.itinerary,
      host_name: sessionData.hostName || "Anonymous Student",
      host_major: sessionData.hostMajor || "Unknown Major",
      created_at: new Date().toISOString()
    });
    
    console.log("Supabase: Session created successfully");
    return { success: true, data: response.data[0] };
  } catch (error) {
    console.error("Supabase Create Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

/**
 * Fetches all active study sessions
 */
export async function getSessions() {
  try {
    console.log("Supabase: Fetching sessions...");
    const response = await supabaseClient.get('/sessions?select=*&order=created_at.desc');
    return response.data || [];
  } catch (error) {
    console.error("Supabase Fetch Error:", error.response?.data || error.message);
    return [];
  }
}
