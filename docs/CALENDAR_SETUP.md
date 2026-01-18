# Google Calendar Setup

This guide explains how to set up Google Calendar integration for Chronos.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project"
4. Name it "Chronos" (or whatever you prefer)
5. Click "Create"

## Step 2: Enable the Google Calendar API

1. In your new project, go to **APIs & Services > Library**
2. Search for "Google Calendar API"
3. Click on it and click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (unless you have a Google Workspace org)
3. Click **Create**
4. Fill in the required fields:
   - App name: `Chronos`
   - User support email: Your email
   - Developer contact: Your email
5. Click **Save and Continue**
6. On the Scopes page, click **Add or Remove Scopes**
7. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
8. Click **Save and Continue**
9. Add your email as a test user (required for testing)
10. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Name it "Chronos Web"
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000` (if using different port)
   - Your production URL (when deployed)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173/oauth/callback`
   - `http://localhost:3000/oauth/callback`
   - Your production callback URL
7. Click **Create**
8. Copy the **Client ID** (you don't need the secret for implicit flow)

## Step 5: Configure Chronos

1. Create or edit `web/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

2. Restart the dev server if running

## Step 6: Test the Connection

1. Run the app (`npm run dev` in the web folder)
2. Go to the Calendar tab
3. Click "Connect Google Calendar"
4. Sign in with a test user account
5. Approve the permissions
6. You should be redirected back and see your calendars

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure your redirect URI exactly matches what's in Google Cloud Console
- Check that `http://localhost:5173/oauth/callback` is in your authorized redirect URIs

### "Error 400: redirect_uri_mismatch"
- The redirect URI in the request doesn't match any authorized URIs
- Double-check the port number and path

### "This app isn't verified"
- Click "Advanced" then "Go to Chronos (unsafe)"
- This is normal for development apps

### Token expires after 1 hour
- The implicit flow doesn't support refresh tokens
- Users will need to reconnect after the token expires
- For production, consider implementing the authorization code flow with a backend

## Production Considerations

For production deployment:

1. Add your production domain to authorized origins and redirect URIs
2. Complete the OAuth consent screen verification (if you want to remove the "unverified app" warning)
3. Consider implementing a backend for:
   - Authorization code flow (supports refresh tokens)
   - Token storage and management
   - Webhook support for real-time sync

## Security Notes

- Never commit your `.env` file to git
- The client ID is safe to expose (it's public by design)
- Do NOT use client secrets in frontend code
