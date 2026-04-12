/**
 * Notification Utility
 * Helper functions for creating notifications
 */

import Notification from '../models/Notification.js';

/**
 * Create a notification
 */
export async function createNotification(data) {
  try {
    // Don't notify the user about their own actions
    if (data.recipient.toString() === data.actor.toString()) {
      return null;
    }

    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
}

/**
 * Create comment notification
 */
export async function createCommentNotification(comment) {
  try {
    const notification = await createNotification({
      recipient: comment.post.author,
      actor: comment.author,
      type: 'comment',
      post: comment.post._id,
      comment: comment._id,
      message: `تعليق جديد على "${comment.post.title}"`
    });
    return notification;
  } catch (error) {
    console.error('Error creating comment notification:', error.message);
    return null;
  }
}

/**
 * Create like notification
 */
export async function createLikeNotification(like) {
  try {
    const notification = await createNotification({
      recipient: like.post.author,
      actor: like.user,
      type: 'like',
      post: like.post._id,
      message: `أعجب بمنشورك: "${like.post.title}"`
    });
    return notification;
  } catch (error) {
    console.error('Error creating like notification:', error.message);
    return null;
  }
}

/**
 * Delete related notifications when comment is deleted
 */
export async function deleteCommentNotifications(commentId) {
  try {
    await Notification.deleteMany({ comment: commentId });
  } catch (error) {
    console.error('Error deleting comment notifications:', error.message);
  }
}

export default {
  createNotification,
  createCommentNotification,
  createLikeNotification,
  deleteCommentNotifications
};
