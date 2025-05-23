import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { VideoService } from '../services/videoService';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { firestoreInstance } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

interface VideoStats {
  total: number;
  public: number;
  private: number;
  subscribers: number;
  published: number;
}

interface TestResult {
  success: boolean;
  documentsFound?: number;
  constrainedDocumentsFound?: number;
  hasDocuments?: boolean;
  isAuthenticated?: boolean;
  error?: string;
  timestamp: string;
  code?: string;
  videoStats?: VideoStats;
}

const FirestoreTest = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[FirestoreTest] Starting connection test...');
      
      // First try to get all videos without constraints
      console.log('[FirestoreTest] Checking videos collection...');
      const videosRef = collection(firestoreInstance, 'videos');
      const allVideosSnapshot = await getDocs(query(videosRef));
      
      console.log('[FirestoreTest] All videos query result:', {
        empty: allVideosSnapshot.empty,
        size: allVideosSnapshot.size,
        metadata: allVideosSnapshot.metadata
      });

      const videoStats = {
        total: allVideosSnapshot.size,
        public: 0,
        private: 0,
        subscribers: 0,
        published: 0
      };

      if (allVideosSnapshot.empty) {
        console.log('[FirestoreTest] No videos found in the database');
      } else {
        console.log('[FirestoreTest] Found videos, processing each document...');
        allVideosSnapshot.forEach(doc => {
          const data = doc.data();
          console.log('[FirestoreTest] Video document:', {
            id: doc.id,
            status: data.status,
            visibility: data.visibility,
            createdAt: data.createdAt,
            title: data.title,
            creatorId: data.creatorId,
            hasVideoUrl: !!data.videoUrl,
            hasThumbnail: !!data.thumbnailUrl
          });
          
          if (data.status === 'published') videoStats.published++;
          if (data.visibility === 'public') videoStats.public++;
          else if (data.visibility === 'private') videoStats.private++;
          else if (data.visibility === 'subscribers') videoStats.subscribers++;
        });
      }

      // Now try the query with filters
      console.log('[FirestoreTest] Testing filtered query...');
      const filteredQuery = query(
        videosRef,
        where('status', '==', 'published'),
        where('visibility', '==', 'public')
      );
      const filteredSnapshot = await getDocs(filteredQuery);
      
      console.log('[FirestoreTest] Filtered query results:', {
        empty: filteredSnapshot.empty,
        size: filteredSnapshot.size,
        metadata: filteredSnapshot.metadata
      });

      if (!filteredSnapshot.empty) {
        console.log('[FirestoreTest] Found published & public videos:');
        filteredSnapshot.forEach(doc => {
          const data = doc.data();
          console.log({
            id: doc.id,
            title: data.title,
            creatorId: data.creatorId,
            createdAt: data.createdAt,
            hasVideoUrl: !!data.videoUrl,
            hasThumbnail: !!data.thumbnailUrl
          });
        });
      }

      setTestResult({
        success: true,
        documentsFound: videoStats.total,
        constrainedDocumentsFound: videoStats.public,
        hasDocuments: videoStats.total > 0,
        isAuthenticated: !!user,
        timestamp: new Date().toISOString(),
        videoStats
      });
    } catch (error) {
      console.error('[FirestoreTest] Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firestore Connection Test</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingText}>Testing connection...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={runTest}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : testResult ? (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, testResult.success ? styles.successText : styles.errorText]}>
            Connection Status: {testResult.success ? 'Success' : 'Failed'}
          </Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Authentication:</Text>
            <Text style={styles.infoValue}>
              {testResult.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Text>
            {user && (
              <Text style={styles.infoValue}>User ID: {user.uid}</Text>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Documents:</Text>
            <Text style={styles.infoValue}>
              Total Videos: {testResult.documentsFound || 0}
            </Text>
            <Text style={styles.infoValue}>
              Published & Public: {testResult.constrainedDocumentsFound || 0}
            </Text>
          </View>

          {testResult.videoStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.infoLabel}>Video Visibility:</Text>
              <Text style={styles.statText}>Public: {testResult.videoStats.public}</Text>
              <Text style={styles.statText}>Private: {testResult.videoStats.private}</Text>
              <Text style={styles.statText}>Subscribers: {testResult.videoStats.subscribers}</Text>
            </View>
          )}

          {testResult.error && (
            <View style={styles.errorDetail}>
              <Text style={styles.errorText}>Error Details:</Text>
              <Text style={styles.errorMessage}>{testResult.error}</Text>
              {testResult.code && (
                <Text style={styles.errorCode}>Code: {testResult.code}</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.retryButton} onPress={runTest}>
            <Text style={styles.retryButtonText}>Test Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    margin: 10,
  },
  resultContainer: {
    padding: 20,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#FF3B30',
  },
  infoContainer: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  statsContainer: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginVertical: 2,
  },
  errorDetail: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    marginVertical: 4,
  },
  errorCode: {
    color: '#FF3B30',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default FirestoreTest; 