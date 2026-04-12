/**
 * Notifications Routes
 * Get user notifications
 */

import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Get user notifications
 * GET /api/notifications
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('🔔 [Notification] User ID:', userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Simple find without populate first
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log('🔔 [Notification] Found:', notifications.length, 'notifications');

    // Populate in parallel with Promise.all for better performance
    const populatedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        try {
          // Get actor
          const actor = await User.findById(notif.actor).select('name avatar').lean();
          
          // Get post
          const post = await Post.findById(notif.post).select('title').lean();
          
          // Get comment (optional)
          let comment = null;
          if (notif.comment) {
            comment = await Comment.findById(notif.comment).select('_id author').lean();
          }

          return {
            ...notif,
            actor: actor || { name: 'مستخدم', avatar: null },
            post: post || { title: 'منشور محذوف' },
            comment: comment || null
          };
        } catch (error) {
          console.error('🔔 [Notification] Populate error:', error.message);
          return notif;
        }
      })
    );

    const total = await Notification.countDocuments({ recipient: userId });

    res.json({
      notifications: populatedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('🔔 [Notification] Error:', error);
    res.status(500).json({ message: 'Failed to load notifications', error: error.message });
  }
});

/**
 * Get unread notifications count
 * GET /api/notifications/unread/count
 */
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Mark all notifications as read
 * PUT /api/notifications
 */
router.put('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
