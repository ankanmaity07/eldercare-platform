import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

let app: admin.app.App;

/** Initialize Firebase Admin SDK (singleton) */
export function initFirebase(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: env.FIREBASE_DATABASE_URL,
  });
  return app;
}

initFirebase();

export const db = getFirestore();
export const auth = getAuth();

// Enable Firestore offline persistence settings
db.settings({ ignoreUndefinedProperties: true });
