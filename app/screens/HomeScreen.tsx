import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import ContentFeed from '../components/ContentFeed';
import FirestoreTest from '../components/FirestoreTest';

const HomeScreen = () => {
  const [showTest, setShowTest] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CurioTube</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowTest(!showTest)}>
            <Icon name="bug-outline" size={24} color="#FFFFFF" style={styles.icon} />
          </TouchableOpacity>
          <Icon name="notifications-outline" size={24} color="#FFFFFF" style={styles.icon} />
          <Icon name="search-outline" size={24} color="#FFFFFF" style={styles.icon} />
        </View>
      </View>
      {showTest ? <FirestoreTest /> : <ContentFeed />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 20,
  },
});

export default HomeScreen; 