import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { generateStudyQuestions } from '../services/groq';
import { getCourses, getRooms, searchCourses, searchRooms } from '../services/nebula';
import { createSession, getCurrentUser } from '../services/supabase';

export default function HostSessionScreen() {
  const navigation = useNavigation();
  const [room, setRoom] = useState('');
  const [subject, setSubject] = useState('');
  const [itinerary, setItinerary] = useState('');
  const sessionCreated = useRef(false); // Prevents duplicate submissions
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNebulaLoading, setIsNebulaLoading] = useState(true);
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Dropdown Picker specific states
  const [openRoom, setOpenRoom] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);

  React.useEffect(() => {
    async function loadNebulaData() {
      setIsNebulaLoading(true);
      try {
        const [roomsData, coursesData] = await Promise.all([
          getRooms(),
          getCourses()
        ]);
        setAvailableRooms(roomsData);
        setAvailableCourses(coursesData);
        // We don't want to auto-select if we want the user to search
      } catch (e) {
        console.error("Nebula Load Error:", e);
      } finally {
        setIsNebulaLoading(false);
      }
    }
    loadNebulaData();
  }, []);

  const handleSearchCourses = async (query) => {
    console.log("Searching courses for:", query);
    setIsRefreshing(true);
    try {
      if (!query || query.length === 0) {
        const initial = await getCourses();
        setAvailableCourses(initial);
      } else {
        const results = await searchCourses(query);
        console.log("Course results found:", results.length);
        setAvailableCourses(results);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchRooms = async (query) => {
    console.log("Searching rooms for:", query);
    setIsRefreshing(true);
    try {
      if (!query || query.length === 0) {
        const initial = await getRooms();
        setAvailableRooms(initial);
      } else {
        const results = await searchRooms(query);
        console.log("Room results found:", results.length);
        setAvailableRooms(results);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!itinerary || !subject) {
      Alert.alert("Missing Info", "Please enter both a subject and an itinerary to generate questions.");
      return;
    }

    setIsLoading(true);
    const questions = await generateStudyQuestions(itinerary, subject);
    setGeneratedQuestions(questions);
    setIsLoading(false);
  };

  const handleCreateSession = async () => {
    console.log("handleCreateSession called");

    // Prevent duplicate submissions
    if (sessionCreated.current || isLoading) return;

    console.log("Current State - Room:", room, "Subject:", subject);
    
    if (!room || !subject) {
      Alert.alert("Missing Info", "Room and Subject are required.");
      return;
    }

    sessionCreated.current = true; // Lock immediately
    setIsLoading(true);

    try {
      const user = await getCurrentUser();
      console.log("Attempting to save session to Supabase as user:", user?.id);
      
      const result = await createSession({
        title: itinerary ? (itinerary.length > 30 ? itinerary.substring(0, 30) + "..." : itinerary) : "Study Session",
        subject: subject,
        room: room,
        itinerary: itinerary,
        host_name: user?.user_metadata?.username || user?.email || "Student",
        host_major: "Student",
        host_id: user?.id
      });
      
      console.log("Supabase Create Result:", result);

      if (result.success) {
        const createdSession = result.data || { subject, room, itinerary, title: 'Study Session' };
        console.log("Session created:", createdSession);
        navigation.replace('Lobby', { session: createdSession, isHost: true });
      } else {
        // If failed, unlock so user can retry
        sessionCreated.current = false;
        console.error("Supabase Save Failed:", result.error);
        Alert.alert("Save Failed", result.error || "Could not save session.");
      }
    } catch (e) {
      sessionCreated.current = false;
      console.error("Session Creation Error:", e);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }} // Added to ensure buttons aren't cut off
        keyboardShouldPersistTaps="handled" 
        nestedScrollEnabled={true}
      >
        <Text style={styles.header}>Host a New Session</Text>
        
        {isNebulaLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading UTD Campus Data...</Text>
          </View>
        ) : (
          <View style={{ zIndex: 3000 }}>
            <View style={[styles.inputGroup, { zIndex: 4000 }]}>
              <Text style={styles.label}>1. Find a Room (Location)</Text>
              <DropDownPicker
                open={openRoom}
                value={room}
                items={availableRooms}
                setOpen={setOpenRoom}
                setValue={setRoom}
                setItems={setAvailableRooms}
                searchable={true}
                disableLocalSearch={true}
                loading={isRefreshing}
                onChangeSearchText={handleSearchRooms}
                searchPlaceholder="Type a building or room..."
                placeholder="Select a room"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                zIndex={4000}
                zIndexInverse={1000}
              />
            </View>

            <View style={[styles.inputGroup, { zIndex: 2000 }]}>
              <Text style={styles.label}>2. Class / Subject</Text>
              <DropDownPicker
                open={openSubject}
                value={subject}
                items={availableCourses}
                setOpen={setOpenSubject}
                setValue={setSubject}
                setItems={setAvailableCourses}
                searchable={true}
                disableLocalSearch={true}
                loading={isRefreshing}
                onChangeSearchText={handleSearchCourses}
                searchPlaceholder="Type a course name (e.g. CS 314)..."
                placeholder="Select a subject"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                zIndex={2000}
                zIndexInverse={2000}
              />
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>3. Study Itinerary</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter topics you plan to cover... (e.g. Trees, Graphs, Sorting algorithms)"
            value={itinerary}
            onChangeText={setItinerary}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity 
          style={styles.aiButton}
          onPress={handleGenerateQuestions}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.aiButtonText}>Generate Study Questions (Groq AI)</Text>
          )}
        </TouchableOpacity>

        {generatedQuestions ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>Generated Questions:</Text>
            <Text style={styles.resultsText}>{generatedQuestions}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={[styles.createButton, isLoading && { opacity: 0.7 }]}
          onPress={() => {
            if (isLoading) return;
            console.log("Create Button pressed!");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleCreateSession();
          }}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Confirm & Create Session</Text>
          )}
        </TouchableOpacity>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    minHeight: 50,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    maxHeight: 250, // Added to prevent it from dropping infinitely
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  aiButton: {
    backgroundColor: '#8B5CF6', // Purple for AI
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  aiButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: '#F3E8FF', // Light purple
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  resultsHeader: {
    fontWeight: 'bold',
    color: '#6B21A8',
    marginBottom: 5,
    fontSize: 16,
  },
  resultsText: {
    color: '#4C1D95',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#10B981', // Green for success
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 60, // Increased margin
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10, // Ensure it's above other elements
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  }
});
