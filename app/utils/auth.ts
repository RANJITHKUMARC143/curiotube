import { Platform } from 'react-native';

// Simple password hashing for React Native
function hashString(str: string): string {
  // Add salt to the password
  const salted = str + "curiotube_salt_v1";
  
  // Convert string to array of character codes
  const chars = salted.split('').map(c => c.charCodeAt(0));
  
  // Initialize hash value
  let hash = 0;
  
  // Mix the characters
  for (let i = 0; i < chars.length; i++) {
    hash = ((hash << 5) - hash) + chars[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string
  return Math.abs(hash).toString(16);
}

export async function hashPassword(password: string): Promise<string> {
  return hashString(password);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
} 