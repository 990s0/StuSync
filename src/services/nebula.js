import axios from 'axios';
console.log("Loading module");

export const NEBULA_API_KEY = process.env.EXPO_PUBLIC_NEBULA_API_KEY;
const BASE_URL = 'https://api.utdnebula.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': NEBULA_API_KEY,
    'Accept': 'application/json'
  }
});

// Search active courses by prefix or number
export async function searchCourses(query) {
  if (!query || query.length < 2) return [];
  
  try {
    // The Nebula API allows regex or partial matches depending on the endpoint. Since we want fast dropdowns, 
    // we fetch based on the query, filtering manually if needed, or passing query params if the API natively supports full-text search.
    // Assuming a simple fetch for the example (UTD Nebula supports ?course_number=... or ?subject_prefix=...)
    // We'll fetch a broad page and filter it down instantly for the UI.
    
    // Split the query to see if they typed "CS 314"
    const parts = query.toUpperCase().split(' ');
    let url = '/course?page_size=20';
    if(parts.length > 0 && parts[0].length >= 2) {
      url += `&subject_prefix=${parts[0]}`;
    }
    if(parts.length > 1) {
      url += `&course_number=${parts[1]}*`;
    }

    const response = await apiClient.get(url);
    
    if (!response.data.data) return [];
    
    // Sort and map into expected format for the new autocomplete dropdown
    return response.data.data.map(course => ({
      id: `${course.subject_prefix}-${course.course_number}`,
      title: `${course.subject_prefix} ${course.course_number} - ${course.title}`,
      value: `${course.subject_prefix} ${course.course_number}`
    }));
  } catch (error) {
    console.error("Error searching Nebula Courses:", error.message);
    return [];
  }
}
    console.error("Error fetching Nebula Courses:", error.response?.data || error.message);
    return [];
  }
}

// Search active physical rooms
export async function searchRooms(query) {
  if (!query || query.length < 2) return [];

  try {
    const parts = query.toUpperCase().split(' ');
    let url = '/section?page_size=30';
    
    const response = await apiClient.get(url);
    if (!response.data.data) return [];
    
    const locations = response.data.data
      .flatMap(section => section.meetings.map(m => m.location))
      .filter(loc => loc && loc.building !== 'TBA' && loc.room !== 'TBA');
    
    // Create a Set to remove duplicate rooms
    const uniqueRooms = Array.from(new Set(locations.map(loc => `${loc.building} ${loc.room}`)));
    
    // Filter locally based on what the user typed (e.g., "EC", "ECS 2")
    const filteredRooms = uniqueRooms.filter(roomString => 
      roomString.toUpperCase().includes(query.toUpperCase())
    );

    return filteredRooms.map((roomString, idx) => ({
      id: `room-${idx}`,
      title: roomString,
      value: roomString
    }));
  } catch (error) {
    console.error("Error searching Nebula Rooms:", error.message);
    return [];
  }
}
    console.error("Error fetching Nebula Rooms:", error.response?.data || error.message);
    return [];
  }
}
