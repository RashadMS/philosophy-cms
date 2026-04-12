/**
 * Email Service
 * Handles sending verification and notification emails
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true لـ 465، false لـ 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // هذا الجزء هو الحل للمشكلة في بيئات الاستضافة مثل Render
  tls: {
    rejectUnauthorized: false // يساعد في تخطي مشاكل شهادات الـ SSL في بعض الخوادم
  },
  family: 4 // إجبار استخدام IPv4 بدلاً من IPv6 لتجنب خطأ ENETUNREACH
});

/**
 * Send email verification link to user
 * @param {string} email - User's email address
 * @param {string} verificationToken - Verification token
 * @param {string} userName - User's name
 */
export async function sendVerificationEmail(email, verificationToken, userName) {
  const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'تحقق من بريدك الإلكتروني - Rashad',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', 'Cairo', sans-serif;
            direction: rtl;
            text-align: right;
            background-color: #faf8f5;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 6px;
            border: 1px solid #e2e0dc;
            overflow: hidden;
          }
          .header {
            background-color: #1a365d;
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.01em;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 13px;
            opacity: 0.95;
            font-weight: 300;
          }
          .content {
            padding: 40px 30px;
            color: #2d3748;
            line-height: 1.75;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 600;
            color: #1a365d;
          }
          .message {
            font-size: 15px;
            margin-bottom: 30px;
            color: #4a5568;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          /* تم إبقاء الكلاسات للنسخ الاحتياطي */
          .verification-button {
            display: inline-block;
            background-color: #1a365d;
            color: white;
            padding: 14px 35px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            border: none;
            cursor: pointer;
          }
          .info-box {
            background-color: #f7f5f2;
            border-right: 4px solid #1a365d;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #2d3748;
          }
          .info-label {
            font-weight: 600;
            margin-bottom: 8px;
          }
          .link-section {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 12px;
            word-break: break-all;
          }
          .link-label {
            font-size: 12px;
            color: #718096;
            margin-bottom: 8px;
          }
          .link-section a {
            color: #1a365d;
            text-decoration: none;
          }
          .footer {
            background-color: #f7f5f2;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #718096;
            border-top: 1px solid #e2e0dc;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>رشاد</h1>
            <p>منصة فلسفية للأفكار والحكمة</p>
          </div>
          
          <div class="content">
            <div class="greeting">مرحباً ${userName}،</div>
            
            <div class="message">
              شكراً لتسجيلك في منصة رشاد. لإتمام عملية التحقق من حسابك، يرجى الضغط على الزر أدناه:
            </div>
            
            <div class="button-container">
              <a href="${verificationLink}" 
                 style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 14px 35px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; border: none;" 
                 class="verification-button">
                تحقق من بريدك الإلكتروني
              </a>
            </div>
            
            <div class="info-box">
              <div class="info-label">معلومة:</div>
              هذا الرابط صالح لمدة 24 ساعة فقط. إذا انتهت الصلاحية، يمكنك طلب رابط جديد من صفحة التسجيل.
            </div>
            
            <div style="font-size: 13px; color: #718096; text-align: center; margin: 20px 0;">
              أو انسخ الرابط التالي:
            </div>
            
            <div class="link-section">
              <div class="link-label">رابط التحقق:</div>
              <a href="${verificationLink}">${verificationLink}</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 منصة رشاد - جميع الحقوق محفوظة</p>
            <p>هذا البريد تم إرساله تلقائياً من نظام الموقع</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `مرحباً ${userName}،

شكراً لتسجيلك في منصة رشاد. لإتمام عملية التحقق من حسابك، يرجى زيارة الرابط التالي:

${verificationLink}

هذا الرابط صالح لمدة 24 ساعة فقط.

© 2026 منصة رشاد`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send welcome email after successful verification
 * @param {string} email - User's email address
 * @param {string} userName - User's name
 */
export async function sendWelcomeEmail(email, userName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'مرحباً في رشاد - حسابك جاهز! 🎉',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            background-color: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
            color: #333;
          }
          .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>مرحباً بك في رشاد! 🌟</h1>
          </div>
          
          <div class="content">
            <h2>حسابك جاهز الآن</h2>
            <p>أهلاً وسهلاً ${userName}،</p>
            <p>تم التحقق من بريدك الإلكتروني بنجاح! حسابك الآن مفعّل وجاهز للاستخدام.</p>
            <p>يمكنك الآن:
              <ul>
                <li>نشر المقالات والأفكار الفلسفية</li>
                <li>إضافة ملاحظاتك وتعليقاتك</li>
                <li>تحرير ملفك الشخصي</li>
                <li>المشاركة في النقاشات المجتمعية</li>
              </ul>
            </p>
            <p>شكراً لانضمامك إلى مجتمع رشاد!</p>
          </div>
          
          <div class="footer">
            <p>© 2026 منصة رشاد - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}

/**
 * Verify email transporter connection
 */
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('Email service is configured and ready to send emails');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
}