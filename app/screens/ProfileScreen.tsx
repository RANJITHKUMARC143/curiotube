import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';

// Define the root stack param list
type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  MainTabs: undefined;
  EditProfile: undefined;
};

// Use NativeStackNavigationProp directly
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Welcome to CurioTube</Text>
          <Text style={styles.subtitle}>Sign in to access your profile and upload videos</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.registerButton]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.buttonText, styles.registerButtonText]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image 
            source={{ uri: user.profilePic || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage}
          />
          <Text style={styles.username}>{user.name}</Text>
          {user.username && <Text style={styles.handle}>@{user.username}</Text>}
          <Text style={styles.email}>{user.email}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.videos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>

        <View style={styles.extraStatsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.challenges}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
        </View>

        {user.interests && user.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsList}>
              {user.interests.map((interest, idx) => (
                <Text key={idx} style={styles.interestTag}>{interest}</Text>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.joinedDate}>
          Joined: {moment(user.createdAt).format('MMMM YYYY')}
        </Text>

        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  registerButtonText: {
    color: '#FF0000',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  handle: {
    fontSize: 14,
    color: '#FF0000',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666666',
  },
  bio: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  extraStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  interestsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#1C1C1E',
    color: '#FF0000',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
  },
  joinedDate: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  editProfileButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 40,
    marginTop: 10,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 