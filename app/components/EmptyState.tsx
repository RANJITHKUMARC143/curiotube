import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface EmptyStateProps {
  message: string;
  icon: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={48} color="#666666" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default EmptyState; 