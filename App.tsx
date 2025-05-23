import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { waitForAuth } from './app/config/firebase';
import BottomTabNavigator from './app/navigation/BottomTabNavigator';
import PreviewScreen from './app/screens/PreviewScreen';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';

// Enable all logs
console.log('App starting...');

// Ignore specific warnings that we can't fix
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted',
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();

// Extend the dark theme with required properties
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF0000',
    background: '#000000',
  },
};

const Navigation = () => {
  const { user } = useAuth();
  console.log('Navigation rendering, user state:', { isLoggedIn: !!user });

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main Stack
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen 
            name="Preview" 
            component={PreviewScreen}
            options={{
              presentation: 'modal',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  console.log('App component rendering...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('App useEffect running...');
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        console.log('Waiting for auth...');
        await waitForAuth();
        console.log('Auth initialized successfully');
        setIsLoading(false);
        console.log('Loading state set to false');
      } catch (err) {
        console.error('Error during app initialization:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  console.log('App render state:', { isLoading, hasError: !!error });

  if (isLoading) {
    console.log('Showing loading indicator...');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    console.log('Showing error state...');
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  console.log('Rendering main app content...');
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={theme}>
          <Navigation />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});