import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getMessaging } from 'firebase/messaging'; // Messaging might need special native setup

// Firebase configuration
// Since we don't have real credentials, we will provide a mock config
const firebaseConfig = {
  apiKey: "MOCK_API_KEY",
  authDomain: "stusync.mock.firebaseapp.com",
  projectId: "stusync-mock",
  storageBucket: "stusync-mock.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:mock123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const messaging = getMessaging(app);

export { app, db };
