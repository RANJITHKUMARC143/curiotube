import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Home: undefined;
  Explore: undefined;
  Upload: undefined;
  Live: undefined;
  Profile: undefined;
};

type NavigationProp = BottomTabNavigationProp<RootStackParamList, 'Home'>;

const TopNavbar = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CurioTube</Text>
      <View style={styles.rightIcons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Explore')}
        >
          <Icon name="search-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="person-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000000',
    borderBottomWidth: 0,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
});

export default TopNavbar;