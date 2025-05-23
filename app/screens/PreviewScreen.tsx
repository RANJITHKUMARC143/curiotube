import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Animated, GestureResponderEvent, Modal, TextInput, Alert, Share } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { VideoService } from '../services/videoService';
import { formatViews, formatTimeAgo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { VideoStats, Creator, PlaybackStatus, AuthUser, Video as VideoType } from '../types/Video';
import { User as FirebaseUser } from 'firebase/auth';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

interface PreviewScreenParams {
  video: {
    videoUri: string;
    title: string;
    description: string;
    thumbnail: string | null;
    videoId: string;
    creatorId: string;
    creatorName: string;
    creatorAvatar: string;
  };
}

interface CommentType {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: Date;
  timestamp?: string;
}

const PreviewScreen = () => {
  const route = useRoute<PreviewScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Safely access route params with fallbacks
  const params = route.params as unknown as PreviewScreenParams;
  const video = params?.video || {
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Sample Video',
    description: 'This is a sample video for testing purposes.',
    thumbnail: null,
    videoId: 'sample-video-id',
    creatorId: 'sample-creator-id',
    creatorName: 'Sample Creator',
    creatorAvatar: 'https://picsum.photos/200'
  };

  console.log('PreviewScreen rendered with video:', video);

  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [videoStats, setVideoStats] = useState<VideoStats>({
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    isLiked: false,
    creatorId: video?.creatorId || 'preview'
  });
  const [creator, setCreator] = useState<Creator>({
    id: video?.creatorId || 'preview',
    name: video?.creatorName || 'Preview User',
    subscribers: '0',
    avatar: video?.creatorAvatar || '',
    isSubscribed: false
  });
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dummyCreator = {
    name: 'Jane Doe',
    subscribers: '1.23M',
    avatar: 'https://picsum.photos/200',
  };

  const dummyStats = {
    likes: '15K',
    comments: '320',
  };

  const dummyRecommended = [
    {
      id: '1',
      title: 'Exploring the City',
      thumbnail: 'https://picsum.photos/400/300',
      duration: '12:34',
    },
    // Add more recommended videos as needed
  ];

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      // Handle error state
      console.error('Video failed to load:', status.error);
      return;
    }

    // Now TypeScript knows this is AVPlaybackStatusSuccess
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
  };

  const togglePlay = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (videoRef.current) {
      if (isFullscreen) {
        await videoRef.current.dismissFullscreenPlayer();
      } else {
        await videoRef.current.presentFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const seekVideo = async (timeOffset: number) => {
    if (videoRef.current) {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = status.positionMillis + (timeOffset * 1000);
          const clampedPosition = Math.max(0, Math.min(newPosition, status.durationMillis || 0));
          await videoRef.current.setPositionAsync(clampedPosition);
          setPosition(clampedPosition);
          fadeIn(); // Reset timer on seek
        }
      } catch (error) {
        console.error('Error seeking video:', error);
      }
    }
  };

  const handleSeek = async (progress: number) => {
    if (videoRef.current && duration > 0) {
      try {
        const newPosition = progress * duration;
        await videoRef.current.setPositionAsync(newPosition);
        setPosition(newPosition);
        fadeIn(); // Reset timer on seek
      } catch (error) {
        console.error('Error seeking to position:', error);
      }
    }
  };

  const fadeIn = () => {
    // Clear any existing timeout
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    // Show controls
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Set timeout to hide controls
    controlsTimeout.current = setTimeout(() => {
      fadeOut();
    }, 1000);
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  const handleVideoPress = () => {
    if (showControls) {
      fadeOut();
    } else {
      fadeIn();
    }
  };

  const handleProgressPress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    
    // Get the width of the progress bar
    const progressBarElement = event.currentTarget as unknown as View;
    progressBarElement.measure((_x: number, _y: number, width: number) => {
      if (width > 0) {
        const progress = Math.max(0, Math.min(locationX / width, 1));
        handleSeek(progress);
      }
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    // Set up real-time subscriptions
    if (video.videoId) {
      const unsubscribeVideo = VideoService.subscribeToVideoUpdates(video.videoId, (video) => {
        const authUser = user as unknown as FirebaseUser;
        setVideoStats({
          views: video.views || 0,
          likes: video.likes || 0,
          comments: video.comments || 0,
          shares: video.shares || 0,
          isLiked: video.likedBy?.includes(authUser?.uid || '') || false,
          creatorId: video.creatorId
        });
      });

      const unsubscribeCreator = VideoService.subscribeToCreatorUpdates(
        video.videoId.startsWith('preview-') ? 'preview' : videoStats.creatorId,
        (creator) => {
          setCreator({
            id: creator.id,
            name: creator.name,
            subscribers: formatViews(creator.subscribers),
            avatar: creator.avatar,
            isSubscribed: creator.isSubscribed
          });
        }
      );

      const unsubscribeComments = VideoService.subscribeToComments(video.videoId, (comments) => {
        setComments(comments);
      });

      // Increment view count when video starts playing
      const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          // Handle error state
          console.error('Video failed to load:', status.error);
          return;
        }

        // Now TypeScript knows this is AVPlaybackStatusSuccess
        if (status.isPlaying && !isPlaying) {
          VideoService.incrementViews(video.videoId);
        }
        setIsPlaying(status.isPlaying);
        setPosition(status.positionMillis || 0);
      };

      return () => {
        unsubscribeVideo();
        unsubscribeCreator();
        unsubscribeComments();
      };
    }
  }, [video.videoId, isPlaying, user]);

  const handleLike = async () => {
    if (!user) return;
    const authUser = user as unknown as FirebaseUser;
    const updatedStats = {
      ...videoStats,
      likes: videoStats.isLiked ? videoStats.likes - 1 : videoStats.likes + 1,
      isLiked: !videoStats.isLiked
    };
    setVideoStats(updatedStats);
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setCreator(prev => ({
      ...prev,
      isSubscribed: !prev.isSubscribed,
      subscribers: prev.isSubscribed 
        ? (parseInt(prev.subscribers) - 1).toString()
        : (parseInt(prev.subscribers) + 1).toString()
    }));
  };

  const handleShare = async () => {
    try {
      await VideoService.shareVideo(video.videoId);
      // Share the video using the device's share functionality
      await Share.share({
        message: `Check out this video: ${video.title}`,
        url: video.videoUri
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;
    const authUser = user as unknown as FirebaseUser;
    const comment: CommentType = {
      id: Date.now().toString(),
      text: newComment,
      userId: authUser.uid,
      userName: authUser.displayName || 'Anonymous',
      userAvatar: authUser.photoURL || '',
      createdAt: new Date(),
      timestamp: formatTimeAgo(new Date())
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Creator Profile Card */}
        <View style={styles.creatorCard}>
          <View style={styles.creatorInfo}>
            <Image source={{ uri: creator.avatar }} style={styles.creatorAvatar} />
            <View style={styles.creatorText}>
              <Text style={styles.creatorName}>{creator.name}</Text>
              <Text style={styles.subscriberCount}>{creator.subscribers} subscribers</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[
              styles.subscribeButton,
              creator.isSubscribed && styles.subscribedButton
            ]}
            onPress={handleSubscribe}
          >
            <Text style={[
              styles.subscribeText,
              creator.isSubscribed && styles.subscribedText
            ]}>
              {creator.isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Player with Controls */}
        <View style={styles.videoContainer}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.videoWrapper}
            onPress={handleVideoPress}
          >
            <Video
              ref={videoRef}
              source={{ uri: video.videoUri }}
              style={styles.video}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />
            
            {showControls && (
              <Animated.View 
                style={[
                  styles.customControls,
                  { opacity: fadeAnim }
                ]}
              >
                <View style={styles.controlsContainer}>
                  <View style={styles.centerControlsRow}>
                    <TouchableOpacity 
                      style={styles.seekButton}
                      onPress={() => seekVideo(-10)}
                    >
                      <Ionicons name="play-back" size={28} color="#FFFFFF" />
                      <Text style={styles.seekText}>10</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={togglePlay} 
                      style={styles.playButton}
                    >
                      <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={40} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.seekButton}
                      onPress={() => seekVideo(10)}
                    >
                      <Ionicons name="play-forward" size={28} color="#FFFFFF" />
                      <Text style={styles.seekText}>10</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bottomControlsContainer}>
                  <View style={styles.timeAndProgress}>
                    <Text style={styles.timeText}>{formatTime(position)} / {formatTime(duration)}</Text>
                    <TouchableOpacity 
                      style={styles.progressBarContainer}
                      onPress={handleProgressPress}
                    >
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${(position / duration) * 100}%` }
                          ]} 
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    onPress={toggleFullscreen}
                    style={[styles.controlButton, styles.fullscreenButton]}
                  >
                    <Ionicons name="expand" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>

        {/* Video Stats and Actions */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statButton} onPress={handleLike}>
              <Ionicons 
                name={videoStats.isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={videoStats.isLiked ? "#FF0000" : "#FFFFFF"} 
              />
              <Text style={styles.statText}>{formatViews(videoStats.likes)}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statButton} 
              onPress={() => setShowComments(!showComments)}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
              <Text style={styles.statText}>{formatViews(videoStats.comments)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
              <Text style={styles.statText}>{formatViews(videoStats.shares)}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statButton}
              onPress={() => setShowMoreOptions(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.viewsText}>{formatViews(videoStats.views)} views</Text>
        </View>

        {/* Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <View style={styles.commentInputContainer}>
              <Image 
                source={{ uri: creator.avatar }} 
                style={styles.commentAvatar} 
              />
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleComment}
              />
            </View>
            {comments.map((comment, index) => (
              <View key={index} style={styles.commentItem}>
                <Image 
                  source={{ uri: comment.userAvatar }} 
                  style={styles.commentAvatar} 
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{comment.userName}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>{comment.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* More Options Modal */}
        <Modal
          visible={showMoreOptions}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMoreOptions(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMoreOptions(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalOption}>
                <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                <Text style={styles.modalOptionText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption}>
                <Ionicons name="save-outline" size={24} color="#FFFFFF" />
                <Text style={styles.modalOptionText}>Save to Watch Later</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption}>
                <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
                <Text style={styles.modalOptionText}>Report</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  creatorCard: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  creatorText: {
    marginLeft: 12,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriberCount: {
    color: '#8E8E93',
    fontSize: 14,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1C1C1E',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  quickRecapCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  quickRecapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickRecapTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiPowered: {
    color: '#0A84FF',
    fontSize: 14,
  },
  quickRecapText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
  },
  commentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  recommendedSection: {
    marginBottom: 24,
  },
  recommendedItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recommendedThumbnail: {
    width: 120,
    height: 68,
    borderRadius: 8,
  },
  recommendedInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  recommendedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedDuration: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  customControls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 16,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  seekButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
  },
  seekText: {
    position: 'absolute',
    bottom: -20,
    color: '#FFFFFF',
    fontSize: 12,
  },
  playButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 36,
  },
  bottomControlsContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeAndProgress: {
    flex: 1,
    marginRight: 16,
  },
  progressBarContainer: {
    padding: 8, // Larger touch target
    marginTop: 0,
    marginBottom: -8,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 1.5,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  controlButton: {
    padding: 8,
  },
  fullscreenButton: {
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  subscribedButton: {
    backgroundColor: '#333333',
  },
  subscribeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subscribedText: {
    color: '#AAAAAA',
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    marginLeft: 4,
  },
  viewsText: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalOptionText: {
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 16,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default PreviewScreen; 