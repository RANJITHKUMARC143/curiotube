import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Header from './components/Header';
import ContentFeed from './components/ContentFeed';
import PreviewScreen from './screens/PreviewScreen';
import { Video } from './types';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Navigator
              screenOptions={{
                header: () => <Header />,
                headerShown: true,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="Home" component={ContentFeed} />
              <Stack.Screen 
                name="Preview" 
                component={PreviewScreen}
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Navigator>
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
}); 