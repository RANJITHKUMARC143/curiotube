export const formatViews = (views: number): string => {
  if (!views) return '0 views';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M watching`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K watching`;
  }
  return `${views} watching`;
};

export const formatDuration = (duration: string | number): string => {
  if (!duration) return '0:00';
  
  // If duration is already in MM:SS format, return as is
  if (typeof duration === 'string' && /^\d{1,2}:\d{2}$/.test(duration)) {
    return duration;
  }

  // Convert to seconds if it's not already
  const seconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  if (isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatTimeAgo = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  const now = new Date();
  const timestamp = date instanceof Date ? date : new Date(date);
  
  if (isNaN(timestamp.getTime())) {
    return '';
  }

  const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}; 