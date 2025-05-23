import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MonetizationBannerProps {
  onPress?: () => void;
}

const MonetizationBanner: React.FC<MonetizationBannerProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Monetization & Subscription</Text>
          <Icon name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.subtitle}>Premium content & ticketed events</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
  },
});

export default MonetizationBanner; 