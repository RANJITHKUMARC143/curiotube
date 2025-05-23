export interface User {
  _id: string;
  name: string;
  username?: string;
  bio?: string;
  email: string;
  profilePic: string;
  followers: number;
  following: number;
  videos: number;
  earnings: number;
  challenges: number;
  interests: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  videoPath?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  duration?: string | number;
  views?: number;
  likes?: number;
  comments?: number;
  creatorId: string;
  creatorUsername?: string;
  creatorAvatar?: string;
  status: 'draft' | 'processing' | 'published' | 'live' | 'failed';
  visibility?: 'public' | 'private' | 'unlisted' | 'subscribers' | 'scheduled';
  category?: string;
  topic?: string;
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  scheduledTime?: string | Date | null;
  isMonetized?: boolean;
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
} 