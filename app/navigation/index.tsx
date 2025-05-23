import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#FF0000',
            background: '#000000',
            card: '#1C1C1E',
            text: '#FFFFFF',
            border: '#2C2C2E',
            notification: '#FF0000',
          },
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Add your screens here */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 