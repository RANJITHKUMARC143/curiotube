import { initializeApp, getApps, FirebaseApp, FirebaseError } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator, Firestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';
import { EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_DATABASE_URL, EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, EXPO_PUBLIC_FIREBASE_APP_ID, EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID } from '@env';

console.log('Firebase config module starting...');

const USE_FIREBASE_EMULATOR = false;

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Debug log for configuration
console.log('Firebase Configuration Status:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  isDevelopment: __DEV__,
  platform: Platform.OS,
  usingEmulator: USE_FIREBASE_EMULATOR,
  envVars: {
    apiKey: EXPO_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
    authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'present' : 'missing',
    projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing',
    storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'present' : 'missing',
    messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'present' : 'missing',
    appId: EXPO_PUBLIC_FIREBASE_APP_ID ? 'present' : 'missing',
  }
});

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  console.log('Validating Firebase configuration...');
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket'] as const;
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing required Firebase configuration fields:', missingFields);
    throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
  }
  console.log('Firebase configuration validation passed');
};

// Initialize Firebase if it hasn't been initialized yet
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

try {
  console.log('Starting Firebase initialization...');
  validateFirebaseConfig();
  
  if (!getApps().length) {
    console.log('No existing Firebase apps found, initializing new app...');
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
    
    // Initialize Auth
    console.log('Initializing Auth...');
    auth = getAuth(app);
    console.log('Auth initialized successfully');
    
    // Initialize Firestore with settings for React Native
    console.log('Initializing Firestore...');
    firestore = initializeFirestore(app, {
      experimentalForceLongPolling: Platform.OS === 'android',
      localCache: memoryLocalCache()
    });
    console.log('Firestore initialized successfully');

    // Initialize Storage
    console.log('Initializing Storage...');
    storage = getStorage(app);
    console.log('Storage initialized successfully');

    // Log initialization status
    console.log('Firebase Instances Status:', {
      hasApp: !!app,
      hasAuth: !!auth,
      hasFirestore: !!firestore,
      hasStorage: !!storage,
      isInitialized: getApps().length > 0,
      platform: Platform.OS,
      isDevelopment: __DEV__,
      usingEmulator: USE_FIREBASE_EMULATOR
    });

    // Initialize Analytics only if supported
    isSupported().then(yes => {
      if (yes) {
        console.log('Initializing Analytics...');
        getAnalytics(app);
        console.log('Analytics initialized successfully');
      } else {
        console.log('Analytics not supported in this environment');
      }
    });
    
    // Connect to emulators only if explicitly enabled
    if (__DEV__ && USE_FIREBASE_EMULATOR) {
      console.log('Connecting to Firebase emulators...');
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('Emulators connected successfully');
    }
  } else {
    console.log('Firebase already initialized, getting existing instances...');
    app = getApps()[0];
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    console.log('Existing instances retrieved successfully');
  }
} catch (error: unknown) {
  console.error('Firebase initialization error:', error);
  if (error instanceof FirebaseError) {
    console.error('Firebase error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
  throw new Error('Firebase initialization failed with an unknown error');
}

// Export Firebase instances
export const firebaseApp = app;
export const authInstance = auth;
export const firestoreInstance = firestore;
export const storageInstance = storage;

// Helper function to wait for auth to be ready
const waitForAuth = async () => {
  console.log('Waiting for auth to be ready...');
  return new Promise<void>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', { isLoggedIn: !!user });
      unsubscribe();
      resolve();
    });
  });
};

export { waitForAuth }; 