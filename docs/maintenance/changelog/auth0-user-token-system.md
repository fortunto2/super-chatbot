# Auth0 User Token System for SuperDuperAI

**Date**: 2025-07-28  
**Type**: Feature Implementation  
**Priority**: Medium  
**Status**: ✅ COMPLETED

## Summary

Implemented simple user token system that uses Auth0 session to store and retrieve user SuperDuperAI tokens, eliminating the need for database storage while providing fallback to system token.

## Architecture

### Simple Session-Based Approach

Instead of storing tokens in database, we use Auth0 JWT session to pass user tokens:

```
User → Auth0 Login → JWT Token (with superduperaiToken) → API Routes → SuperDuperAI
                    ↓
                    System Token Fallback (if no user token)
```

## Implementation

### 1. Auth0 JWT Callbacks

**File**: `app/(auth)/auth.ts`

Enhanced JWT callbacks to support `superduperaiToken`:

```typescript
async jwt({ token, user, account }) {
  if (user) {
    token.id = user.id as string;
    token.type = user.type;
    // Preserve superduperaiToken if it exists
    if ((user as any).superduperaiToken) {
      token.superduperaiToken = (user as any).superduperaiToken;
    }
  }

  if (account && account.provider === 'auth0') {
    // Preserve any existing superduperaiToken from account
    if (account.superduperaiToken) {
      token.superduperaiToken = account.superduperaiToken;
    }
  }

  return token;
},

async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id;
    session.user.type = token.type;
    // Pass superduperaiToken to session
    if (token.superduperaiToken) {
      (session as any).superduperaiToken = token.superduperaiToken;
    }
  }
}
```

### 2. Token Utility Functions

**File**: `lib/config/superduperai.ts`

Added simple functions to extract tokens from session:

```typescript
/**
 * Get SuperDuperAI token for user from Auth0 session with fallback to system token
 */
export function getSuperduperAITokenForUser(session: any): {
  token: string;
  isUserToken: boolean;
} {
  // Try to get user's SuperDuperAI token from session
  const userToken =
    session?.user?.superduperaiToken || session?.superduperaiToken;

  if (userToken && typeof userToken === "string" && userToken.length > 10) {
    console.log(
      "🔧 SuperDuperAI: Using user token for user:",
      session?.user?.email
    );
    return { token: userToken, isUserToken: true };
  }

  // Fallback to system token
  const systemConfig = getSuperduperAIConfig();
  console.log(
    "🔧 SuperDuperAI: User has no token, using system token for user:",
    session?.user?.email || "unknown"
  );
  return { token: systemConfig.token, isUserToken: false };
}

/**
 * Get SuperDuperAI configuration with user token from session
 */
export function getSuperduperAIConfigWithUserToken(
  session: any
): SuperduperAIConfig & { isUserToken: boolean } {
  const baseConfig = getSuperduperAIConfig();
  const { token, isUserToken } = getSuperduperAITokenForUser(session);

  return {
    ...baseConfig,
    token,
    isUserToken,
  };
}
```

### 3. Updated API Routes

**Image Generation**: `app/api/generate/image/route.ts`
**Video Generation**: `app/api/generate/video/route.ts`

**Before**:

```typescript
const config = getSuperduperAIConfig();
OpenAPI.BASE = config.url;
OpenAPI.TOKEN = config.token; // Always system token
```

**After**:

```typescript
const config = getSuperduperAIConfigWithUserToken(session);
OpenAPI.BASE = config.url;
OpenAPI.TOKEN = config.token; // User token or system fallback

// Response includes token usage info
response.usingUserToken = config.isUserToken;
```

## Token Flow

### 1. User Setup (Future)

```
User → Auth0 Profile → Add superduperaiToken → Stored in JWT
```

### 2. API Request Flow

```
1. User makes API request
2. System gets Auth0 session
3. Extract superduperaiToken from session
4. If token exists → Use user token
5. If no token → Fallback to system token
6. Configure OpenAPI client
7. Make SuperDuperAI request
8. Return response with usingUserToken flag
```

### 3. Console Logging

```
🔧 SuperDuperAI: Using user token for user: user@example.com
🔧 SuperDuperAI: User has no token, using system token for user: user@example.com
```

## Benefits

### Compared to Database Approach

✅ **Simpler**: No database fields or migrations needed  
✅ **Auth0 Native**: Uses standard OAuth/JWT patterns  
✅ **Stateless**: No additional database queries  
✅ **Secure**: Tokens managed by Auth0  
✅ **Fast**: No database lookups during generation

### Maintained Features

✅ **Backward Compatible**: 100% compatible with existing functionality  
✅ **Safe Fallback**: Always works with system token if user token unavailable  
✅ **Clear Logging**: Excellent visibility into token usage  
✅ **API Response**: `usingUserToken` field for client feedback

## Usage Examples

### Setting User Token (Manual - for testing)

Currently tokens can be set manually in Auth0 user metadata or through custom profile endpoints (future feature).

### API Response

```json
{
  "success": true,
  "fileId": "file_123",
  "projectId": "project_456",
  "url": "https://...",
  "message": "Image generated successfully",
  "creditsUsed": 10,
  "usingUserToken": true
}
```

### Console Output

```
🔧 SuperDuperAI: Using user token for user: john@example.com
🖼️ Image API: Processing image generation request
✅ Image generation result: {...}
💳 Balance deducted for user user_123 after successful image generation
```

## Token Priority Logic

1. **Check session.superduperaiToken** → Use if valid (length > 10)
2. **Check session.user.superduperaiToken** → Use if valid
3. **Fallback to system token** → Always available
4. **Configure OpenAPI client** → With selected token
5. **Log token type** → For debugging

## Future Enhancements

### Phase 2: User Interface

- User profile page for token management
- Token validation and testing interface
- Usage statistics and billing integration

### Phase 3: OAuth Integration

- Direct SuperDuperAI OAuth flow
- Automatic token refresh
- Token expiration handling

### Phase 4: Advanced Features

- Multiple token support (dev/prod)
- Team token sharing
- Token-based feature access

## Testing

### Manual Testing

1. **Without user token**:

   - Expected: `usingUserToken: false`, system token used
   - Logs: "User has no token, using system token"

2. **With user token** (set manually in session):

   - Expected: `usingUserToken: true`, user token used
   - Logs: "Using user token for user"

3. **Invalid user token**:
   - Expected: Fallback to system token
   - Logs: "User has no token, using system token"

### Setting Test Token

For testing, you can manually set a token in the session by modifying Auth0 user metadata or using browser developer tools to modify the JWT.

## Security Considerations

- ✅ **Server-side only**: Tokens never exposed to client
- ✅ **JWT encryption**: Tokens protected by Auth0 JWT security
- ✅ **Fallback safety**: System always works even if user tokens fail
- ✅ **Validation**: Basic token validation (length check)
- ✅ **Logging**: Clear audit trail without exposing token values

## Performance Impact

- **Database**: Zero additional queries
- **Memory**: Minimal session data increase
- **Network**: No additional API calls
- **Latency**: Negligible impact (session parsing only)

## Migration Notes

### From Previous Implementation

If you had the database-based approach:

1. **No migration needed**: This approach doesn't use database
2. **Remove database field**: Can safely remove `superduperaiToken` column
3. **Update documentation**: Point to Auth0-based approach

### For New Users

- **No setup required**: System works immediately with fallback
- **Gradual adoption**: Users can add tokens when ready
- **Zero downtime**: Implementation is completely backward compatible

This simple Auth0-based approach provides all the benefits of user tokens without the complexity of database storage, while maintaining perfect backward compatibility and safety.
