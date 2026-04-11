/**
 * Main Server Entry Point
 * Express.js server with MongoDB connection
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. تحميل إعدادات ملف الـ .env في أول الملف تماماً
dotenv.config();

// 2. استيراد المسارات (Routes) بعد تحميل الإعدادات
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// سيحاول استخدام المنفذ المتاح من الاستضافة، أو 3000، وإذا فشل سيجرب 3001
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

<<<<<<< HEAD
// 3. الاتصال بقاعدة البيانات (استخدام متغير البيئة)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('✗ Error: MONGODB_URI is not defined in .env file');
    process.exit(1);
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✓ Connected to MongoDB Atlas Successfully'))
        .catch(err => {
            console.error('✗ MongoDB connection error:', err);
            process.exit(1);
        });
=======
// 3. الاتصال بقاعدة البيانات (استخدام الرابط السحابي فقط)
const MONGODB_URI = "mongodb+srv://rashadmsabeh:rdmh2003@cluster0.ol8fdtk.mongodb.net/philosophy_cms?retryWrites=true&w=majority";
if (!MONGODB_URI) {
    console.error('✗ Error: MONGODB_URI is not defined in .env file');
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✓ Connected to MongoDB Atlas Successfully'))
        .catch(err => console.error('✗ MongoDB connection error:', err));
>>>>>>> b97e42c6385e63bb2c7f761ceda27040acfc07b7
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/post/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'post.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
});

export default app;
