import { authInstance, firestoreInstance } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail as firebaseSendPasswordResetEmail, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { User } from '../types/index';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Helper function to wait for auth state to be ready
const waitForAuth = async () => {
  return new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      unsubscribe();
      resolve();
    });
  });
};

export const isAuthenticated = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
};

export const getStoredUser = async (): Promise<User | null> => {
  const user = authInstance.currentUser;
  if (!user) return null;

  const userDoc = await getDoc(doc(firestoreInstance, 'users', user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    const userData: User = {
      _id: user.uid,
      name: data.name || '',
      email: data.email || '',
      profilePic: data.profilePic || '',
      followers: data.followers || 0,
      following: data.following || 0,
      videos: data.videos || 0,
      earnings: data.earnings || 0,
      challenges: data.challenges || 0,
      interests: data.interests || [],
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now()
    };
    return userData;
  }
  return null;
};

export const registerUser = async (email: string, password: string, name: string) => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return { 
        success: false, 
        error: {
          message: 'Invalid email format',
          code: 'auth/invalid-email'
        }
      };
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      console.error('Invalid name:', name);
      return { 
        success: false, 
        error: {
          message: 'Name is required',
          code: 'auth/invalid-name'
        }
      };
    }

    // Check if Firebase is initialized
    if (!authInstance) {
      console.error('Firebase Auth not initialized');
      return { 
        success: false, 
        error: {
          message: 'Authentication service not available',
          code: 'auth/not-initialized'
        }
      };
    }

    console.log('Creating user in Firebase Auth...');
    // First create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;
    console.log('User created in Firebase Auth:', user.uid);

    // Wait for auth state to be ready
    console.log('Waiting for auth state...');
    await waitForAuth();
    console.log('Auth state ready');

    const timestamp = Date.now();
    const userData = {
      _id: user.uid,
      name,
      email,
      profilePic: '',
      followers: 0,
      following: 0,
      videos: 0,
      earnings: 0,
      challenges: 0,
      interests: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      console.log('Creating user document in Firestore...');
      // Create user profile in Firestore with merge option
      await setDoc(doc(firestoreInstance, 'users', user.uid), userData, { merge: true });
      console.log('User document created in Firestore');
      return { success: true, user: userData };
    } catch (firestoreError: any) {
      console.error('Firestore error:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      // If Firestore creation fails, delete the auth user
      console.log('Deleting auth user due to Firestore error...');
      await user.delete();
      throw firestoreError;
    }
  } catch (error: any) {
    console.error('Registration error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { 
      success: false, 
      error: {
        message: error.message,
        code: error.code
      }
    };
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    // First authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // Wait for auth state to be ready
    await waitForAuth();

    // Then fetch user data from Firestore
    const userDoc = await getDoc(doc(firestoreInstance, 'users', user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        _id: user.uid,
        name: data.name || '',
        email: data.email || '',
        profilePic: data.profilePic || '',
        followers: data.followers || 0,
        following: data.following || 0,
        videos: data.videos || 0,
        earnings: data.earnings || 0,
        challenges: data.challenges || 0,
        interests: data.interests || [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now()
      };
    } else {
      // If user document doesn't exist, create it
      const timestamp = Date.now();
      const userData = {
        _id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        profilePic: '',
        followers: 0,
        following: 0,
        videos: 0,
        earnings: 0,
        challenges: 0,
        interests: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(doc(firestoreInstance, 'users', user.uid), userData, { merge: true });
      return userData;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later');
    } else {
      throw new Error('Login failed. Please try again');
    }
  }
};

export const logoutUser = async () => {
  try {
    await signOut(authInstance);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message);
  }
};

export const getCurrentUser = () => {
  return authInstance.currentUser;
};

export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await firebaseSendPasswordResetEmail(authInstance, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    let errorMessage = 'Failed to send password reset email. Please try again.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const handleGoogleCredential = async (idToken: string): Promise<User | null> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(authInstance, credential);
    const user = userCredential.user;

    // Wait for auth state to be ready
    await waitForAuth();

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(firestoreInstance, 'users', user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        _id: user.uid,
        name: data.name || user.displayName || '',
        email: data.email || user.email || '',
        profilePic: data.profilePic || user.photoURL || '',
        followers: data.followers || 0,
        following: data.following || 0,
        videos: data.videos || 0,
        earnings: data.earnings || 0,
        challenges: data.challenges || 0,
        interests: data.interests || [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now()
      };
    } else {
      // Create new user document if it doesn't exist
      const timestamp = Date.now();
      const userData = {
        _id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        profilePic: user.photoURL || '',
        followers: 0,
        following: 0,
        videos: 0,
        earnings: 0,
        challenges: 0,
        interests: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(doc(firestoreInstance, 'users', user.uid), userData, { merge: true });
      return userData;
    }
  } catch (error: any) {
    console.error('Google credential error:', error);
    throw new Error('Failed to sign in with Google. Please try again.');
  }
}; 