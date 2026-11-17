import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase Web Client SDK Configuration.
 * Values are provided via Vite environment variables (VITE_FIREBASE_*).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-firebase-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'eldercare-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'eldercare-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'eldercare-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const firebaseApp: FirebaseApp = app;
export const firebaseAuth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
