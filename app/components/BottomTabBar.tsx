import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface TabButtonProps {
  icon: string;
  label: string;
  isActive?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive = false }) => (
  <TouchableOpacity style={styles.tab}>
    <Icon 
      name={icon} 
      size={24} 
      color={isActive ? '#4A90E2' : '#FFFFFF'} 
    />
    <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const BottomTabBar: React.FC = () => {
  return (
    <View style={styles.container}>
      <TabButton icon="home" label="Home" isActive={true} />
      <TabButton icon="search" label="Explore" />
      <TabButton icon="add-circle" label="Upload" />
      <TabButton icon="radio" label="Live" />
      <TabButton icon="person" label="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 8,
    paddingBottom: 24, // Add extra padding for iPhone home indicator
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#4A90E2',
  },
});

export default BottomTabBar; 