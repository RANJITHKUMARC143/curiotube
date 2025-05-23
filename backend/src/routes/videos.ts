import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

// Get all videos
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const snapshot = await db.ref('/videos').once('value');
    const videos = snapshot.val() || {};
    res.json(Object.values(videos));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get video by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const snapshot = await db.ref(`/videos/${req.params.id}`).once('value');
    const video = snapshot.val();
    
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new video
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, videoUrl, thumbnail, duration, category, tags } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const videoRef = db.ref('/videos').push();
    const newVideo = {
      id: videoRef.key,
      title,
      description,
      videoUrl,
      thumbnail,
      duration,
      category,
      tags,
      creator: userId,
      createdAt: Date.now(),
      likes: [],
      comments: []
    };

    await videoRef.set(newVideo);
    res.status(201).json(newVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update video
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const videoRef = db.ref(`/videos/${req.params.id}`);
    const snapshot = await videoRef.once('value');
    const video = snapshot.val();
    
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    
    if (video.creator !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    
    const updatedVideo = {
      ...video,
      ...req.body,
      updatedAt: Date.now()
    };
    
    await videoRef.update(updatedVideo);
    res.json(updatedVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete video
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const videoRef = db.ref(`/videos/${req.params.id}`);
    const snapshot = await videoRef.once('value');
    const video = snapshot.val();
    
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    
    if (video.creator !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    
    await videoRef.remove();
    res.json({ message: 'Video deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to video
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const videoRef = db.ref(`/videos/${req.params.id}`);
    const snapshot = await videoRef.once('value');
    const video = snapshot.val();
    
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    
    const newComment = {
      id: db.ref().push().key,
      text: req.body.text,
      user: userId,
      createdAt: Date.now()
    };
    
    const comments = [...(video.comments || []), newComment];
    await videoRef.update({ comments });
    
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike video
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const videoRef = db.ref(`/videos/${req.params.id}`);
    const snapshot = await videoRef.once('value');
    const video = snapshot.val();
    
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    
    const likes = video.likes || [];
    const likeIndex = likes.indexOf(userId);
    
    if (likeIndex === -1) {
      likes.push(userId);
    } else {
      likes.splice(likeIndex, 1);
    }
    
    await videoRef.update({ likes });
    res.json(likes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 