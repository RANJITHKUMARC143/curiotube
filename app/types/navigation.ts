export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Explore: undefined;
  Upload: undefined;
  Live: undefined;
  Profile: undefined;
  Settings: undefined;
  Preview: {
    video: {
      videoUri: string;
      title: string;
      description: string;
      thumbnail: string | null;
      videoId: string;
      creatorId: string;
      creatorName: string;
      creatorAvatar: string;
    }
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 