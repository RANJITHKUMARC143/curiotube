import { ImagePickerAsset } from 'expo-image-picker';

// Mock AI service for topic suggestions
export const AIService = {
  suggestTopic: async (videoUri: string): Promise<string> => {
    // In a real implementation, this would call an AI API
    // For now, we'll return mock suggestions based on the video length
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock topics based on different categories
      const topics = [
        'Technology & Innovation',
        'Entertainment & Pop Culture',
        'Education & Learning',
        'Lifestyle & Wellness',
        'Business & Finance',
        'Science & Research',
        'Art & Creativity',
        'Sports & Fitness',
        'Travel & Adventure',
        'Food & Cooking'
      ];
      
      // Randomly select a topic
      const randomIndex = Math.floor(Math.random() * topics.length);
      return topics[randomIndex];
    } catch (error) {
      console.error('AI topic suggestion failed:', error);
      return 'AI suggestion failed. Please enter a topic manually.';
    }
  },

  // Additional AI features can be added here
  suggestTitle: async (videoUri: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'Engaging Video Title';
  },

  suggestDescription: async (videoUri: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'This video explores interesting content that will captivate your audience.';
  },

  suggestTags: async (videoUri: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return ['trending', 'viral', 'entertainment', 'education'];
  }
}; 