export interface VideoMetadata {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility: 'public' | 'private' | 'subscribers' | 'scheduled';
  scheduledTime?: Date;
  thumbnail?: Blob;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
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
  status?: 'draft' | 'processing' | 'published' | 'live' | 'failed';
  visibility?: 'public' | 'private' | 'unlisted';
  category?: string;
  topic?: string;
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  scheduledTime?: Date | null;
}

export interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  creatorId: string;
}

export interface Creator {
  id: string;
  name: string;
  subscribers: string;
  avatar: string;
  isSubscribed: boolean;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  duration: number;
  position: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
} 