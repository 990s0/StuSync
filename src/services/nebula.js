import axios from 'axios';

export const NEBULA_API_KEY = process.env.EXPO_PUBLIC_NEBULA_API_KEY;
const BASE_URL = 'https://api.utdnebula.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': NEBULA_API_KEY,
    'Accept': 'application/json'
  }
});

// Local cache to store courses by subject prefix to avoid repeated heavy API calls
const subjectCache = {};

// Fetch initial courses for dropdown (fallback/initial state)
export async function getCourses() {
  try {
    const response = await apiClient.get('/course', { params: { catalog_year: '25' } });
    if (!response.data || !response.data.data) return [];
    
    // Simple de-duplication
    const seen = new Set();
    const unique = response.data.data.filter(c => {
      if (seen.has(c.course_number)) return false;
      seen.add(c.course_number);
      return true;
    });

    return unique.map(course => ({
      label: `${course.subject_prefix} ${course.course_number}`,
      value: `${course.subject_prefix} ${course.course_number}`
    }));
  } catch (error) {
    console.error("Error fetching Nebula Courses:", error.response?.data || error.message);
    return [];
  }
}

// Fetch initial rooms for dropdown
export async function getRooms() {
  try {
    const response = await apiClient.get('/section');
    if (!response.data || !response.data.data) return [];
    
    const locations = response.data.data
      .flatMap(section => section.meetings.map(m => m.location))
      .filter(loc => loc && loc.building !== 'TBA' && loc.room !== 'TBA');
    
    const uniqueRooms = Array.from(new Set(locations.map(loc => `${loc.building} ${loc.room}`)));
    
    return uniqueRooms.map(roomString => ({
      label: roomString,
      value: roomString
    }));
  } catch (error) {
    console.error("Error fetching Nebula Rooms:", error.response?.data || error.message);
    return [];
  }
}

// Search active courses with pagination and caching
export async function searchCourses(query) {
  if (!query) return [];
  
  const parts = query.toUpperCase().trim().split(/\s+/);
  const subject = parts[0];
  const numberPart = parts.length > 1 ? parts[1] : '';

  // If we have at least 2 characters of a subject, try to fetch/cache it
  if (subject.length >= 2) {
    if (!subjectCache[subject]) {
      console.log(`Fetching full course list for subject: ${subject}`);
      try {
        let allCourses = [];
        // Fetch up to 3 pages (60 results) for this subject in the 2025 catalog
        // Nebula default is 20 per page
        const pages = [0, 20, 40]; 
        for (const offset of pages) {
          const res = await apiClient.get('/course', { 
            params: { subject_prefix: subject, catalog_year: '25', offset } 
          });
          if (res.data && res.data.data && res.data.data.length > 0) {
            allCourses = [...allCourses, ...res.data.data];
            if (res.data.data.length < 20) break; // Last page reached
          } else {
            break;
          }
        }

        // De-duplicate by course number
        const seen = new Set();
        const uniqueCourses = allCourses.filter(c => {
          if (seen.has(c.course_number)) return false;
          seen.add(c.course_number);
          return true;
        });

        // Store in cache
        subjectCache[subject] = uniqueCourses.map(course => ({
          label: `${course.subject_prefix} ${course.course_number} - ${course.title}`,
          value: `${course.subject_prefix} ${course.course_number}`,
          course_number: course.course_number
        }));
      } catch (e) {
        console.error(`Error caching subject ${subject}:`, e.message);
        return [];
      }
    }

    // Filter from cache based on the course number part
    const cached = subjectCache[subject];
    if (numberPart) {
      return cached.filter(c => c.course_number.startsWith(numberPart));
    }
    return cached;
  }

  // If only 1 char or empty, return default or empty
  return [];
}

// Search active physical rooms for autocomplete
export async function searchRooms(query) {
  if (!query) return [];

  try {
    const response = await apiClient.get('/section');
    if (!response.data || !response.data.data) return [];
    
    const locations = response.data.data
      .flatMap(section => section.meetings.map(m => m.location))
      .filter(loc => loc && loc.building !== 'TBA' && loc.room !== 'TBA');
    
    const uniqueRooms = Array.from(new Set(locations.map(loc => `${loc.building} ${loc.room}`)));
    
    const filteredRooms = uniqueRooms.filter(roomString => 
      roomString.toUpperCase().includes(query.toUpperCase())
    );

    return filteredRooms.map(roomString => ({
      label: roomString,
      value: roomString
    }));
  } catch (error) {
    console.error("Error searching Nebula Rooms:", error.message);
    return [];
  }
}


