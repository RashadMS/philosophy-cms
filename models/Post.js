/**
 * Post Model
 * Defines the schema for articles, research papers, and quotes
 */

import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Article', 'Research', 'Quote']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  // For quotes: the person who said the quote
  quoteAuthor: {
    type: String,
    default: null
  },
  // For research papers: additional metadata
  abstract: {
    type: String,
    default: null
  },
  keywords: [{
    type: String,
    trim: true
  }],
  // Array of user IDs who liked this post
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // View count
  views: {
    type: Number,
    default: 0
  },
  // Publication status
  published: {
    type: Boolean,
    default: true
  },
  // Featured post flag
  featured: {
    type: Boolean,
    default: false
  },
  // Cover image URL
  coverImage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count (populated separately)
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Index for better search performance
postSchema.index({ title: 'text', content: 'text', keywords: 'text' });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ author: 1 });

// Ensure virtuals are included in JSON output
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model('Post', postSchema);

export default Post;
