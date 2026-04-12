# Email Verification System - Setup Guide

## Overview
The Rashad platform now requires email verification during user registration. This ensures users maintain real email addresses and helps prevent spam accounts and unauthorized registrations.

## Features

✅ **Email Verification Required**: Users must verify their email before they can log in  
✅ **24-Hour Verification Window**: Verification links expire after 24 hours  
✅ **Resend Verification**: Users can request a new verification link if they miss the original  
✅ **Welcome Emails**: Confirmation email sent after successful verification  
✅ **Arabic Support**: All email templates and UI messages are in Arabic  
✅ **Secure Tokens**: Uses cryptographic hashing for secure token verification  

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@rashad.app
APP_URL=http://localhost:3000  # Change to your deployed domain
```

## Gmail Setup Instructions

1. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Look for "2-Step Verification" and enable it
   - Follow Google's instructions

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password to your `.env` file as `EMAIL_PASSWORD`

3. **Update Email Configuration**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=noreply@rashad.app
   ```

## Other Email Providers

### Outlook/Hotmail
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
```

### Yahoo Mail
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-specific-password
```

### Custom SMTP Server
```env
EMAIL_SERVICE=gmail  # Still required by nodemailer
SMTP_HOST=smtp.example.com
SMTP_PORT=587
EMAIL_USER=username
EMAIL_PASSWORD=password
```

## API Endpoints

### 1. Registration
**POST** `/api/auth/register`

Request:
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "securePassword123",
  "bio": "معهد فلسفي"
}
```

Response:
```json
{
  "message": "Registration successful! Check your email to verify your account. The verification link is valid for 24 hours.",
  "email": "ahmed@example.com",
  "requiresVerification": true
}
```

### 2. Verify Email
**GET** `/api/auth/verify-email?token=VERIFICATION_TOKEN`

Response (Success):
```json
{
  "message": "Email verified successfully! You can now log in to your account.",
  "verified": true,
  "email": "ahmed@example.com"
}
```

### 3. Resend Verification Email
**POST** `/api/auth/resend-verification`

Request:
```json
{
  "email": "ahmed@example.com"
}
```

Response:
```json
{
  "message": "Verification email sent successfully. Check your inbox.",
  "email": "ahmed@example.com"
}
```

### 4. Login (with Verification Check)
**POST** `/api/auth/login`

Request:
```json
{
  "email": "ahmed@example.com",
  "password": "securePassword123"
}
```

Response (Unverified Email):
```json
{
  "message": "Please verify your email before logging in. Check your inbox for the verification link.",
  "email": "ahmed@example.com",
  "requiresVerification": true
}
```

Response (Success):
```json
{
  "message": "Login successful.",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "User",
    "bio": "معهد فلسفي",
    "avatar": null
  }
}
```

## Frontend Pages

### Registration Page (`/register`)
- Users enter name, email, password, and bio
- Upon successful registration, redirected to verification message
- Shows email verification prompt with option to resend email

### Email Verification Page (`/verify-email?token=TOKEN`)
- Automatically processes verification token
- Shows success or error message
- Provides links to login or homepage after verification

### Login Page (`/login`)
- Standard login form
- If email not verified, shows prompt to verify before login
- Option to resend verification email

## User Flow

### Registration to Verification
1. User visits `/register`
2. Fills in registration form
3. Submits form → Registration API is called
4. Verification email is sent
5. User sees message about checking inbox
6. User checks email inbox for verification link
7. User clicks verification link in email
8. Browser navigates to `/verify-email?token=...`
9. Token is verified automatically
10. User sees success message
11. User can now log in with verified email

### Failed Verification
- Token expires after 24 hours
- User can request new verification email from register page or login page
- Resend endpoint generates new token and sends new email

## Security Considerations

✅ **Tokens are hashed**: Only SHA256 hashes stored in database, not plain tokens  
✅ **Time-based expiry**: Tokens expire after 24 hours  
✅ **Secure random generation**: Uses crypto.randomBytes() for token generation  
✅ **Email validation**: Regex validation for email format  
✅ **Password hashing**: Bcrypt with salt for password security  
✅ **JWT authentication**: Secure token-based authentication  

## Testing the System

### Test with MailHog (Development)
For development testing without real emails:

```bash
# Install MailHog
# Download from: https://github.com/mailhog/MailHog/releases

# Run MailHog
./MailHog

# Configure .env
EMAIL_SERVICE=custom
SMTP_HOST=localhost
SMTP_PORT=1025

# View sent emails at http://localhost:8025
```

### Test with Console (Development Alternative)
Modify `lib/email.js` to log verification links:

```javascript
console.log('Verification Link:', verificationLink);
```

Then copy the link from console logs.

## Troubleshooting

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- Enable "Less secure app access" (Gmail older accounts)
- Use App Password instead of account password (Gmail)
- Check firewall/network allows SMTP port (usually 587)
- Review server logs for email service errors

### Verification Link Not Working
- Ensure APP_URL environment variable is set correctly
- Check token hasn't expired (24-hour window)
- Verify database connection and token storage

### Users Locked Out
- Users can request new verification email from login page
- Check email service logs for delivery issues

## GDPR & Privacy

- Verification tokens are automatically deleted after email is verified
- User data follows your privacy policy
- Consider adding privacy policy acceptance to registration

## Future Enhancements

- [ ] Email confirmation for admin notifications
- [ ] Password reset via email
- [ ] Email change verification
- [ ] Unsubscribe from email notifications
- [ ] Email frequency preferences
- [ ] Two-factor authentication via email
