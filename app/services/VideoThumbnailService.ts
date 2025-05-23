import * as FileSystem from 'expo-file-system';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storageInstance, authInstance } from '../config/firebase';
import * as ImageManipulator from 'expo-image-manipulator';

export const VideoThumbnailService = {
  generateThumbnail: async (videoUrl: string, userId: string): Promise<string> => {
    try {
      // Check authentication state
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to generate thumbnails');
      }

      // Create a unique filename for the thumbnail
      const timestamp = Date.now();
      const thumbnailFileName = `thumbnail_${timestamp}.jpg`;

      // Download the video file to a temporary location
      const tempVideoPath = `${FileSystem.cacheDirectory}temp_video_${timestamp}.mp4`;
      await FileSystem.downloadAsync(videoUrl, tempVideoPath);

      // Use a default thumbnail for now
      // In a real app, you would use a native module to extract a frame from the video
      const defaultThumbnailUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';
      
      // Download the default thumbnail
      const tempThumbnailPath = `${FileSystem.cacheDirectory}temp_thumbnail_${timestamp}.jpg`;
      await FileSystem.downloadAsync(defaultThumbnailUrl, tempThumbnailPath);

      // Manipulate the image if needed
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        tempThumbnailPath,
        [{ resize: { width: 640, height: 360 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read the thumbnail file
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      // Upload the thumbnail
      const thumbnailRef = ref(storageInstance, `thumbnails/${userId}/${thumbnailFileName}`);
      const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          uploadedBy: currentUser.uid,
          originalFileName: thumbnailFileName,
          timestamp: timestamp.toString()
        }
      });

      const thumbnailUrl = await new Promise<string>((resolve, reject) => {
        thumbnailUploadTask.on(
          'state_changed',
          null,
          reject,
          async () => {
            try {
              const url = await getDownloadURL(thumbnailRef);
              resolve(url);
            } catch (error) {
              reject(error);
            }
          }
        );
      });

      // Clean up temporary files
      await FileSystem.deleteAsync(tempVideoPath);
      await FileSystem.deleteAsync(tempThumbnailPath);
      await FileSystem.deleteAsync(manipulatedImage.uri);

      return thumbnailUrl;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Use a default thumbnail if generation fails
      return 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';
    }
  }
}; 