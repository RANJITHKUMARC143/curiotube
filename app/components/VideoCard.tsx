import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from '../types';
import { formatDuration, formatViews, formatTimeAgo } from '../utils/formatters';

// Default avatar as a data URI
const DEFAULT_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFyWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDMtMTlUMTU6NDc6NDctMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMTlUMTU6NDc6NDctMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAzLTE5VDE1OjQ3OjQ3LTA0OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDlkMWE1LTFjMzYtNDFhZC1hOTM2LTQ2NDM2OTI5OTU2YiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjEyMzQ1Njc4LTlhYmMtZGVmMC0xMjM0LTU2Nzg5YWJjZGVmMCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjEyMzQ1Njc4LTlhYmMtZGVmMC0xMjM0LTU2Nzg5YWJjZGVmMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyMzQ1Njc4LTlhYmMtZGVmMC0xMjM0LTU2Nzg5YWJjZGVmMCIgc3RFdnQ6d2hlbj0iMjAyNC0wMy0xOVQxNTo0Nzo0Ny0wNDowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+7B6CkAAAA0BJREFUaIHtmE1IVFEUx3/3vWk0GkcbR8tGE4uIoKDIjwgqWkWLNhUtjaB1RauIFi0igyAiIoMWQdCHBhVF9LFoEUVFUUHQxiIIKhJpUYkfNc44Oc28uS3mzbw3vvdm3sy8Z2H+4cJ9957zP+fce+4591xFKYUVlFLtwHGgDagFVgNVQDGQBaaAz8Aw8BR4KKV8b8VfXlBKWW4icgl4DyhDTQK3gVojPpTpQEp5Tkr5A/CCvAF8Ai4CjcAKoAioBnYAfcA4MAmMAheklEXGfVkVoJQ6CvQDi4EfQC9wQ0r51sDGBuAUcBZYBswAp6WUN435syNAKbUBGARKgSfAfinlF6v2gIhSYB9wH1gCvAS2SSm/2/Fpy6lSqgS4i078KnDQTuKzIaX8CRwC7gAVwG2lVLFdv3YjcBZoBr4CO6WUH+wmno+U8hdwGHgG1AGX7Pq2LEAptRo4D8wCh6SUk3aTNkJK+Rc4AfwFziilGu34tRyBXJV5ACwFrkspn9tJ1gxSylfADWARcF8pVWrVp50q1IHu7Y9IKW9ZTdIGzqF7/05gn1WHlgQopZqBPcAUcMVqgnbI9f7ruUrXYNWv1QhcRDf0t1LKMauJ2UVK+QS4i65IZ636NRWglNoO7ATSwA2rCTnkOrqN7FZKrTXrxGwELuX+35VSfnOQmG2klO+AR+iyf8qsH0MBSqktwE7gD3DTaVIOuQUo4IBZeXYjcBFdPu9KKb84Tcoh/egBrVMpVWlUmK0IpVQNcBj9KO1xI6tcxRkBSoD9RuXZjcBRoBR4JqV84UZWOe4BaaBDKVVuVJBRBJRSZcBR9KNkKzOXkFJOAY/RY0GrUVlmEWgHVgIfpJTPXE0thwRmoYeVZqNCjARsy/1/4G5eAQ+BKqDNqACjCGxGj/+DLieVxwD6EbI8AkqpCqAe+C2lfON+XgAMoR+hjUqpRbMLsxuBBvQ4MBKGAICUchyYQFekdXMvzRaBWiADvA4rMYJq9AQ0PvfCbAHVwE8pZSbkxABW5v5/zr0wW0AlMB1yUnMxgf4R1My9YLYjTwJlYWY0F1LKDPAb/RObxWwBk0AiV4VCR+7X2iSwbO6F2QK+A6VKqaKQk5uLMvQvt19nXzAS8BaozZXV0JH7pTYKvJt7Ybb/B94DG5RSFSEnB4BSqg7YALyQUk7PvvYPnpxjC8xQxjsAAAAASUVORK5CYII=';

interface VideoCardProps {
  video: Video;
  style?: any;
  onPress?: () => void;
  focusMode?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, style, onPress, focusMode = false }) => {
  // Handle missing data with defaults
  const {
    title = 'Untitled Video',
    thumbnailUrl,
    thumbnail,
    duration = '0:00',
    views = 0,
    creatorUsername = 'Unknown Creator',
    creatorAvatar,
    createdAt
  } = video;

  // Validate thumbnail URL
  const validThumbnailUrl = thumbnailUrl || thumbnail || DEFAULT_AVATAR;
  const validCreatorAvatar = creatorAvatar || DEFAULT_AVATAR;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        style,
        focusMode && styles.focusModeContainer
      ]}
      onPress={onPress}
    >
      <View style={styles.thumbnailContainer}>
        {video.status === 'live' && (
          <View style={styles.liveBadgeContainer}>
            <View style={styles.liveBanner}>
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
          </View>
        )}
        <Image 
          source={{ uri: validThumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
          defaultSource={{ uri: DEFAULT_AVATAR }}
        />
        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.creatorInfo}>
          {!focusMode && (
            <Image 
              source={{ uri: validCreatorAvatar }}
              style={styles.profilePic}
              defaultSource={{ uri: DEFAULT_AVATAR }}
            />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.creatorName}>{creatorUsername}</Text>
            <Text style={styles.metadata}>
              {formatViews(views)} • {formatTimeAgo(createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  focusModeContainer: {
    backgroundColor: '#000000',
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16/9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
  },
  durationContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  duration: {
    color: '#fff',
    fontSize: 12,
  },
  content: {
    padding: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  creatorName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  metadata: {
    color: '#aaa',
    fontSize: 12,
  },
  liveBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  liveBanner: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default VideoCard; 