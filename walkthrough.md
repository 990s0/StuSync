# StuSync App Walkthrough

## Overview

The **StuSync** mobile app has been built specifically for iOS and Android using React Native (Expo). It offers an intuitive platform for students to organize, host, and find study sessions natively on their devices.

## What Was Accomplished

1. **Expo and React Native Navigation Setup**:
   - Initialized the base React Native code utilizing Expo for cross-platform support.
   - Built a custom **Stack Navigator** in `App.js` covering standard routes: `Title` -> `Auth` -> `Home` -> `Profile | FindSessions | HostSession`.

2. **Backend Services & Configurations**:
   - Integrated **Firebase** context setup in `src/services/firebase.js` (ready to handle Firestore documents and Firebase Cloud Messaging).
   - Saved the sensitive user API key to a secure, git-ignored `.env` file to prevent accidental pushes.
   - Initialized `@google/generative-ai` securely inside `src/services/gemini.js` to process the Itinerary logic.

3. **Core Application Screens Built**:
   - **Title Screen**: A wireframe introductory view pushing towards Auth.
   - **Authentication**: A simulated (via mock Axios) secure school email check which directs you to your dashboard.
   - **Home Dashboard**: Offers distinct navigation cards built using native Lucide icons to View Profiles, Find Sessions, and Host Sessions.
   - **Profile Screen**: A detailed snapshot containing stats (Mock Grade Level, Major, Ratings, Points).
   - **Find Sessions Screen**: A list of active study sessions parsed from expected Firestore architecture. Integrated specific filters/sorts by Class, Building Location, and Host's Major.
   - **Host a Session (With AI)**: The ultimate study management view where a host declares a Room, a Subject, and an Itinerary, then presses "Generate Study Questions" mapped to your Gemini API to provide related feedback, all before finalizing the session broadcast via FCM.

## How to Run & Verify the App

To test this on your machine or directly on your phone:

1. Open your terminal and ensure you are in the application folder:
   ```bash
   cd /Users/aydahusby/HackAI 
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```
3. A QR Code will appear in the terminal.
   - **iOS**: Open the Camera app on your iPhone, point it at the QR code, and click the link to open it in the **Expo Go** app.
   - **Android**: Download **Expo Go** from the Google Play Store, open it, and scan the QR code.
   - **Simulator**: Alternatively, press `i` for the iOS simulator or `a` for the Android emulator inside the terminal.

### What To Test Manually:
- Follow the path from Login to Dashboard.
- Open **Find Sessions** and press the sorting 'Filter' options to sort the mock data based on distinct variables.
- Open **Host Session**, fill out an itinerary (e.g. *"Sorting in data structures"*), input a subject, and click **Generate Study Questions** to verify the Gemini AI integration correctly outputs functional, relevant questions using your supplied API key.
