/**
 * Post Routes
 * CRUD operations for articles, research papers, and quotes
 */

import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/**
 * GET /api/posts
 * Get all posts with optional filtering and pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      page = 1, 
      limit = 10, 
      sort = '-createdAt',
      search,
      featured,
      author
    } = req.query;

    // Build query
    const query = { published: true };
    
    if (category) {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (author) {
      query.author = author;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name avatar'),
      Post.countDocuments(query)
    ]);

    // Add user's like status if authenticated
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = req.user ? post.likes.includes(req.user._id) : false;
      postObj.likeCount = post.likes.length;
      return postObj;
    });

    res.json({
      posts: postsWithLikeStatus,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

/**
 * GET /api/posts/:id
 * Get single post by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar bio');

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Increment view count only once per session
    const clientSessionId = req.query.sessionId || req.headers['x-session-id'];
    
    // Track views in sessionStorage on client - server always increments
    // Initialize views to 0 if undefined
    if (post.views === undefined || post.views === null) {
      post.views = 0;
    }
    
    // Always increment views when sessionId is provided (client is tracking views)
    if (clientSessionId) {
      post.views += 1;
      await post.save();
    }

    // Get comments for this post
    const comments = await Comment.find({ post: post._id, parentComment: null })
      .populate('author', 'name avatar')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'name avatar' }
      })
      .sort('-createdAt');

    const postObj = post.toObject();
    postObj.isLiked = req.user ? post.likes.includes(req.user._id) : false;
    postObj.likeCount = post.likes.length;
    postObj.comments = comments;
    postObj.commentCount = await Comment.countDocuments({ post: post._id });

    res.json({ post: postObj });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    
    res.status(500).json({ message: 'Failed to fetch post.' });
  }
});

/**
 * POST /api/posts
 * Create a new post (Admin only)
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      excerpt, 
      quoteAuthor, 
      abstract, 
      keywords,
      coverImage,
      published,
      featured
    } = req.body;

    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required.' });
    }

    // Validate category
    if (!['Article', 'Research', 'Quote'].includes(category)) {
      return res.status(400).json({ message: 'Category must be Article, Research, or Quote.' });
    }

    const post = new Post({
      title,
      content,
      category,
      excerpt: excerpt || content.substring(0, 200) + '...',
      quoteAuthor: category === 'Quote' ? quoteAuthor : null,
      abstract: category === 'Research' ? abstract : null,
      keywords: keywords || [],
      coverImage,
      published: published !== false,
      featured: featured === true,
      author: req.user._id,
      authorName: req.user.name
    });

    await post.save();

    res.status(201).json({
      message: 'Post created successfully.',
      post
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    
    res.status(500).json({ message: 'Failed to create post.' });
  }
});

/**
 * PUT /api/posts/:id
 * Update a post (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      excerpt, 
      quoteAuthor, 
      abstract, 
      keywords,
      coverImage,
      published,
      featured
    } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (excerpt) post.excerpt = excerpt;
    if (quoteAuthor !== undefined) post.quoteAuthor = quoteAuthor;
    if (abstract !== undefined) post.abstract = abstract;
    if (keywords) post.keywords = keywords;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (published !== undefined) post.published = published;
    if (featured !== undefined) post.featured = featured;

    await post.save();

    res.json({
      message: 'Post updated successfully.',
      post
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    
    res.status(500).json({ message: 'Failed to update post.' });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

/**
 * POST /api/posts/:id/like
 * Toggle like on a post
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Add like
      post.likes.push(userId);
      
      // Create notification for post author only if not the user themselves
      if (post.author.toString() !== userId.toString()) {
        const categoryLabel = {
          'Article': 'المقال',
          'Research': 'البحث',
          'Quote': 'الاقتباس'
        }[post.category] || 'المنشور';
        
        try {
          await Notification.create({
            recipient: post.author,
            actor: userId,
            type: 'like',
            post: post._id,
            message: `أعجب بـ${categoryLabel}: "${post.title}"`
          });
        } catch (notifError) {
          // Notification creation failed, but continue with post like
        }
      }
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
      
      // Delete notification when unliking
      try {
        await Notification.deleteOne({
          recipient: post.author,
          actor: userId,
          type: 'like',
          post: post._id
        });
      } catch (delError) {
        // Continue even if notification deletion fails
      }
    }

    await post.save();

    res.json({
      message: likeIndex === -1 ? 'Post liked.' : 'Post unliked.',
      isLiked: likeIndex === -1,
      likeCount: post.likes.length
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    
    res.status(500).json({ message: 'Failed to like post.' });
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics (Admin only)
 */
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get counts for each category
    const totalPosts = await Post.countDocuments({});
    const articles = await Post.countDocuments({ category: 'Article' });
    const research = await Post.countDocuments({ category: 'Research' });
    const quotes = await Post.countDocuments({ category: 'Quote' });
    
    // Calculate total likes and views
    const likesData = await Post.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $cond: [{ $isArray: '$likes' }, { $size: '$likes' }, 0] } }
        }
      }
    ]);
    
    const viewsData = await Post.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$views' }
        }
      }
    ]);
    
    const totalComments = await Comment.countDocuments({});

    res.json({
      stats: {
        totalPosts,
        articles: articles || 0,
        research: research || 0,
        quotes: quotes || 0,
        totalLikes: likesData[0]?.total || 0,
        totalViews: viewsData[0]?.total || 0,
        totalComments: totalComments || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

/**
 * GET /api/posts/admin/all
 * Get all posts including unpublished (Admin only)
 */
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;

    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name'),
      Post.countDocuments(query)
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
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
})

export default router;
