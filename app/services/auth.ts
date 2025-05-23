import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { loginUser as mongoLoginUser, registerUser as mongoRegisterUser } from './mongodbService';
import { api } from '../services/api';

export async function loginUser(credentials: { email: string; password: string }): Promise<User | null> {
  try {
    return await mongoLoginUser(credentials.email, credentials.password);
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
}

export const registerUser = async (
  name: string,
  channelName: string,
  email: string,
  password: string,
  interests: string[]
): Promise<void> => {
  try {
    const response = await api.post('/auth/register', {
      name,
      channelName,
      email,
      password,
      interests
    });

    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export async function storeAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
} 