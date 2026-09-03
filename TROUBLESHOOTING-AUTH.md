# Troubleshooting Unauthorized (401) Errors

## Quick Fix Steps

### 1. Open the Auth Debugger
I've added an Auth Debugger component that will appear in the bottom-right corner of your screen (development mode only). It shows:
- ✅ Your current auth status
- 🔑 Token information and expiry
- 🧪 Test button to check API connectivity
- 🔄 Reset button to clear everything

**To use it:**
1. Reload your page (F5)
2. Look for the yellow debug panel in the bottom-right
3. Click "Test API Call" to see if your token works
4. Check the token expiry time

### 2. Most Common Issues

#### A. Token Expired
**Symptoms:**
- Requests worked before, now all return 401
- You see "Token is EXPIRED" in the debugger

**Solution:**
1. Click "Clear Auth & Reload" in the debugger
2. Login again at `/login`

#### B. No Token Stored
**Symptoms:**
- You see "No token in localStorage" in the debugger
- Never logged in OR localStorage was cleared

**Solution:**
1. Go to `/login`
2. Login with your credentials
3. After successful login, check the debugger to confirm token is present

#### C. Wrong Backend URL
**Symptoms:**
- Network errors or timeouts
- Can't reach backend at all

**Current backend:** `https://api.accessoiresexclusifs.com/api/v1`

**Check:**
```javascript
// Run in browser console
console.log('Backend URL:', process.env.NEXT_PUBLIC_API_URL);
```

If it's wrong, update `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.accessoiresexclusifs.com/api/v1
```

#### D. Backend Rejected Valid Token
**Symptoms:**
- Token exists, not expired, but still 401
- Backend and frontend token secrets don't match

**Possible causes:**
1. Backend was redeployed with new JWT secret
2. Token was issued by wrong environment
3. Backend authentication system changed

**Solution:**
1. Ask backend team if JWT secret changed
2. If yes, everyone needs to re-login
3. Clear auth: `localStorage.clear()` → Login again

## Detailed Diagnostic Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - `401 Unauthorized` → Token problem
   - `Network Error` → Backend unreachable
   - `403 Forbidden` → You don't have permission (different from 401)

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Make a request (refresh page)
4. Find a failed request (red status)
5. Click on it
6. Check **Request Headers** section:
   - Should see: `Authorization: Bearer eyJ...`
   - If missing → token not being sent
   - If present but still 401 → token invalid

### Step 3: Check Application Storage
1. Open DevTools (F12)
2. Go to Application tab
3. Left sidebar → Storage → Local Storage → your domain
4. Look for these keys:
   - `auth_token` - Your access token
   - `refresh_token` - Your refresh token (if using mobile auth)
   - `auth_method` - Should be "web" or "mobile"
   - `ae-auth` - Your auth store state (JSON)

### Step 4: Manual Token Check
Run this in browser console:

```javascript
// Check token
const token = localStorage.getItem('auth_token');
console.log('Token:', token ? token.substring(0, 30) + '...' : 'MISSING');

// Decode token to check expiry
if (token) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = new Date(payload.exp * 1000);
    const now = new Date();
    console.log('Expires:', exp.toLocaleString());
    console.log('Is Expired:', exp < now);
    console.log('Time Left (minutes):', Math.floor((exp - now) / 60000));
  } catch (e) {
    console.error('Token decode failed:', e);
  }
}
```

## How Authentication Works in This App

### Flow:
1. **User logs in** at `/login`
   - Credentials sent to: `POST /api/v1/auth/web/login/`
   - Backend returns `{ access: "token...", user: {...} }`
   - Token stored in `localStorage` as `auth_token`

2. **Every API request** includes the token:
   ```javascript
   headers: {
     Authorization: `Bearer ${token}`
   }
   ```

3. **Token expires** after some time (usually 15-60 minutes)
   - Automatic refresh happens via `refresh_token` or HttpOnly cookie
   - If refresh fails → user redirected to `/login`

### Two Auth Methods:
- **Web Login (Cookie-based refresh)**: Default for web browsers
- **Mobile Login (Token-based refresh)**: For mobile apps

## API Request Flow

```
Your Request
    ↓
