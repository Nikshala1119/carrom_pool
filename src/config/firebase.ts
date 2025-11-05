import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBN13ShMnZLyxfx3lUyoDR0ysM3-6zcnAI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "carrompool-94dfd.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://carrompool-94dfd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "carrompool-94dfd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "carrompool-94dfd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "457222025271",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:457222025271:web:aad2bf220c1fdba8210fb2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-38RBJ7K7X8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
