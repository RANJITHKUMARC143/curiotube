import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

interface ExploreItem {
  id: string;
  image: string;
  likes: number;
  isVideo: boolean;
}

const CATEGORIES = [
  'All',
  'Live',
  'Gaming',
  'Music',
  'Education',
  'Tech',
  'Travel',
  'Fitness',
];

const DUMMY_DATA: ExploreItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: i.toString(),
  image: `https://picsum.photos/400/400?random=${i}`,
  likes: Math.floor(Math.random() * 10000),
  isVideo: Math.random() > 0.5,
}));

const ExploreScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const renderItem: ListRenderItem<ExploreItem> = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        { height: index % 3 === 0 ? ITEM_WIDTH * 2 : ITEM_WIDTH },
      ]}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      {item.isVideo && (
        <View style={styles.videoIndicator}>
          <Icon name="play" size={16} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.statsContainer}>
        <Icon name="heart" size={12} color="#FFFFFF" />
        <Text style={styles.statsText}>
          {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#FFFFFF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#8E8E93"
          selectionColor="#FFFFFF"
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContentContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={DUMMY_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContentContainer: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
  },
  selectedCategory: {
    backgroundColor: '#4A90E2',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 1,
  },
  gridItem: {
    width: ITEM_WIDTH,
    padding: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ExploreScreen; 