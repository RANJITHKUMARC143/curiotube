import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const HeroSection = () => {
  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.liveContainer}>
        <View style={styles.videoPreview}>
          <Image
            source={{ uri: 'https://picsum.photos/800/450' }}
            style={styles.previewImage}
          />
          <View style={styles.liveIndicator}>
            <Icon name="radio" size={16} color="#FFFFFF" />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.title}>Learning Music Production</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.creator}>Emily Roberts</Text>
            <Text style={styles.viewCount}>2.3K watching</Text>
            <Text style={styles.duration}>1:05</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
  },
  liveContainer: {
    flex: 1,
  },
  videoPreview: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  videoInfo: {
    padding: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creator: {
    color: '#AAAAAA',
    fontSize: 14,
    marginRight: 8,
  },
  viewCount: {
    color: '#AAAAAA',
    fontSize: 14,
    marginRight: 8,
  },
  duration: {
    color: '#AAAAAA',
    fontSize: 14,
  },
});

export default HeroSection; 