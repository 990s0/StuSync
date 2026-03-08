require('dotenv').config();
const axios = require('axios');

const NEBULA_API_KEY = process.env.EXPO_PUBLIC_NEBULA_API_KEY;

async function testSearch(query) {
  console.log(`\nSearching for: "${query}"`);
  try {
    const parts = query.toUpperCase().trim().split(' ');
    let url = 'https://api.utdnebula.com/course?page_size=5';
    
    if (parts.length > 0 && parts[0].length >= 2) {
      url += `&subject_prefix=${parts[0]}`;
    }
    if (parts.length > 1) {
      url += `&course_number=${parts[1]}`;
    }

    console.log(`URL: ${url}`);
    const response = await axios.get(url, {
      headers: { 'x-api-key': NEBULA_API_KEY, 'Accept': 'application/json' }
    });
    
    if (!response.data.data) {
      console.log("No data found.");
      return;
    }
    
    response.data.data.forEach(course => {
      console.log(`- ${course.subject_prefix} ${course.course_number}: ${course.title}`);
    });
  } catch (error) {
    console.error("Search Error:", error.response?.data || error.message);
  }
}

async function runTests() {
  await testSearch("CS");
  await testSearch("CS 33");
  await testSearch("MATH 24");
}

runTests();
