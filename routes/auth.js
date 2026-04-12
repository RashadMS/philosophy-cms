/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

import express from 'express';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import { authenticate, generateToken } from '../middleware/auth.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../lib/email.js';
import { generateEmailVerificationToken, verifyTokenHash } from '../lib/tokens.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user and send verification email
 * User data is stored temporarily until email verification
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists in verified users
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Check if pending registration exists
    const existingPending = await PendingUser.findOne({ email: email.toLowerCase() });
    if (existingPending) {
      return res.status(400).json({ message: 'A registration is already pending for this email. Check your inbox or request a new verification email.' });
    }

    // Generate email verification token
    const { token, hash, expires } = generateEmailVerificationToken();

    // Create pending user (temporary storage until verification)
    const pendingUser = new PendingUser({
      name,
      email: email.toLowerCase(),
      password,
      bio: bio || '',
      emailVerificationToken: hash, // Store hash, not plain token
      emailVerificationExpires: expires
    });

    await pendingUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, token, name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Delete pending user if email sending failed
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(500).json({ 
        message: 'Registration failed. Email configuration error. Please try again later.' 
      });
    }

    res.status(201).json({
      message: 'Registration successful! Check your email to verify your account. The verification link is valid for 24 hours.',
      email: pendingUser.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `This ${field} is already registered. Please log in or use another ${field}.` });
    }
    
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token (requires verified email)
 * Only verified users in User collection can log in
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      // Check if there's a pending registration
      const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
      if (pendingUser) {
        return res.status(403).json({ 
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          email: pendingUser.email,
          requiresVerification: true
        });
      }
      
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

/**
 * GET /api/auth/verify-email?token=TOKEN
 * Verify user's email address and create permanent user account
 * Moves data from PendingUser to User collection
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    // Find pending user with matching verification token
    const pendingUser = await PendingUser.findOne({
      emailVerificationToken: { $ne: null },
      emailVerificationExpires: { $gt: new Date() }
    }).select('+password');

    if (!pendingUser) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token. Please register again.' 
      });
    }

    // Verify token hash
    if (!verifyTokenHash(token, pendingUser.emailVerificationToken)) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token. Please register again.' 
      });
    }

    // Check if already belongs to a verified user
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      // Delete the pending user
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(200).json({ 
        message: 'Email already verified. You can now log in.',
        verified: true
      });
    }

    // Create verified user from pending user data
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed in PendingUser
      bio: pendingUser.bio,
      role: 'User',
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      avatar: null
    });

    // Save directly without hashing again (password already hashed in pending user)
    await newUser.collection.insertOne(newUser.toObject());

    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Send welcome email
    try {
      await sendWelcomeEmail(newUser.email, newUser.name);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail - verification was successful
    }

    res.json({ 
      message: 'Email verified successfully! You can now log in to your account.',
      verified: true,
      email: newUser.email
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed. Please try again.' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email to pending user
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if already verified
    const verifiedUser = await User.findOne({ email: email.toLowerCase() });
    if (verifiedUser) {
      return res.status(400).json({ 
        message: 'This email is already verified. You can log in now.' 
      });
    }

    // Find pending user
    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });

    if (!pendingUser) {
      return res.status(404).json({ message: 'No pending registration found with this email. Please register first.' });
    }

    // Generate new verification token
    const { token, hash, expires } = generateEmailVerificationToken();

    // Update pending user with new token
    pendingUser.emailVerificationToken = hash;
    pendingUser.emailVerificationExpires = expires;
    await pendingUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, token, pendingUser.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'Verification email sent successfully. Check your inbox.',
      email: pendingUser.email
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        bio: req.user.bio,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

export default router;
