import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface TrendingChallengesProps {
  onPress?: () => void;
}

const TrendingChallenges: React.FC<TrendingChallengesProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Trending Challenges</Text>
          <Icon name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.challengesContainer}>
          <View style={styles.challengeTag}>
            <Icon name="trending-up" size={16} color="#4A90E2" />
            <Text style={styles.challengeText}>#MusicChallenge</Text>
          </View>
          <View style={styles.challengeTag}>
            <Icon name="flame" size={16} color="#FF3B30" />
            <Text style={styles.challengeText}>#DanceOff2024</Text>
          </View>
        </View>
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
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  challengesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  challengeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  challengeText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default TrendingChallenges; 