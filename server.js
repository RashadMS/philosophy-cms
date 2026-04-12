/**
 * Main Server Entry Point
 * Express.js server with MongoDB connection
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import notificationRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// سيحاول استخدام المنفذ المتاح من الاستضافة، أو 3000
const PORT = process.env.PORT || 3000;

// ==============================================
// Security Middleware - Configure before routes
// ==============================================

// 1. Helmet.js - Secures HTTP headers against various attacks
app.use(helmet());

// 2. CORS - Configure to allow only your production frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Replace with your production URL
    credentials: true, // Allow cookies and credentials
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Rate Limiting - Limit each IP to 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Standard Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// 3. الاتصال بقاعدة البيانات (استخدام متغير البيئة للأمان)
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
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

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

app.get('/verify-email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify-email.html'));
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