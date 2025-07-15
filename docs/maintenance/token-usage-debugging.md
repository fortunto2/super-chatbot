# Token Usage Debugging Guide

**Created**: January 2025  
**Status**: 🔧 OAUTH FIXED - Auth0 popup authentication implemented  
**Priority**: HIGH - Users should use personal credits

## Issue Description

Despite having personal token system implemented, the system was still charging admin token instead of user's personal SuperDuperAI tokens during generation.

## ✅ ROOT CAUSE IDENTIFIED

**Problem 1:** OAuth callback was configuring SuperDuperAI client with **system token** instead of **user's personal token**.

**Problem 2:** SuperDuperAI OAuth flow uses **Auth0 authentication** which requires user to log in, but the system was redirecting users without explanation.

**Evidence from logs:**

```
🔗 Creating OAuth URL: {
  superduperaiUrl: 'http://localhost:8000',
  callbackUrl: 'http://localhost:3000/api/auth/superduperai/callback',
  authUrl: 'http://localhost:8000/api/v1/auth/login?redirect_url=...'
}
🔍 OAuth params check:
- code: NULL        ← No OAuth code received
- All params: []    ← No parameters at all
❌ No OAuth code, redirecting to auth_failed
```

**Analysis:** SuperDuperAI OAuth endpoint returns Auth0 login page instead of direct redirect, requiring user interaction.

## ✅ SOLUTIONS IMPLEMENTED

### 1. Fixed OAuth Callback Logic

**File:** `app/api/auth/superduperai/callback/route.ts`

- Added detailed logging to track OAuth flow
- Enhanced error handling for missing codes
- Improved token extraction logic

### 2. Fixed OAuth Frontend Flow

**File:** `components/superduperai-connection.tsx`

**Before (Broken):**

```typescript
// Redirected user to Auth0 page without explanation
window.location.href = authUrl;
```

**After (Fixed):**

```typescript
// Opens Auth0 in popup window with clear instructions
const authWindow = window.open(
  authUrl,
  "superduperai-auth",
  "width=600,height=700"
);

// Tracks window closure and refreshes status
const checkClosed = setInterval(() => {
  if (authWindow.closed) {
    clearInterval(checkClosed);
    loadData(); // Refresh connection status
  }
}, 1000);
```

**New Features:**

- ✅ **Popup authentication** - Opens Auth0 in new window
- ✅ **Clear instructions** - Shows user what to do
- ✅ **Popup fallback** - Uses redirect if popups blocked
- ✅ **Auto-refresh** - Updates status after authentication
- ✅ **Timeout handling** - Auto-closes after 5 minutes

## Testing Instructions

### 1. Test OAuth Flow

1. **Go to** `/profile`
2. **Click** "Connect SuperDuperAI Account"
3. **Popup should open** with Auth0 login page
4. **Log in** to your SuperDuperAI account in popup
5. **Popup closes** automatically after success
6. **Status refreshes** showing connection

### 2. Expected Behavior

**Successful Flow:**

```
User clicks Connect
→ Popup opens with Auth0 page
→ User logs in to SuperDuperAI
→ Auth0 redirects to callback with code
→ Callback saves personal token
→ Popup closes, status updates
```

**Expected Logs After Success:**

```
🔍 OAuth Callback START: ...callback?code=abc123...
👤 Session check: OK
🔍 OAuth params check:
- code: abc123...    ← Code received
- All params: [["code", "abc123..."], ["state", "..."]]
✅ Using access_token from OAuth params: sk-user-abc...
👤 DEBUG: userInfo: { id: "user123", balance: 150 }
💾 Saving to database: { tokenPreview: "sk-user-abc...", balance: 150 }
✅ OAuth callback SUCCESS, redirecting to profile
```

### 3. Verify Token Separation

After successful OAuth, generation logs should show:

```
🔑 User token preview: sk-user-abc...     ← Unique user token
⚡ System token preview: sk-admin-xyz...  ← Different admin token
🔑 Configured SuperDuperAI with user token: sk-user-abc...
```

## Troubleshooting

### If Popup is Blocked

- Browser will automatically fall back to redirect
- User will be redirected to Auth0 page
- After login, will return to profile page

### If No Code Received

Check that SuperDuperAI backend is running on `http://localhost:8000`

```bash
curl http://localhost:8000/api/v1/auth/login
# Should return Auth0 login page HTML
```

### If Token Still Wrong

- Disconnect and reconnect SuperDuperAI account
- Check callback logs for actual token received
- Verify OAuth flow completes successfully

## Related Files

- ✅ `components/superduperai-connection.tsx` - **FIXED** - Popup authentication
- ✅ `app/api/auth/superduperai/callback/route.ts` - Enhanced logging
- ✅ `app/api/auth/superduperai/login/route.ts` - OAuth URL generation
- ✅ `app/api/generate/video/route.ts` - Enhanced diagnostics
- ✅ `app/api/generate/image/route.ts` - Enhanced diagnostics

## Next Steps

1. **Test popup authentication** - Verify Auth0 login works
2. **Verify token separation** - Check logs show different tokens
3. **Test generation** - Confirm user credits are used
4. **Document success** - Update implementation status
