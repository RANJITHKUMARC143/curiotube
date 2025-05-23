const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function checkConnection() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    console.log('Connecting to Firestore...');
    const db = getFirestore(app);
    
    // Try to access a collection (this will verify the connection)
    const videosRef = collection(db, 'videos');
    await getDocs(videosRef);
    
    console.log('✅ Successfully connected to Firestore!');
    return true;
  } catch (error) {
    console.error('❌ Error connecting to Firestore:', error.message);
    return false;
  }
}

// Run the connection check
checkConnection(); 