/**
 * Comment Model
 * Defines the schema for user comments on posts
 */

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  // For nested comments (replies)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // Likes on comments
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Edit tracking
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

// Index for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Ensure virtuals are included
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
