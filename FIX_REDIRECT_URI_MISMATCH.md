# Fix Google OAuth Redirect URI Mismatch Error

## Error: `redirect_uri_mismatch`

This error occurs when the redirect URI configured in Google Cloud Console doesn't match the redirect URI that your Django application is trying to use.

## Solution

### Step 1: Determine Your Redirect URI

For django-allauth, the redirect URI format is:
```
http://YOUR_DOMAIN/accounts/google/login/callback/
```

Based on your current setup, you're using:
- **Development**: `http://127.0.0.1:8000/accounts/google/login/callback/`
- **Alternative**: `http://localhost:8000/accounts/google/login/callback/`

### Step 2: Configure in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add **BOTH** of these URIs:
   ```
   http://127.0.0.1:8000/accounts/google/login/callback/
   http://localhost:8000/accounts/google/login/callback/
   ```
6. Click **Save**

### Step 3: Verify Your Configuration

Make sure you have:
- ✅ Added both `127.0.0.1` and `localhost` redirect URIs
- ✅ The exact path: `/accounts/google/login/callback/` (with trailing slash)
- ✅ No typos in the URI
- ✅ Saved the changes in Google Cloud Console

### Step 4: Wait for Changes to Propagate

Google's changes may take a few minutes to propagate. Wait 2-5 minutes after saving before testing again.

### Step 5: Test Again

Try accessing `/accounts/google/login/` again after the changes have propagated.

## Common Issues

### Issue 1: Missing Trailing Slash
- ❌ Wrong: `http://127.0.0.1:8000/accounts/google/login/callback`
- ✅ Correct: `http://127.0.0.1:8000/accounts/google/login/callback/`

### Issue 2: Using Wrong Domain
- Make sure you're using the exact domain you access your app with
- If you access via `127.0.0.1`, use `127.0.0.1` in the redirect URI
- If you access via `localhost`, use `localhost` in the redirect URI
- **Best practice**: Add both to avoid issues

### Issue 3: Port Mismatch
- Make sure the port number matches (default is `8000`)
- If you're running on a different port, update the redirect URI accordingly

## Production Setup

For production, you'll need to:
1. Add your production domain's redirect URI:
   ```
   https://yourdomain.com/accounts/google/login/callback/
   ```
2. Update `ALLOWED_HOSTS` in `settings.py` to include your domain
3. Make sure your production site uses HTTPS

## Verification Script

You can run this command to check what redirect URI your app is using:

```bash
python manage.py shell -c "from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter; from django.test import RequestFactory; rf = RequestFactory(); request = rf.get('/accounts/google/login/'); request.META['HTTP_HOST'] = '127.0.0.1:8000'; adapter = GoogleOAuth2Adapter(request); print('Redirect URI would be:', adapter.get_callback_url(request, None))"
```

Or use the management command provided: `python manage.py check_oauth_redirect`

