import { storageInstance, firestoreInstance, authInstance } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp, FieldValue, collection, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { ImagePickerAsset } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { VideoThumbnailService } from './VideoThumbnailService';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as MediaLibrary from 'expo-media-library';

interface ThumbnailOptions {
  url: string;
  timeStamp: number;
  format: 'jpeg' | 'png';
  quality: number;
}

interface ThumbnailResult {
  path: string;
  width: number;
  height: number;
}

export interface VideoMetadata {
  title: string;
  description: string;
  topic: string;
  tags: string[];
  category: string;
  isMonetized: boolean;
  visibility: 'public' | 'private' | 'subscribers' | 'scheduled';
  scheduledTime?: Date;
  thumbnail?: Blob;
}

interface VideoDocument extends VideoMetadata {
  videoUrl: string;
  thumbnailUrl: string;
  creatorId: string;
  createdAt: FieldValue;
  localCreatedAt: Date;
  status: string;
  views: number;
  likes: number;
  comments: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadTimestamp: number;
  scheduledTime?: Date;
  sections: {
    forYou: boolean;
    explore: boolean;
  };
  engagement: {
    watchTime: number;
    completionRate: number;
    shareCount: number;
  };
}

interface VideoWithId extends VideoDocument {
  id: string;
}

const VALID_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska'
];

export const VideoUploadService = {
  uploadVideo: async (
    videoFile: ImagePickerAsset,
    metadata: VideoMetadata,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; videoUrl: string }> => {
    console.log('[VideoUploadService] Starting video upload process', {
      userId,
      title: metadata.title,
      visibility: metadata.visibility,
      scheduledVisibility: metadata.scheduledTime ? 'scheduled' : undefined
    });

    try {
      // Check if user is authenticated and get current user
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        console.error('Authentication error: No current user');
        throw new Error('You must be logged in to upload videos');
      }

      // Validate file
      if (!videoFile.uri) {
        throw new Error('No video URI found');
      }

      // Check file type and get file info
      const mimeType = videoFile.mimeType || 'video/mp4';
      if (!VALID_VIDEO_TYPES.includes(mimeType)) {
        throw new Error('Invalid video format. Please use MP4, MOV, AVI, or MKV format.');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoFile.uri);
      if (!fileInfo.exists) {
        throw new Error('Video file does not exist');
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = mimeType.split('/')[1] || 'mp4';
      const fileName = `${userId}_${timestamp}.${fileExtension}`;

      // Read file as blob
      const response = await fetch(videoFile.uri);
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();

      // Create storage reference
      const videoRef = ref(storageInstance, `videos/${userId}/${fileName}`);
      console.log('Storage reference created:', videoRef.fullPath);

      // Create upload task
      const uploadTask = uploadBytesResumable(videoRef, blob, {
        contentType: mimeType,
        customMetadata: {
          uploadedBy: userId,
          originalFileName: fileName,
          fileSize: fileInfo.size.toString(),
          timestamp: timestamp.toString()
        }
      });

      // Monitor upload progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('[VideoUploadService] Upload progress:', {
              progress: `${progress.toFixed(2)}%`,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state
            });
            onProgress?.(progress);
          },
          (error) => {
            console.error('[VideoUploadService] Upload failed:', error);
            reject(error);
          },
          async () => {
            try {
              console.log('[VideoUploadService] Getting download URL...');
              const videoUrl = await getDownloadURL(videoRef);
              console.log('[VideoUploadService] Download URL obtained:', videoUrl);

              // Show success message
              Alert.alert(
                'Published Successfully!',
                'Your video has been uploaded and is being processed.',
                [{ text: 'OK' }]
              );

              // Create video document
              const { scheduledTime, ...metadataWithoutScheduled } = metadata;
              const now = new Date();
              const videoData: VideoDocument = {
                ...metadataWithoutScheduled,
                videoUrl,
                thumbnailUrl: '', // Empty string for now
                creatorId: userId,
                createdAt: serverTimestamp(),
                localCreatedAt: now,
                status: 'published',
                views: 0,
                likes: 0,
                comments: 0,
                fileName,
                fileSize: fileInfo.size,
                mimeType,
                uploadTimestamp: timestamp,
                sections: {
                  forYou: true,
                  explore: true,
                },
                engagement: {
                  watchTime: 0,
                  completionRate: 0,
                  shareCount: 0,
                }
              };

              // Ensure visibility is set to public if not specified
              if (!videoData.visibility) {
                videoData.visibility = 'public';
              }

              if (metadata.visibility === 'scheduled' && scheduledTime) {
                videoData.scheduledTime = scheduledTime;
              }

              // Save to Firestore
              const docRef = doc(firestoreInstance, 'videos', `${userId}_${timestamp}`);
              await setDoc(docRef, videoData);
              console.log('[VideoUploadService] Video data saved to Firestore:', {
                docId: docRef.id,
                status: videoData.status,
                visibility: videoData.visibility,
                hasVideoUrl: !!videoData.videoUrl
              });

              // Set final progress
              onProgress?.(100);

              resolve({ success: true, videoUrl });
            } catch (error) {
              console.error('[VideoUploadService] Error completing upload:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error: any) {
      console.error('[VideoUploadService] Video upload failed:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  saveDraft: async (
    metadata: VideoMetadata,
    userId: string
  ) => {
    try {
      // Check if user is authenticated and get current user
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to save drafts');
        throw new Error('User must be logged in to save drafts');
      }

      // Ensure we have a valid userId
      const actualUserId = userId || currentUser.uid;
      if (!actualUserId) {
        Alert.alert('Error', 'Could not determine user ID');
        throw new Error('Invalid user ID');
      }

      const draftData = {
        ...metadata,
        creatorId: actualUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft',
      };

      await setDoc(doc(firestoreInstance, 'drafts', `${actualUserId}_${Date.now()}`), draftData);
      Alert.alert('Success', 'Draft saved successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft: ' + error.message);
      throw error;
    }
  },

  generateThumbnailForVideo: async (videoUrl: string, userId: string): Promise<string> => {
    return VideoThumbnailService.generateThumbnail(videoUrl, userId);
  },

  updateMissingThumbnails: async (userId: string) => {
    try {
      // Query videos without thumbnails
      const videosRef = collection(firestoreInstance, 'videos');
      const q = query(
        videosRef,
        where('creatorId', '==', userId),
        where('thumbnailUrl', '==', '')
      );

      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoWithId[];

      console.log(`Found ${videos.length} videos without thumbnails`);

      // Process each video
      for (const video of videos) {
        try {
          if (!video.videoUrl) continue;

          console.log(`Generating thumbnail for video: ${video.id}`);
          const thumbnailUrl = await VideoUploadService.generateThumbnailForVideo(video.videoUrl, userId);

          // Update the video document with the new thumbnail URL
          const videoRef = doc(firestoreInstance, 'videos', video.id);
          await updateDoc(videoRef, {
            thumbnailUrl
          });

          console.log(`Updated thumbnail for video: ${video.id}`);
        } catch (error) {
          console.error(`Error processing video ${video.id}:`, error);
          // Continue with next video even if one fails
          continue;
        }
      }

      return {
        success: true,
        processed: videos.length
      };
    } catch (error) {
      console.error('Error updating missing thumbnails:', error);
      throw error;
    }
  }
}; 