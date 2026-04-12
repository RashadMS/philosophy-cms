/**
 * User Routes
 * Admin user management endpoints
 */

import express from 'express';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (Admin only)
 */
router.put('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['Admin', 'User'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (Admin or User).' });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role !== 'Admin') {
      return res.status(400).json({ message: 'You cannot change your own admin role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'User role updated successfully.',
      user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.status(500).json({ message: 'Failed to update user role.' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

/**
 * GET /api/users/profile
 * Get current user's profile (requires authentication)
 */
router.get('/profile/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile (name, bio, avatar)
 */
router.put('/profile/me', authenticate, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updateData = {};

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
      }
      if (name.length > 50) {
        return res.status(400).json({ message: 'Name cannot exceed 50 characters.' });
      }
      updateData.name = name.trim();
    }

    // Validate bio if provided
    if (bio !== undefined) {
      if (bio.length > 500) {
        return res.status(400).json({ message: 'Bio cannot exceed 500 characters.' });
      }
      updateData.bio = bio.trim();
    }

    // Validate avatar if provided
    if (avatar !== undefined) {
      // Avatar should be a data URL (base64 image) or URL
      if (avatar && !avatar.startsWith('data:image') && !avatar.startsWith('http')) {
        return res.status(400).json({ message: 'Invalid avatar format.' });
      }
      updateData.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

/**
 * GET /api/users/me/comments
 * Get current user's comments
 */
router.get('/me/comments', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const Comment = (await import('../models/Comment.js')).default;

    const [comments, total] = await Promise.all([
      Comment.find({ author: req.user._id })
        .populate({
          path: 'author',
          select: 'name avatar',
          model: 'User'
        })
        .populate({
          path: 'post',
          select: 'title _id',
          model: 'Post'
        })
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Comment.countDocuments({ author: req.user._id })
    ]);

    res.json({
      comments,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments.' });
  }
});

/**
 * GET /api/users/me/likes
 * Get posts that current user has liked
 */
router.get('/me/likes', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const Post = (await import('../models/Post.js')).default;

    const [posts, total] = await Promise.all([
      Post.find({ likes: req.user._id, published: true })
        .populate('author', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Post.countDocuments({ likes: req.user._id, published: true })
    ]);

    res.json({
      posts,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch liked posts.' });
  }
});

export default router;