Request Interceptor (api.ts)
    ↓ Adds token: Authorization: Bearer ...
Backend
    ↓ Validates token
    ↓ If invalid → Returns 401
Response Interceptor (api.ts)
    ↓ Detects 401
    ↓ Tries to refresh token
    ↓ If refresh succeeds → Retry original request
    ↓ If refresh fails → Redirect to /login
Your Component gets response (or error)
```

## Common Scenarios & Solutions

### Scenario 1: "I just logged in but still getting 401"
**Possible causes:**
- Token not saved to localStorage
- API interceptor not picking up token
- Backend login endpoint returned wrong format

**Debug:**
```javascript
// Check if login actually saved the token
localStorage.getItem('auth_token') // Should return a long string starting with "eyJ"
```

**Fix:**
- Check network tab for the login request response
- Verify response contains `access` or `access_token` field
- If missing, backend login endpoint is broken

### Scenario 2: "It worked yesterday, not today"
**Cause:** Token expired and auto-refresh failed

**Fix:**
```javascript
// Clear everything and re-login
localStorage.clear();
window.location.href = '/login';
```

### Scenario 3: "Some requests work, others don't"
**Cause:** Permission-based (not authentication)

**Debug:**
- Check if 401 or 403
- 401 = not authenticated (token problem)
- 403 = authenticated but no permission (role problem)

**Fix for 403:**
- Check your user role: `useAuthStore.getState().user?.role`
- Contact admin if you need different permissions

### Scenario 4: "Works on one page, fails on another"
**Cause:** Conditional auth or different API endpoints

**Debug:**
- Check which endpoints are being called
- Some endpoints may not require auth
- Some may require specific roles

### Scenario 5: "Random 401s, then works again"
**Cause:** Token refresh timing issue or race condition

**Fix:**
- Check token expiry time
- If close to expiry, may be getting refreshed mid-request
- This should be rare; if frequent, there's a bug in refresh logic

## Advanced: Fixing the Code

If you need to modify the auth code, key files:

### `/services/api.ts`
- Request/response interceptors
- Token refresh logic
- Token storage/retrieval

### `/store/useAuthStore.ts`
- Login/logout logic
- User state management
- Token extraction from JWT

### `/services/apiService.ts`
- All API endpoint wrappers
- Uses `api` instance from api.ts

## Still Having Issues?

### Last Resort Debugging:
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'api:*');

// Check what's in auth state
const authState = JSON.parse(localStorage.getItem('ae-auth') || '{}');
console.log('Full Auth State:', authState);

// Test backend directly
fetch('https://api.accessoiresexclusifs.com/api/v1/shop/parfums/?limit=1')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test with your token
const token = localStorage.getItem('auth_token');
fetch('https://api.accessoiresexclusifs.com/api/v1/auth/me/', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Get Help:
1. Take a screenshot of the Auth Debugger panel
2. Copy any console errors
3. Copy the Network tab request/response for a failed request
4. Note what action you were trying to do when it failed

## Prevention Tips

1. **Keep tokens fresh**: The app auto-refreshes, but if you leave tab open for hours, manually refresh
2. **Don't clear localStorage randomly**: This deletes your tokens
3. **Use one auth method**: Don't mix mobile and web login
4. **Check backend status**: If backend is down/redeploying, you'll get errors
5. **Logout properly**: Use the logout button, don't just clear localStorage manually

## Quick Reference: localStorage Keys

| Key | Description | Example Value |
|-----|-------------|---------------|
| `auth_token` | JWT access token | `eyJhbGciOiJ...` |
| `refresh_token` | JWT refresh token | `eyJhbGciOiJ...` |
| `auth_method` | Auth method used | `"web"` or `"mobile"` |
| `ae-auth` | Zustand auth state | `{"state":{"user":{...}}}` |

## Environment Check

Your current backend configuration:
- **API URL**: `https://api.accessoiresexclusifs.com/api/v1`
- **Environment**: Check `.env.local` file
- **Auth Method**: Web (cookie-based refresh)

Make sure this matches your backend deployment!
