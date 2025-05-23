import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const StreamTalkButton = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <Icon name="mic" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>StreamTalk</Text>
        <Text style={styles.sublabel}>& CoWatch</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sublabel: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
  },
});

export default StreamTalkButton; 