import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VideoUploadService } from '../services/VideoUploadService';
import { useAuth } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Video } from '../types';
import * as FileSystem from 'expo-file-system';

type RootStackParamList = {
  MainTabs: undefined;
  Upload: undefined;
  Preview: {
    video: {
      videoUri: string;
      title: string;
      description: string;
      thumbnail: string | null;
      videoId: string;
      creatorId: string;
      creatorName: string;
      creatorAvatar: string | null;
    };
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const UploadScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<{
    uri: string;
    mimeType?: string;
    name?: string;
    size?: number;
    width?: number;
    height?: number;
  } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'subscribers' | 'scheduled'>('public');
  const [isMonetized, setIsMonetized] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [language, setLanguage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handlePickVideo = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your media library to upload videos.');
        return;
      }

      // Try ImagePicker first
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 1,
          videoMaxDuration: 600, // 10 minutes max
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          
          // Get file info
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (!fileInfo.exists) {
            throw new Error('File does not exist');
          }

          // Check file size (100MB limit)
          if (fileInfo.size > 100 * 1024 * 1024) {
            Alert.alert('Error', 'Video file is too large. Maximum size is 100MB');
            return;
          }

          setVideoFile({
            uri: asset.uri,
            name: asset.fileName || 'video.mp4',
            mimeType: 'video/mp4',
            size: fileInfo.size,
            width: asset.width,
            height: asset.height,
          });
          return;
        }
      } catch (err) {
        console.log('ImagePicker failed, falling back to DocumentPicker:', err);
      }

      // Fallback to DocumentPicker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size (100MB limit)
        if (asset.size > 100 * 1024 * 1024) {
          Alert.alert('Error', 'Video file is too large. Maximum size is 100MB');
          return;
        }

        setVideoFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (err) {
      console.error('Error picking video:', err);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const handleAISuggest = (field: string) => {
    Alert.alert('Coming Soon', 'AI suggestions will be available in a future update!');
  };

  const handleSaveDraft = async () => {
    if (!title || !user) {
      Alert.alert('Error', 'Please add a title before saving draft');
      return;
    }

    try {
      await VideoUploadService.saveDraft({
        title,
        description,
        topic,
        tags: tags.split(',').map(tag => tag.trim()),
        category,
        isMonetized,
        visibility,
        scheduledTime: visibility === 'scheduled' ? scheduledDate : undefined,
      }, user.uid);

      Alert.alert('Success', 'Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    }
  };

  const handlePreview = () => {
    if (!videoFile || !title) {
      Alert.alert('Error', 'Please select a video and add a title');
      return;
    }

    navigation.navigate('Preview', {
      video: {
        videoUri: videoFile.uri,
        title,
        description,
        thumbnail: null, // Will be generated during upload
        videoId: `preview-${Date.now()}`,
        creatorId: user?.uid || '',
        creatorName: user?.displayName || '',
        creatorAvatar: user?.photoURL || null,
      }
    });
  };

  const handleUpload = async () => {
    if (!videoFile || !title || !user) {
      Alert.alert('Error', 'Please select a video and add a title');
      return;
    }

    setIsUploading(true);
    try {
      console.log('[UploadScreen] Starting video upload:', {
        fileName: videoFile.name,
        fileSize: videoFile.size,
        mimeType: videoFile.mimeType,
        title,
        visibility,
        userId: user.uid
      });

      const metadata = {
        title,
        description,
        topic,
        tags: tags.split(',').map(tag => tag.trim()),
        category,
        isMonetized,
        visibility,
        scheduledTime: visibility === 'scheduled' ? scheduledDate : undefined,
      };

      const result = await VideoUploadService.uploadVideo(
        videoFile as any, // Type assertion needed due to different picker types
        metadata,
        user.uid,
        (progress) => {
          setUploadProgress(progress);
          console.log('[UploadScreen] Upload progress:', progress);
        }
      );

      console.log('[UploadScreen] Upload completed:', result);

      if (result.success && result.videoUrl) {
        // Set progress to 100% after successful upload
        setUploadProgress(100);
        
        // Reset all form fields
        setUploadProgress(0);
        setVideoFile(null);
        setTitle('');
        setDescription('');
        setTags('');
        setCategory('');
        setTopic('');
        setIsMonetized(false);
        setVisibility('public');
        // Navigate back
        navigation.goBack();
      } else {
        throw new Error('Upload completed but no video URL was returned');
      }
    } catch (error) {
      console.error('[UploadScreen] Upload failed:', error);
      setUploadProgress(0);
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload video. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload video</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Upload Area */}
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickVideo}>
            {videoFile ? (
              <View style={styles.uploadProgress}>
                <Icon name="cloud-upload-outline" size={40} color="#00A3FF" />
                <Text style={styles.uploadText}>{videoFile.name}</Text>
                {isUploading && (
                  <>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{uploadProgress}%</Text>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Icon name="cloud-upload-outline" size={40} color="#00A3FF" />
                <Text style={styles.uploadText}>Tap to select a video</Text>
                <Text style={styles.uploadSubtext}>MP4, MOV, AVI (max 100MB)</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#666666"
                value={title}
                onChangeText={setTitle}
              />
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => handleAISuggest('title')}
              >
                <Text style={styles.aiButtonText}>AI Suggest</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="#666666"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Topic"
                placeholderTextColor="#666666"
                value={topic}
                onChangeText={setTopic}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Tags (comma separated)"
                placeholderTextColor="#666666"
                value={tags}
                onChangeText={setTags}
              />
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => handleAISuggest('tags')}
              >
                <Text style={styles.aiButtonText}>AI Suggest</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor="#666666"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            {/* Visibility and Monetization */}
            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Visibility</Text>
                <View style={styles.toggleButtons}>
                  {(['public', 'private', 'subscribers', 'scheduled'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.toggleButton, visibility === option && styles.toggleButtonActive]}
                      onPress={() => setVisibility(option)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Monetization</Text>
                <View style={styles.toggleButtons}>
                  <TouchableOpacity
                    style={[styles.toggleButton, !isMonetized && styles.toggleButtonActive]}
                    onPress={() => setIsMonetized(false)}
                  >
                    <Text style={styles.toggleButtonText}>Off</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, isMonetized && styles.toggleButtonActive]}
                    onPress={() => setIsMonetized(true)}
                  >
                    <Text style={styles.toggleButtonText}>On</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Schedule */}
            {visibility === 'scheduled' && (
              <View style={styles.scheduleSection}>
                <Text style={styles.sectionLabel}>Schedule</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {scheduledDate.toLocaleString()}
                  </Text>
                  <Icon name="calendar-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setScheduledDate(selectedDate);
                  }
                }}
              />
            )}

            {/* DubShorts AI */}
            <View style={styles.dubSection}>
              <Text style={styles.sectionLabel}>DubShorts AI</Text>
              <TouchableOpacity 
                style={styles.languageButton}
                onPress={() => Alert.alert('Coming Soon', 'DubShorts AI will be available soon!')}
              >
                <Text style={styles.languageButtonText}>Select Language</Text>
                <Icon name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveDraft}
            >
              <Text style={styles.buttonText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={handlePreview}
            >
              <Text style={styles.buttonText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishButton, isUploading && styles.publishButtonDisabled]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Publish Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadArea: {
    height: 200,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  uploadSubtext: {
    color: '#666666',
    marginTop: 8,
    fontSize: 14,
  },
  uploadProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A3FF',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
  formSection: {
    flex: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    marginRight: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#00A3FF',
    fontSize: 14,
  },
  toggleSection: {
    marginBottom: 24,
  },
  toggleRow: {
    marginBottom: 16,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  toggleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#00A3FF',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  scheduleSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  dubSection: {
    marginBottom: 24,
  },
  languageButton: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#00A3FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default UploadScreen;