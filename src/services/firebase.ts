import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const isValidConfig = (cfg: FirebaseConfig) =>
  !!cfg.apiKey && !!cfg.authDomain && !!cfg.projectId && !!cfg.appId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isValidConfig(firebaseConfig)) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as Required<FirebaseConfig>);
  }
  return app;
};

export const getAuthInstance = (): Auth | null => {
  if (!auth) {
    const a = getFirebaseApp();
    auth = a ? getAuth(a) : null;
  }
  return auth;
};

export const getDbInstance = (): Firestore | null => {
  if (!db) {
    const a = getFirebaseApp();
    db = a ? getFirestore(a) : null;
  }
  return db;
};

export const isFirebaseEnabled = (): boolean => !!getFirebaseApp();

export const getAnalyticsInstance = (): Analytics | null => {
  try {
    if (!analytics && typeof window !== 'undefined' && getFirebaseApp() && firebaseConfig.measurementId) {
      analytics = getAnalytics(getFirebaseApp() as FirebaseApp);
    }
    return analytics;
  } catch {
    return null;
  }
};

// Export convenient access to Firestore instance
export { getDbInstance as db };

// Also export for backward compatibility and direct access
export const firestoreDb = getDbInstance;
