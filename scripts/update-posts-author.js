/**
 * Script to update all posts to author "رشاد"
 * Run with: node scripts/update-posts-author.js
 */

import mongoose from 'mongoose';
import Post from '../models/Post.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rashadapp:rashad1234@cluster0.phtfnxg.mongodb.net/rashad?retryWrites=true&w=majority';
const NEW_AUTHOR_ID = '69daf883f7c5cf26fd6952e5';
const NEW_AUTHOR_NAME = 'رشاد';

async function updatePostsAuthor() {
  try {
    console.log('🔄 جاري الاتصال بـ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ تم الاتصال بـ MongoDB');

    // Update all posts
    console.log('🔄 جاري تحديث جميع المقالات والاقتباسات...');
    const result = await Post.updateMany(
      {}, // Match all documents
      {
        $set: {
          author: NEW_AUTHOR_ID,
          authorName: NEW_AUTHOR_NAME
        }
      }
    );

    console.log(`✓ تم تحديث ${result.modifiedCount} مقالة/اقتباس بنجاح`);
    console.log(`✓ عدد المقالات المطابقة: ${result.matchedCount}`);

    // Verify the update
    const totalPosts = await Post.countDocuments({});
    const rashadPosts = await Post.countDocuments({ author: NEW_AUTHOR_ID });

    console.log(`\n📊 الإحصائيات:`);
    console.log(`   إجمالي المقالات: ${totalPosts}`);
    console.log(`   المقالات برشاد: ${rashadPosts}`);

    await mongoose.disconnect();
    console.log('\n✓ انتهى العملية بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

updatePostsAuthor();
