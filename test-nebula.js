require('dotenv').config();
const axios = require('axios');

const NEBULA_API_KEY = process.env.EXPO_PUBLIC_NEBULA_API_KEY;
console.log("Nebula Key Loaded:", NEBULA_API_KEY ? "Yes (hidden)" : "No");

async function testNebula() {
  try {
    console.log("Fetching Courses...");
    let courses = [];
    for(let i=1; i<=3; i++) {
        const courseRes = await axios.get(`https://api.utdnebula.com/course?page_number=${i}`, {
          headers: { 'x-api-key': NEBULA_API_KEY, 'Accept': 'application/json' }
        });
        if(courseRes.data.data) courses = [...courses, ...courseRes.data.data];
    }
    console.log("Found Courses count:", courses.length);
    if(courses.length > 0) {
        console.log("Sample Course:", courses[0].subject_prefix, courses[0].course_number);
    }

    console.log("\nFetching Sections for Rooms...");
    const sectionRes = await axios.get('https://api.utdnebula.com/section', {
      headers: { 'x-api-key': NEBULA_API_KEY, 'Accept': 'application/json' }
    });
    console.log("Found Sections count:", sectionRes.data.data ? sectionRes.data.data.length : 0);
    if(sectionRes.data.data && sectionRes.data.data.length > 0) {
        const meeting = sectionRes.data.data[0].meetings[0];
        console.log("Sample Location from Section:", meeting ? meeting.location : "No location");
    }
  } catch(e) {
    console.error("Nebula API Error:", e.response?.data || e.message);
  }
}

testNebula();
