import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Switch, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import EmptyState from './EmptyState';
import VideoCard from './VideoCard';
import { VideoService } from '../services/videoService';
import { Video } from '../types';
import ErrorMessage from './ErrorMessage';
import { useAuth } from '../context/AuthContext';

const ContentFeed: React.FC = () => {
  const navigation = useNavigation();
  const { user, isLoggedIn } = useAuth();
  const [focusMode, setFocusMode] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  console.log('[ContentFeed] Component mounted', {
    isLoggedIn,
    userId: user?.uid,
    timestamp: new Date().toISOString()
  });

  const loadVideos = async (refresh = false) => {
    try {
      console.log('[ContentFeed] Starting to load videos:', {
        refresh,
        hasMore,
        hasLastDoc: !!lastDoc,
        timestamp: new Date().toISOString()
      });

      if (refresh) {
        console.log('[ContentFeed] Refreshing feed, resetting lastDoc');
        setLastDoc(undefined);
      }

      if (!hasMore && !refresh) {
        console.log('[ContentFeed] No more videos to load and not refreshing');
        return;
      }

      console.log('[ContentFeed] Calling VideoService.getHomeVideos with options:', {
        limit: 10,
        hasLastDoc: !!lastDoc,
        timestamp: new Date().toISOString()
      });

      const result = await VideoService.getHomeVideos({
        limit: 10,
        lastDoc: refresh ? undefined : lastDoc
      });

      console.log('[ContentFeed] Videos loaded:', {
        count: result.videos.length,
        hasLastDoc: !!result.lastDoc,
        videos: result.videos.map(v => ({
          id: v.id,
          title: v.title,
          status: v.status,
          visibility: v.visibility,
          hasVideoUrl: !!v.videoUrl,
          hasThumbnail: !!v.thumbnailUrl
        })),
        timestamp: new Date().toISOString()
      });

      if (result.videos.length === 0) {
        console.log('[ContentFeed] No videos returned from query');
        if (refresh) {
          console.log('[ContentFeed] This was a refresh, clearing videos list');
          setVideos([]);
        }
      } else {
        setVideos(prev => {
          const newVideos = refresh ? result.videos : [...prev, ...result.videos];
          console.log('[ContentFeed] Updated videos state:', {
            previousCount: prev.length,
            newCount: newVideos.length,
            isRefresh: refresh,
            firstVideo: newVideos[0] ? {
              id: newVideos[0].id,
              title: newVideos[0].title
            } : null
          });
          return newVideos;
        });
      }
      
      setLastDoc(result.lastDoc || undefined);
      setHasMore(result.videos.length === 10);
      setError(null);
    } catch (error) {
      console.error('[ContentFeed] Error loading videos:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code
      });
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadVideos(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadVideos(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    console.log('[ContentFeed] Running initial useEffect', {
      isLoggedIn,
      userId: user?.uid,
      timestamp: new Date().toISOString()
    });
    loadVideos(true);
  }, []);

  const renderHeader = () => (
    <>
      <View style={styles.focusModeSection}>
        <Text style={styles.focusModeText}>Focus Mode</Text>
        <Switch
          value={focusMode}
          onValueChange={setFocusMode}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={focusMode ? '#f5dd4b' : '#f4f3f4'}
          style={styles.focusModeSwitch}
        />
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>For You</Text>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <ErrorMessage 
            message={error}
            onRetry={handleRefresh}
          />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <EmptyState
          message="No videos available"
          icon="videocam-off"
        />
      </View>
    );
  };

  const handleVideoPress = (video: Video) => {
    navigation.navigate('Preview', {
      video: {
        videoUri: video.videoUrl || '',
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnailUrl || '',
        videoId: video.id,
        creatorId: video.creatorId,
        creatorName: video.creatorUsername || 'Unknown User',
        creatorAvatar: video.creatorAvatar || '',
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.list}
        ListHeaderComponent={renderHeader}
        data={videos}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            focusMode={focusMode}
            onPress={() => handleVideoPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF0000"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  list: {
    flex: 1,
  },
  focusModeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
  },
  focusModeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  focusModeSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  sectionTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#000000',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  }
});

export default ContentFeed;
