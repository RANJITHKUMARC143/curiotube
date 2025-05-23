import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  startAfter,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';
import { Video } from '../types';
import { setDoc, FieldValue } from 'firebase/firestore';
import { authInstance } from '../config/firebase';
import { firestoreInstance } from '../config/firebase';

export interface VideoQueryOptions {
  limit?: number;
  lastDoc?: DocumentData;
  category?: string;
  topic?: string;
}

// Cache for user data to avoid multiple fetches
const userCache = new Map<string, any>();

// Helper function to get storage download URL
const getVideoDownloadUrl = async (videoPath: string) => {
  if (!videoPath) {
    console.error('Invalid video path: path is empty or undefined');
    return null;
  }

  try {
    console.log('Initializing Firebase Storage...');
    const storage = getStorage();
    
    console.log('Creating storage reference for path:', videoPath);
    const videoRef = ref(storage, videoPath);
    
    console.log('Attempting to get download URL...');
    const url = await getDownloadURL(videoRef);
    
    if (!url) {
      console.error('Download URL is null or empty for path:', videoPath);
      return null;
    }
    
    console.log('Successfully got download URL:', {
      path: videoPath,
      url: url.substring(0, 50) + '...' // Log truncated URL for security
    });
    return url;
  } catch (error: any) {
    console.error('Error getting download URL:', {
      path: videoPath,
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    return null;
  }
};

// Helper function to get user data with caching
const getUserData = async (userId: string) => {
  if (!userId) {
    console.warn('No userId provided for getUserData');
    return null;
  }

  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  try {
    const userDoc = await getDoc(doc(firestoreInstance, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Cache the user data
      userCache.set(userId, userData);
      console.log('Got user data:', { userId, username: userData.username });
      return userData;
    }
    console.warn('User not found:', userId);
    // Cache negative result to avoid repeated lookups
    userCache.set(userId, { username: 'Unknown User', profileImage: null });
    return userCache.get(userId);
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Cache error result
    userCache.set(userId, { username: 'Unknown User', profileImage: null });
    return userCache.get(userId);
  }
};

// Helper function to debug video data
const debugVideoData = (data: any) => {
  console.log('Video Data Debug:', {
    id: data.id,
    title: data.title,
    videoUrl: data.videoUrl,
    videoPath: data.videoPath,
    thumbnailUrl: data.thumbnailUrl,
    status: data.status,
    visibility: data.visibility,
    creatorId: data.creatorId,
    creatorUsername: data.creatorUsername
  });
};

// Helper function to validate video data
const validateVideoData = async (data: any) => {
  console.log('Validating video:', data.id, {
    hasTitle: !!data.title,
    hasVideoUrl: !!data.videoUrl,
    hasVideoPath: !!data.videoPath,
    status: data.status,
    visibility: data.visibility
  });

  // Check for required fields
  if (!data.id) {
    console.warn('Video missing ID');
    return false;
  }

  // Set default title if missing
  if (!data.title) {
    data.title = 'Untitled Video';
    console.log('Using default title for video:', data.id);
  }

  // Handle video URL
  if (!data.videoPath && !data.videoUrl) {
    console.warn('Video missing both videoPath and videoUrl:', data.id);
    return false;
  }

  // If we have a videoPath but no videoUrl, try to get the download URL
  if (data.videoPath && !data.videoUrl) {
    console.log('Getting download URL for video:', data.id);
    const downloadUrl = await getVideoDownloadUrl(data.videoPath);
    if (downloadUrl) {
      data.videoUrl = downloadUrl;
      console.log('Successfully got download URL for video:', data.id);
    } else {
      console.warn('Could not get download URL for video:', data.id);
      return false;
    }
  }

  // Be more lenient with status and visibility
  if (!data.status) {
    data.status = 'published';
    console.log('Setting default status for video:', data.id);
  }

  if (!data.visibility) {
    data.visibility = 'public';
    console.log('Setting default visibility for video:', data.id);
  }

  console.log('Video validation successful:', data.id);
  return true;
};

// Helper function to validate video URL
const validateVideoUrl = (url: string | undefined): string => {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    return '';
  }
};

// Helper function to validate thumbnail URL
const validateThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    return '';
  }
};

// Helper function to validate string
const validateString = (value: any): string => {
  return typeof value === 'string' ? value : '';
};

