import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAUl-1iNJo7MjMgKk_vBaBKeDNEYVSxSDE",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "task-force-b1ff7.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "task-force-b1ff7",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "task-force-b1ff7.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1029709761200",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1029709761200:web:d051815003907ec7f14975"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
