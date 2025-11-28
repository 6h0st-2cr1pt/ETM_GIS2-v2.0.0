# Google OAuth Setup Guide

## Installation

1. Install django-allauth:
```bash
pip install django-allauth
```

2. Run migrations:
```bash
python manage.py migrate
```

## Google OAuth Configuration

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/accounts/google/login/callback/` (for development)
   - `https://yourdomain.com/accounts/google/login/callback/` (for production)
7. Copy the Client ID and Client Secret

### Step 2: Configure Environment Variables

Add to your `.env` file:
```
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
```

### Step 3: Configure in Django Admin

1. Go to Django Admin: `http://localhost:8000/admin/`
2. Navigate to "Social Applications"
3. Click "Add Social Application"
4. Fill in:
   - **Provider**: Google
   - **Name**: Google OAuth
   - **Client id**: Your Google Client ID
   - **Secret key**: Your Google Client Secret
   - **Sites**: Select your site (usually "example.com")
5. Save

## Features

- ✅ Normal login with username/email and password
- ✅ Sign up with username, email, and password
- ✅ Google OAuth login
- ✅ Google OAuth signup
- ✅ Unique accounts (email-based uniqueness)
- ✅ Automatic account creation for Google OAuth users

## Account Uniqueness

The system ensures:
- Each email can only be associated with one account
- Usernames must be unique
- Google OAuth accounts are automatically linked to unique emails
- If a Google account email already exists, it will log in to the existing account

## URLs

- Login: `/public/login/`
- Signup: `/public/signup/`
- Logout: `/public/logout/`
- Google OAuth: `/accounts/google/login/`

## Notes

- Email verification is currently disabled (`ACCOUNT_EMAIL_VERIFICATION = 'none'`)
- To enable email verification, change it to `'mandatory'` in settings.py
- All accounts are unique based on email addresses

