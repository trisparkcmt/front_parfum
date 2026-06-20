# Google Auth Button - Troubleshooting Guide

## Issue
The "Continue with Google" button works locally but is inactive/non-functional on the deployed version.

## Root Cause
The Google OAuth2 Client ID is configured with authorized redirect URIs that only include `localhost` or the old domain. The deployed origin needs to be explicitly added to Google Cloud Console.

## Steps to Fix

### 1. Check Console Logs
When the button is inactive on deployed site:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages starting with:
   - `"Google OAuth2 SDK script loaded"`
   - `"Google OAuth2 error:"`
   - `"Current origin:"`
4. Note the current origin and client ID

### 2. Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
5. Click to edit it
6. Under **Authorized JavaScript origins**, add:
   ```
   https://your-deployed-domain.com
   https://www.your-deployed-domain.com  (if applicable)
   ```
7. Click **Save**

### 3. Add Your Deployed URLs
The deployed URL appears in the console logs. Common patterns:
- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`
- Custom domain: `https://your-custom-domain.com`

### 4. Verify Configuration
- The `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` must match the client ID in Google Cloud Console
- Current Client ID: `752062694078-15ietit699ucabj0k6u8g75e6h3rmbob.apps.googleusercontent.com`

### 5. Test After Changes
1. Hard refresh the deployed site (Ctrl+Shift+R or Cmd+Shift+R)
2. Open DevTools Console
3. Look for success message: `"Google OAuth2 client initialized successfully"`
4. Try clicking the Google button

## Common Errors & Solutions

### Error: "Origin not allowed"
**Fix**: Add your exact deployed origin to Authorized JavaScript origins in Google Cloud Console

### Error: "Invalid client"
**Fix**: Verify the GOOGLE_CLIENT_ID matches the one in Google Cloud Console

### Script loads but button still inactive
**Fix**: Wait 5-10 minutes for Google Cloud Console changes to propagate

### "Blocked by CORS"
**Fix**: This shouldn't happen with Google SDK, but check:
- No custom API gateway is blocking Google domains
- Content Security Policy (CSP) headers allow `accounts.google.com`

## Enhanced Debugging
The code now logs:
- `window.location.origin` - Your deployed domain
- `clientId` - The OAuth client ID being used
- Script loading events - Whether SDK loads successfully
- Error details - The actual error from Google

**Check these logs in DevTools → Console after clicking the button.**

## Deployment Checklist
- [ ] Add deployed domain to Google Cloud Console Authorized origins
- [ ] Wait 5-10 minutes for changes to propagate
- [ ] Clear browser cache / hard refresh deployed site
- [ ] Check DevTools Console for errors
- [ ] Test "Continue with Google" button
- [ ] Verify successful authentication

## Next Steps if Still Not Working
1. Screenshot the console error and Google Cloud Console settings
2. Verify you're editing the correct OAuth client (not the wrong project)
3. Check if Google Cloud Console requires you to add the domain differently (e.g., with/without www prefix)
4. Consider using a different OAuth provider temporarily to rule out network issues
