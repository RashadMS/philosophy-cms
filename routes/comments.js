/**
 * Comment Routes
 * CRUD operations for comments on posts
 */

import express from 'express';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { createCommentNotification, deleteCommentNotifications } from '../lib/notifications.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/comments/post/:postId
 * Get all comments for a specific post (with nested replies)
 */
router.get('/post/:postId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Recursive function to populate nested replies
    async function populateReplies(comment) {
      if (!comment.replies || comment.replies.length === 0) {
        return comment;
      }
      
      // Get all replies and populate their author
      await Comment.populate(comment.replies, { path: 'author', select: 'name avatar' });
      
      // Recursively populate replies of replies
      for (let reply of comment.replies) {
        await reply.populate({
          path: 'replies',
          populate: { path: 'author', select: 'name avatar' },
          options: { sort: { createdAt: 1 } }
        });
        await populateReplies(reply);
      }
      
      return comment;
    }

    // Get top-level comments (no parent)
    let comments = await Comment.find({ post: req.params.postId, parentComment: null })
      .populate('author', 'name avatar')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'name avatar' },
        options: { sort: { createdAt: 1 } }
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    // Populate all nested replies recursively
    for (let comment of comments) {
      await populateReplies(comment);
    }

    const total = await Comment.countDocuments({ post: req.params.postId, parentComment: null });

    res.json({
      comments,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments.' });
  }
});

/**
 * POST /api/comments
 * Create a new comment
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and post ID are required.' });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // If replying, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found.' });
      }
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Populate author info before sending response
    await comment.populate('author', 'name avatar');
    
    // Populate post info for notification
    await comment.populate('post', 'author title');
    
    // Create notification
    if (parentCommentId) {
      // If this is a reply, notify the parent comment author
      const parentComment = await Comment.findById(parentCommentId).populate('author');
      if (parentComment && parentComment.author._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parentComment.author._id,
          actor: req.user._id,
          type: 'comment',
          post: postId,
          comment: comment._id,
          message: `رد على تعليقك`
        });
      }
    } else {
      // If this is a top-level comment, notify the post author
      await createCommentNotification(comment);
    }

    res.status(201).json({
      message: 'Comment posted successfully.',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    
    res.status(500).json({ message: 'Failed to post comment.' });
  }
});

/**
 * PUT /api/comments/:id
 * Update a comment (only by author)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required.' });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Check ownership (unless admin)
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You can only edit your own comments.' });
    }

    comment.content = content;
    comment.edited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate('author', 'name avatar');

    res.json({
      message: 'Comment updated successfully.',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Comment not found.' });
    }
    
    res.status(500).json({ message: 'Failed to update comment.' });
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment (by author or admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Check ownership (unless admin)
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: comment._id });

    // Delete notifications related to this comment
    await deleteCommentNotifications(comment._id);

    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Comment not found.' });
    }
    
    res.status(500).json({ message: 'Failed to delete comment.' });
  }
});

/**
 * POST /api/comments/:id/like
 * Toggle like on a comment
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const userId = req.user._id;
    const likeIndex = comment.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Add like
      comment.likes.push(userId);
      
      // Create notification only if not the comment author
      if (comment.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: comment.author,
          actor: userId,
          type: 'like',
          post: comment.post,
          comment: comment._id,
          message: `أعجب بتعليقك`
        });
      }
    } else {
      // Remove like
      comment.likes.splice(likeIndex, 1);
      
      // Delete notification when unliking
      await Notification.findOneAndDelete({
        recipient: comment.author,
        actor: userId,
        type: 'like',
        comment: comment._id
      });
    }

    await comment.save();

    res.json({
      message: likeIndex === -1 ? 'Comment liked.' : 'Comment unliked.',
      isLiked: likeIndex === -1,
      likeCount: comment.likes.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Comment not found.' });
    }
    
    res.status(500).json({ message: 'Failed to like comment.' });
  }
});

export default router;