// Helper function to validate number
const validateNumber = (value: any): number => {
  return typeof value === 'number' ? value : 0;
};

// Helper function to validate array
const validateArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [];
};

// Helper function to validate object
const validateObject = (value: any): any => {
  return typeof value === 'object' && value !== null ? value : {};
};

// Helper function to process video data
const processVideoData = async (docId: string, data: any): Promise<Video | null> => {
  try {
    console.log('Starting video data processing for:', docId);
    
    // Validate required fields
    if (!docId) {
      console.error('Invalid document ID');
      return null;
    }

    if (!data) {
      console.error('Invalid video data for document:', docId);
      return null;
    }

    // Validate required fields
    if (!data.status || !data.visibility) {
      console.error('Missing required fields:', {
        docId,
        hasStatus: !!data.status,
        hasVisibility: !!data.visibility
      });
      return null;
    }

    // Only process published and public videos
    if (data.status !== 'published' || data.visibility !== 'public') {
      console.log('Skipping video - not published or not public:', {
        docId,
        status: data.status,
        visibility: data.visibility
      });
      return null;
    }

    // Get user data with error handling
    let userData = null;
    try {
      console.log('Fetching user data for creator:', data.creatorId);
      userData = await getUserData(data.creatorId);
      console.log('User data retrieved:', {
        userId: data.creatorId,
        hasUsername: !!userData?.username,
        hasProfileImage: !!userData?.profileImage
      });
    } catch (error) {
      console.error('Error fetching user data:', {
        docId,
        creatorId: data.creatorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Continue with default values
    }

    // Ensure we have either a video URL or path
    let videoUrl = data.videoUrl;
    if (!videoUrl && data.videoPath) {
      console.log('Video URL missing, attempting to get from path:', data.videoPath);
      videoUrl = await getVideoDownloadUrl(data.videoPath);
    }

    // Validate video URL
    if (!videoUrl) {
      console.error('No valid video URL found for:', docId);
      return null;
    }

    const videoData: Video = {
      id: docId,
      title: data.title || 'Untitled Video',
      description: data.description || '',
      videoUrl: videoUrl,
      videoPath: data.videoPath || '',
      thumbnailUrl: data.thumbnailUrl || 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      duration: data.duration || '0:00',
      views: typeof data.views === 'number' ? data.views : 0,
      likes: typeof data.likes === 'number' ? data.likes : 0,
      comments: typeof data.comments === 'number' ? data.comments : 0,
      creatorId: data.creatorId || 'unknown',
      creatorUsername: userData?.username || 'Unknown User',
      creatorAvatar: userData?.profileImage || '',
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
      status: data.status,
      visibility: data.visibility
    };

    console.log('Video data processing completed:', {
      docId,
      hasVideoUrl: !!videoData.videoUrl,
      hasThumbnail: !!videoData.thumbnailUrl,
      status: videoData.status,
      visibility: videoData.visibility
    });

    return videoData;
  } catch (error) {
    console.error('Error processing video data:', {
      docId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

interface StorageVideoItem {
  url: string;
  path: string;
  userId: string;
  fileName: string;
}

export interface StorageVideoResult {
  success: boolean;
  videos: StorageVideoItem[];
  total: number;
  error?: string;
}

export const VideoService = {
  getHomeVideos: async ({ limit = 10, lastDoc }: VideoQueryOptions = {}): Promise<{ videos: Video[], lastDoc?: QueryDocumentSnapshot<DocumentData> }> => {
    try {
      console.log('[VideoService] Starting getHomeVideos with options:', {
        limit,
        hasLastDoc: !!lastDoc,
        timestamp: new Date().toISOString()
      });

      // Get reference to videos collection
      const videosRef = collection(firestoreInstance, 'videos');
      console.log('[VideoService] Got reference to videos collection');

      // Build query with proper filters
      let queryConstraints: QueryConstraint[] = [
        where('status', '==', 'published'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      ];

      // Only add startAfter if lastDoc and lastDoc.data().createdAt exist
      if (lastDoc && lastDoc.data().createdAt) {
        queryConstraints.push(startAfter(lastDoc.data().createdAt));
      }

      const q = query(videosRef, ...queryConstraints);
      console.log('[VideoService] Created query with filters:', {
        filters: ['status=published', 'visibility=public', 'ordered by createdAt'],
        limit,
        hasLastDoc: !!lastDoc
      });

      // Execute query
      console.log('[VideoService] Executing query...');
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
        console.log('[VideoService] Query executed:', {
          empty: querySnapshot.empty,
          size: querySnapshot.size,
          metadata: querySnapshot.metadata,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[VideoService] Error executing query:', error);
        throw error;
      }

      if (querySnapshot.empty) {
        console.log('[VideoService] No documents found');
        return { videos: [], lastDoc: undefined };
      }

      // Process results
      const videos: Video[] = [];
      console.log('[VideoService] Processing documents...');

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure createdAt is a Firestore Timestamp or Date
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        }
        console.log('[VideoService] Processing document:', {
          id: doc.id,
          hasData: !!data,
          fields: Object.keys(data),
          status: data.status,
          visibility: data.visibility,
          hasCreatedAt: !!createdAt,
          hasVideoUrl: !!data.videoUrl,
          hasThumbnail: !!data.thumbnailUrl
        });

        const video: Video = {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          duration: data.duration,
          views: data.views || 0,
          likes: data.likes || 0,
          comments: data.comments || 0,
          creatorId: data.creatorId,
          creatorUsername: data.creatorUsername,
          creatorAvatar: data.creatorAvatar,
          status: data.status,
          visibility: data.visibility,
          category: data.category,
          topic: data.topic,
          tags: data.tags || [],
          createdAt: createdAt,
          updatedAt: data.updatedAt,
          scheduledTime: data.scheduledTime,
          isMonetized: data.isMonetized
        };
        videos.push(video);
      });

      console.log('[VideoService] Processed all documents:', {
        processedCount: videos.length,
        firstVideoId: videos[0]?.id,
        timestamp: new Date().toISOString()
      });

      return {
        videos,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('[VideoService] Error in getHomeVideos:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  processQuerySnapshot: async (querySnapshot: QuerySnapshot) => {
    try {
      console.log('[VideoService] Processing query snapshot:', {
        size: querySnapshot.size,
        empty: querySnapshot.empty,
        timestamp: new Date().toISOString()
      });

      const processedVideos: Video[] = [];
      
      for (const doc of querySnapshot.docs) {
        try {
          console.log('[VideoService] Processing document:', {
            id: doc.id,
            hasData: !!doc.data(),
            fields: Object.keys(doc.data())
          });

          const video = await processVideoData(doc.id, doc.data());
          if (video) {
            processedVideos.push(video);
            console.log('[VideoService] Document processed successfully:', {
              id: doc.id,
              title: video.title,
              hasVideoUrl: !!video.videoUrl,
              hasThumbnail: !!video.thumbnailUrl
            });
          }
        } catch (error) {
          console.error('[VideoService] Error processing document:', {
            docId: doc.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue processing other documents
          continue;
        }
      }

      console.log('[VideoService] Query processing completed:', {
        totalProcessed: processedVideos.length,
        hasLastDoc: querySnapshot.docs.length > 0,
        timestamp: new Date().toISOString()
      });

      return {
        videos: processedVideos,
        lastDoc: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null
      };
    } catch (error) {
      console.error('[VideoService] Error in processQuerySnapshot:', error);
      throw error;
    }
  },

  addTestVideo: async () => {
    try {
      console.log('[VideoService] Starting addTestVideo process...');
      const testVideoData = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        creatorId: 'test_user',
        createdAt: serverTimestamp(), // This will be a proper server timestamp
        status: 'published',
        visibility: 'public',
        views: 0,
        likes: 0,
        comments: 0,
        duration: '9:56',
        category: 'Test',
        tags: ['test'],
        sections: {
          forYou: true,
          explore: true
        },
        // Add these fields to match our Video type
        isMonetized: false,
        topic: 'Test Topic',
        updatedAt: serverTimestamp(),
        scheduledTime: null
      };

      console.log('[VideoService] Creating test video with data:', {
        status: testVideoData.status,
        visibility: testVideoData.visibility,
        hasTimestamp: !!testVideoData.createdAt
      });

      const docRef = doc(firestoreInstance, 'videos', `test_${Date.now()}`);
      await setDoc(docRef, testVideoData);
      
      // Verify the document was created
      const docSnap = await getDoc(docRef);
      console.log('[VideoService] Test video creation result:', {
        exists: docSnap.exists(),
        id: docRef.id,
        hasData: !!docSnap.data(),
        fields: docSnap.exists() ? Object.keys(docSnap.data()) : []
      });

      return true;
    } catch (error) {
      console.error('[VideoService] Error adding test video:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  },

  // Fetch all published videos for Explore screen
  getExploreVideos: async (options: VideoQueryOptions = {}) => {
    try {
      const { limit: queryLimit = 20, lastDoc, category, topic } = options;
      const videosRef = collection(firestoreInstance, 'videos');
      
      // Base query conditions
      const conditions: QueryConstraint[] = [
        where('status', '==', 'published'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(queryLimit)
      ];

      // Add category filter if provided
      if (category) {
        conditions.unshift(where('category', '==', category));
      }

      // Add topic filter if provided
      if (topic) {
        conditions.unshift(where('topic', '==', topic));
      }

      // Add pagination if last document is provided
      if (lastDoc) {
        conditions.push(startAfter(lastDoc));
      }

      const q = query(videosRef, ...conditions);
      const querySnapshot = await getDocs(q);
      
      const videos = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const data = doc.data();
          const userData = await getUserData(data.creatorId);
          
          const videoData = {
            id: doc.id,
            ...data,
            videoUrl: validateVideoUrl(data.videoUrl),
            thumbnailUrl: validateThumbnailUrl(data.thumbnailUrl),
            title: data.title || 'Untitled Video',
            description: data.description || '',
            duration: data.duration || '0:00',
            views: data.views || 0,
            likes: data.likes || 0,
            comments: data.comments || 0,
            creatorId: data.creatorId || '',
            creatorUsername: userData?.username || 'Unknown User',
            creatorAvatar: userData?.profileImage || '',
            createdAt: data.createdAt || new Date(),
            category: data.category || 'Uncategorized',
            tags: data.tags || [],
            status: data.status || 'draft',
            visibility: data.visibility || 'private'
          };
          
          // Debug the video data
          debugVideoData(videoData);
          
          return videoData;
        })
      );

      // Validate videos and filter out inaccessible ones
      const validVideos = await Promise.all(
        videos.map(async video => {
          const isValid = await validateVideoData(video);
          return isValid ? video : null;
        })
      );

      const filteredVideos = validVideos.filter(video => video !== null);
      console.log('Fetched explore videos:', filteredVideos.length);
      
      return {
        videos: filteredVideos,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error fetching explore videos:', error);
      throw error;
    }
  },

  // Fetch trending videos (high engagement)
  getTrendingVideos: async (options: VideoQueryOptions = {}) => {
    try {
      const { limit: queryLimit = 10, lastDoc, category, topic } = options;
      const videosRef = collection(firestoreInstance, 'videos');
      
      // Base query conditions
      const conditions: QueryConstraint[] = [
        where('status', '==', 'published'),
        where('visibility', '==', 'public'),
        orderBy('engagement.shareCount', 'desc'),
        firestoreLimit(queryLimit)
      ];

      // Add category filter if provided
      if (category) {
        conditions.unshift(where('category', '==', category));
      }

      // Add topic filter if provided
      if (topic) {
        conditions.unshift(where('topic', '==', topic));
      }

      // Add pagination if last document is provided
      if (lastDoc) {
        conditions.push(startAfter(lastDoc));
      }

      const q = query(videosRef, ...conditions);
      const querySnapshot = await getDocs(q);
      
      const videos = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          videoUrl: doc.data().videoUrl || '',
          thumbnailUrl: doc.data().thumbnailUrl || doc.data().videoUrl || '',
          title: doc.data().title || 'Untitled Video',
          description: doc.data().description || '',
          duration: doc.data().duration || '0:00',
          views: doc.data().views || 0,
          likes: doc.data().likes || 0,
          comments: doc.data().comments || 0,
          creatorId: doc.data().creatorId || '',
          createdAt: doc.data().createdAt || new Date(),
          category: doc.data().category || 'Uncategorized',
          tags: doc.data().tags || []
        }))
        .filter(validateVideoData);

      console.log('Fetched trending videos:', videos.length);
      
      return {
        videos,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      throw error;
    }
  },

  // Fetch all published videos (for both Home and Explore)
  getAllPublishedVideos: async (options: VideoQueryOptions = {}) => {
    try {
      const { limit: queryLimit = 20, lastDoc, category, topic } = options;
      const videosRef = collection(firestoreInstance, 'videos');
      
      // Base query conditions
      const conditions: QueryConstraint[] = [
        where('status', '==', 'published'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(queryLimit)
      ];

      // Add category filter if provided
      if (category) {
        conditions.unshift(where('category', '==', category));
      }

      // Add topic filter if provided
      if (topic) {
        conditions.unshift(where('topic', '==', topic));
      }

      // Add pagination if last document is provided
      if (lastDoc) {
        conditions.push(startAfter(lastDoc));
      }

      const q = query(videosRef, ...conditions);
      const querySnapshot = await getDocs(q);
      
      const videos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Fetched all published videos:', videos.length);
      
      return {
        videos,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error fetching all published videos:', error);
      throw error;
    }
  },

  getVideoById: async (videoId: string) => {
    try {
      const docRef = doc(firestoreInstance, 'videos', videoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Video not found');
      }

      const data = docSnap.data();
      const engagement = validateObject(data.engagement);
      
      return {
        id: docSnap.id,
        title: validateString(data.title) || 'Untitled Video',
        description: validateString(data.description),
        videoUrl: validateVideoUrl(data.videoUrl),
        thumbnailUrl: validateThumbnailUrl(data.thumbnailUrl),
        duration: validateString(data.duration) || '0:00',
        views: validateNumber(data.views),
        likes: validateNumber(data.likes),
        comments: validateNumber(data.comments),
        shares: validateNumber(data.shares),
        creatorId: validateString(data.creatorId),
        status: validateString(data.status) || 'published',
        visibility: validateString(data.visibility) || 'public',
        createdAt: data.createdAt || new Date(),
        category: validateString(data.category) || 'Uncategorized',
        tags: validateArray(data.tags),
        engagement: {
          watchTime: validateNumber(engagement.watchTime),
          completionRate: validateNumber(engagement.completionRate),
          shareCount: validateNumber(engagement.shareCount)
        }
      };
    } catch (error) {
      console.error('Error getting video by ID:', error);
      throw error;
    }
  },

  getCreatorDetails: async (videoId: string) => {
    try {
      const videoDoc = await getDoc(doc(firestoreInstance, 'videos', videoId));
      if (!videoDoc.exists()) {
        return {
          id: '',
          name: 'Unknown User',
          subscribers: 0,
          avatar: '',
          isSubscribed: false
        };
      }

      const data = videoDoc.data();
      const creatorId = validateString(data.creatorId);
      
      if (!creatorId) {
        return {
          id: '',
          name: 'Unknown User',
          subscribers: 0,
          avatar: '',
          isSubscribed: false
        };
      }

      const creatorDoc = await getDoc(doc(firestoreInstance, 'users', creatorId));
      
      if (!creatorDoc.exists()) {
        return {
          id: creatorId,
          name: 'Unknown User',
          subscribers: 0,
          avatar: '',
          isSubscribed: false
        };
      }

      const creatorData = creatorDoc.data();
      return {
        id: creatorId,
        name: validateString(creatorData.username) || 'Unknown User',
        subscribers: validateNumber(creatorData.subscribers),
        avatar: validateThumbnailUrl(creatorData.profileImage),
        isSubscribed: false
      };
    } catch (error) {
      console.error('Error getting creator details:', error);
      return {
        id: '',
        name: 'Unknown User',
        subscribers: 0,
        avatar: '',
        isSubscribed: false
      };
    }
  },

  getComments: async (videoId: string) => {
    try {
      const commentsRef = collection(firestoreInstance, 'videos', videoId, 'comments');
      const querySnapshot = await getDocs(commentsRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: validateString(data.text),
          userId: validateString(data.userId),
          username: validateString(data.username) || 'Anonymous',
          timestamp: data.timestamp?.toDate() || new Date(),
          likes: validateNumber(data.likes)
        };
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  },

  getVideoStats: async (videoId: string) => {
    try {
      const docRef = doc(firestoreInstance, 'videos', videoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          watchTime: 0,
          completionRate: 0,
          shareCount: 0
        };
      }

      const data = docSnap.data();
      const engagement = validateObject(data.engagement);
      
      return {
        views: validateNumber(data.views),
        likes: validateNumber(data.likes),
        comments: validateNumber(data.comments),
        shares: validateNumber(data.shares),
        watchTime: validateNumber(engagement.watchTime),
        completionRate: validateNumber(engagement.completionRate),
        shareCount: validateNumber(engagement.shareCount)
      };
    } catch (error) {
      console.error('Error getting video stats:', error);
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        watchTime: 0,
        completionRate: 0,
        shareCount: 0
      };
    }
  },

  toggleLike: async (videoId: string) => {
    try {
      const docRef = doc(firestoreInstance, 'videos', videoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Video not found');
      }

      const currentLikes = docSnap.data().likes || 0;
      await updateDoc(docRef, {
        likes: currentLikes + 1
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  toggleSubscribe: async (creatorId: string) => {
    try {
      const docRef = doc(firestoreInstance, 'users', creatorId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Creator not found');
      }

      const currentSubscribers = docSnap.data().subscribers || 0;
      await updateDoc(docRef, {
        subscribers: currentSubscribers + 1
      });
    } catch (error) {
      console.error('Error toggling subscribe:', error);
      throw error;
    }
  },

  shareVideo: async (videoId: string) => {
    try {
      const docRef = doc(firestoreInstance, 'videos', videoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Video not found');
      }

      const currentShares = docSnap.data().shares || 0;
      await updateDoc(docRef, {
        shares: currentShares + 1
      });
    } catch (error) {
      console.error('Error sharing video:', error);
      throw error;
    }
  },

  addComment: async (videoId: string, text: string) => {
    try {
      const commentsRef = collection(firestoreInstance, 'videos', videoId, 'comments');
      const newComment = {
        text,
        userId: 'currentUserId', // This should be replaced with the actual current user's ID
        userName: 'currentUserName', // This should be replaced with the actual current user's name
        userAvatar: 'currentUserAvatar', // This should be replaced with the actual current user's avatar
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(commentsRef, newComment);
      return {
        id: docRef.id,
        ...newComment
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  subscribeToVideoUpdates: (videoId: string, callback: (video: any) => void) => {
    console.log('Subscribing to video updates for:', videoId);
    // This is a mock implementation
    // In a real app, you would use Firestore's onSnapshot
    return () => {
      console.log('Unsubscribed from video updates for:', videoId);
    };
  },

  subscribeToCreatorUpdates: (creatorId: string, callback: (creator: any) => void) => {
    console.log('Subscribing to creator updates for:', creatorId);
    // This is a mock implementation
    // In a real app, you would use Firestore's onSnapshot
    return () => {
      console.log('Unsubscribed from creator updates for:', creatorId);
    };
  },

  subscribeToComments: (videoId: string, callback: (comments: any[]) => void) => {
    console.log('Subscribing to comments for:', videoId);
    // This is a mock implementation
    // In a real app, you would use Firestore's onSnapshot
    return () => {
      console.log('Unsubscribed from comments for:', videoId);
    };
  },

  // Add this new function to test Firestore connectivity
  testFirestoreConnection: async () => {
    try {
      console.log('[Firestore Test] Starting connection test...');
      console.log('[Firestore Test] Environment:', process.env.NODE_ENV);
      
      // First, verify Firebase is initialized
      if (!firestoreInstance) {
        console.error('[Firestore Test] Error: Firestore instance is not initialized');
        return {
          success: false,
          error: 'Firestore instance is not initialized',
          timestamp: new Date().toISOString()
        };
      }
      
      console.log('[Firestore Test] Firestore instance exists');
      
      // Check if user is authenticated
      const currentUser = authInstance.currentUser;
      console.log('[Firestore Test] Authentication status:', {
        isAuthenticated: !!currentUser,
        userId: currentUser?.uid,
        email: currentUser?.email
      });
      
      // Try to get a single document using a simpler query
      const videosRef = collection(firestoreInstance, 'videos');
      console.log('[Firestore Test] Collection reference created:', {
        path: videosRef.path,
        type: videosRef.type,
        id: videosRef.id
      });
      
      // First try a simple query without conditions
      console.log('[Firestore Test] Attempting simple query...');
      const simpleQuery = query(videosRef);
      const simpleSnapshot = await getDocs(simpleQuery);
      console.log('[Firestore Test] Simple query results:', {
        empty: simpleSnapshot.empty,
        size: simpleSnapshot.size
      });

      // If no documents found, try to add a test video
      if (simpleSnapshot.empty && currentUser) {
        console.log('[Firestore Test] No documents found, attempting to add test video...');
        try {
          await VideoService.addTestVideo();
          console.log('[Firestore Test] Test video added successfully');
          
          // Wait a moment for the document to be queryable
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try query again
          const retrySnapshot = await getDocs(simpleQuery);
          console.log('[Firestore Test] Retry query results:', {
            empty: retrySnapshot.empty,
            size: retrySnapshot.size
          });

          if (!retrySnapshot.empty) {
            const firstDoc = retrySnapshot.docs[0];
            console.log('[Firestore Test] First document details:', {
              id: firstDoc.id,
              exists: firstDoc.exists(),
              hasData: !!firstDoc.data(),
              fields: Object.keys(firstDoc.data())
            });
          }
        } catch (error) {
          console.error('[Firestore Test] Error adding test video:', error);
        }
      }

      // Try a query with conditions
      console.log('[Firestore Test] Attempting query with conditions...');
      const constrainedQuery = query(
        videosRef,
        where('status', '==', 'published'),
        where('visibility', '==', 'public')
      );
      
      const constrainedSnapshot = await getDocs(constrainedQuery);
      console.log('[Firestore Test] Constrained query results:', {
        empty: constrainedSnapshot.empty,
        size: constrainedSnapshot.size
      });
      
      return {
        success: true,
        documentsFound: simpleSnapshot.size,
        constrainedDocumentsFound: constrainedSnapshot.size,
        hasDocuments: !simpleSnapshot.empty,
        isAuthenticated: !!currentUser,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[Firestore Test] Connection test failed:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Check for specific error types
      if (error.code === 'permission-denied') {
        return {
          success: false,
          error: 'Permission denied. Please check Firestore rules and authentication state.',
          code: error.code,
          timestamp: new Date().toISOString()
        };
      } else if (error.code === 'unavailable') {
        return {
          success: false,
          error: 'Firestore is currently unavailable. Please check your internet connection.',
          code: error.code,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Add this new function to list all videos and thumbnails
  listAllVideosAndThumbnails: async () => {
    try {
      console.log('Starting to list all videos...');
      const storage = getStorage();
      
      // Reference to the videos folder
      const videosRef = ref(storage, 'videos');
      
      // Get all video files
      const videoFiles: { name: string; url: string; path: string }[] = [];
      
      // Function to recursively list files in a folder
      const listFilesRecursively = async (folderRef: any) => {
        try {
          console.log(`Listing files in folder: ${folderRef.fullPath}`);
          const result = await listAll(folderRef);
          
          console.log(`Found ${result.items.length} items and ${result.prefixes.length} subfolders in ${folderRef.fullPath}`);
          
          // Process files in current folder
          for (const item of result.items) {
            const filePath = item.fullPath;
            const fileName = filePath.split('/').pop();
            
            if (!fileName) {
              console.log('Skipping item with no filename');
              continue;
            }
            
            try {
              console.log(`Processing file: ${filePath}`);
              
              // Get download URL for the video
              const videoUrl = await getDownloadURL(item);
              console.log(`Got video URL for ${fileName}`);
              
              videoFiles.push({
                name: fileName,
                path: filePath,
                url: videoUrl
              });
            } catch (error) {
              console.error(`Error processing file ${fileName}:`, error);
            }
          }
          
          // Recursively process subfolders
          for (const prefix of result.prefixes) {
            console.log(`Processing subfolder: ${prefix.fullPath}`);
            await listFilesRecursively(prefix);
          }
        } catch (error) {
          console.error(`Error listing folder ${folderRef.fullPath}:`, error);
        }
      };
      
      // Start recursive listing
      await listFilesRecursively(videosRef);
      
      console.log(`Found ${videoFiles.length} videos`);
      return videoFiles;
    } catch (error: unknown) {
      console.error('Error listing videos:', {
        error,
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to list videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getAllVideoUrls: async (): Promise<StorageVideoResult> => {
    try {
      console.log('Starting to fetch all video URLs from Firebase Storage...');
      const storage = getStorage();
      const videosRef = ref(storage, 'videos');
      const videoUrls: StorageVideoItem[] = [];

      // List all user folders in videos directory
      const userFolders = await listAll(videosRef);
      console.log(`Found ${userFolders.prefixes.length} user folders in storage`);

      // Process each user folder
      for (const userFolder of userFolders.prefixes) {
        try {
          const userId = userFolder.name; // This will be the Firebase Auth UID
          console.log(`Processing videos for user: ${userId}`);

          // List all files in user folder
          const userFiles = await listAll(userFolder);
          console.log(`Found ${userFiles.items.length} files in user folder ${userId}`);
          
          // Get download URLs for all files
          const urlPromises = userFiles.items.map(async (fileRef) => {
            try {
              const url = await getDownloadURL(fileRef);
              const fileName = fileRef.name;
              
              return {
                url,
                path: fileRef.fullPath,
                userId,
                fileName
              };
            } catch (error) {
              console.error(`Error processing file ${fileRef.fullPath}:`, error);
              return null;
            }
          });

          const urls = await Promise.all(urlPromises);
          const validUrls = urls.filter((item): item is StorageVideoItem => item !== null);
          
          videoUrls.push(...validUrls);
          console.log(`Successfully processed ${validUrls.length} videos for user ${userId}`);
        } catch (error) {
          console.error(`Error processing user folder ${userFolder.name}:`, {
            error,
            code: (error as any)?.code,
            message: (error as any)?.message
          });
          // Continue with next user folder
          continue;
        }
      }

      console.log(`Successfully retrieved ${videoUrls.length} total video URLs`);
      return {
        success: true,
        videos: videoUrls,
        total: videoUrls.length
      };
    } catch (error) {
      console.error('Error fetching video URLs:', {
        error,
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      return {
        success: false,
        videos: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Helper function to get videos for a specific user
  getUserVideos: async (userId: string): Promise<StorageVideoResult> => {
    try {
      console.log(`Fetching videos for user: ${userId}`);
      const storage = getStorage();
      const userFolderRef = ref(storage, `videos/${userId}`);
      const videoUrls: StorageVideoItem[] = [];

      // List all files in user's folder
      const userFiles = await listAll(userFolderRef);
      console.log(`Found ${userFiles.items.length} files for user ${userId}`);
      
      // Get download URLs for all files
      const urlPromises = userFiles.items.map(async (fileRef) => {
        try {
          const url = await getDownloadURL(fileRef);
          const fileName = fileRef.name;
          
          return {
            url,
            path: fileRef.fullPath,
            userId,
            fileName
          };
        } catch (error) {
          console.error(`Error processing file ${fileRef.fullPath}:`, error);
          return null;
        }
      });

      const urls = await Promise.all(urlPromises);
      const validUrls = urls.filter((item): item is StorageVideoItem => item !== null);

      console.log(`Successfully retrieved ${validUrls.length} videos for user ${userId}`);
      return {
        success: true,
        videos: validUrls,
        total: validUrls.length
      };
    } catch (error) {
      console.error(`Error fetching videos for user ${userId}:`, {
        error,
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      return {
        success: false,
        videos: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
};

// Legacy function - keeping for backward compatibility
export const fetchVideos = async (category?: string) => {
  try {
    const videosRef = collection(firestoreInstance, 'videos');
    const conditions = [
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(20)
    ];

    if (category) {
      conditions.unshift(where('category', '==', category));
    }

    const q = query(videosRef, ...conditions);
    const querySnapshot = await getDocs(q);
    
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Fetched videos:', videos.length);
    
    return { success: true, videos };
  } catch (error) {
    console.error('Error fetching videos:', error);
    return { success: false, error };
  }
};

// Legacy function - keeping for backward compatibility
export const fetchUserVideos = async (userId: string) => {
  try {
    const videosRef = collection(firestoreInstance, 'videos');
    const conditions = [
      where('creatorId', '==', userId),
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    ];

    const q = query(videosRef, ...conditions);
    const querySnapshot = await getDocs(q);
    
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Fetched user videos:', videos.length);
    
    return { success: true, videos };
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return { success: false, error };
  }
}; 