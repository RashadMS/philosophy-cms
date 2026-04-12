/**
 * Token Utilities
 * Generates secure tokens for email verification and password reset
 */

import crypto from 'crypto';

/**
 * Generate secure email verification token
 * @returns {Object} - {token, hash, expires}
 */
export function generateEmailVerificationToken() {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Create a hash for database storage (more secure than storing plain tokens)
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Set expiry to 24 hours
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return {
    token,     // Send this to user
    hash,      // Store this in database
    expires
  };
}

/**
 * Verify if token matches hash
 * @param {string} token - Token provided by user
 * @param {string} hash - Hash stored in database
 * @returns {boolean}
 */
export function verifyTokenHash(token, hash) {
  const calculatedHash = crypto.createHash('sha256').update(token).digest('hex');
  return calculatedHash === hash;
}

/**
 * Generate random password reset token
 * @returns {Object} - {token, hash, expires}
 */
export function generatePasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Set expiry to 1 hour
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  
  return {
    token,
    hash,
    expires
  };
}
