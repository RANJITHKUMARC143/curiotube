import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  isLive: boolean;
}

const DUMMY_CREATORS: Creator[] = [
  {
    id: '1',
    name: 'Emily Roberts',
    username: '@emilymusic',
    avatar: 'https://picsum.photos/200',
    followers: 2300,
    isLive: true,
  },
  {
    id: '2',
    name: 'Patrick Jones',
    username: '@cryptopat',
    avatar: 'https://picsum.photos/201',
    followers: 15000,
    isLive: false,
  },
  {
    id: '3',
    name: 'Linda Green',
    username: '@lindatravel',
    avatar: 'https://picsum.photos/202',
    followers: 8200,
    isLive: false,
  },
];

const FollowingScreen = () => {
  const renderCreator = ({ item }: { item: Creator }) => (
    <TouchableOpacity style={styles.creatorCard}>
      <View style={styles.creatorInfo}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.followers}>
            {item.followers.toLocaleString()} followers
          </Text>
        </View>
      </View>
      {item.isLive ? (
        <View style={styles.liveContainer}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Following</Text>
      </View>

      <FlatList
        data={DUMMY_CREATORS}
        renderItem={renderCreator}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textContainer: {
    marginLeft: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    color: '#8E8E93',
    fontSize: 14,
  },
  followers: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FollowingScreen; 