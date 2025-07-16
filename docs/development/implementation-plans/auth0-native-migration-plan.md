# Auth0 Native Migration Implementation Plan

**Date**: 2025-01-30  
**AI Agent**: Claude Sonnet 4  
**Status**: Planning Phase  
**Priority**: HIGH - Critical for personal token usage instead of admin tokens

## Overview

Migrate from the current hybrid NextAuth + Auth0 system to a pure Auth0 Next.js SDK implementation. The primary goal is to enable personal SuperDuperAI token usage instead of relying on admin tokens for media generation.

## Current System Analysis

### Current Architecture

```
NextAuth (Primary Auth)
├── Auth0 Provider (hybrid integration)
├── Credentials Provider (email/password)
├── Guest Provider (anonymous sessions)
└── SuperDuperAI Integration (OAuth token collection)
```

### Key Issues

1. **Admin Token Dependency**: All generations use system admin token
2. **Complex Hybrid System**: NextAuth + Auth0 creates complexity
3. **Token Management**: Personal tokens stored but not effectively used
4. **Session Complexity**: Multiple authentication layers

## Target Architecture

### Pure Auth0 Implementation

```
Auth0 Next.js SDK (Native)
├── Auth0 Authentication (primary)
├── Session Management (Auth0 native)
├── User Management (Auth0 profiles)
└── SuperDuperAI Integration (personal tokens per user)
```

### Benefits

1. **Personal Tokens**: Each user uses their own SuperDuperAI credits
2. **Simplified Auth**: Single authentication system
3. **Better UX**: Seamless Auth0 experience
4. **Scalability**: No shared admin token costs

## Implementation Strategy

### Phase 1: Auth0 SDK Setup

1. **Install Dependencies**

   ```bash
   npm install @auth0/nextjs-auth0
   npm uninstall next-auth
   ```

2. **Environment Configuration**

   ```env
   # Replace NextAuth variables with Auth0 native
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SECRET=generated-secret
   APP_BASE_URL=http://localhost:3000
   ```

3. **Auth0 Client Setup**

   ```typescript
   // lib/auth0.ts
   import { Auth0Client } from "@auth0/nextjs-auth0/server";

   export const auth0 = new Auth0Client({
     session: {
       rolling: true,
       absoluteDuration: 60 * 60 * 24 * 30, // 30 days
       inactivityDuration: 60 * 60 * 24 * 7, // 7 days
     },
     beforeSessionSaved: async (session, idToken) => {
       // Custom user data handling
       return {
         ...session,
         user: {
           ...session.user,
           superduperai_token: null, // Initialize token field
         },
       };
     },
   });
   ```

### Phase 2: Middleware Migration

1. **Replace Middleware**

   ```typescript
   // middleware.ts
   import type { NextRequest } from "next/server";
   import { auth0 } from "./lib/auth0";

   export async function middleware(request: NextRequest) {
     const authRes = await auth0.middleware(request);

     // Handle auth routes automatically
     if (request.nextUrl.pathname.startsWith("/auth")) {
       return authRes;
     }

     // Public routes
     const publicPaths = ["/api/config/", "/api/generate/", "/debug"];
     if (
       publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))
     ) {
       return authRes;
     }

     // Protected routes require session
     const session = await auth0.getSession(request);
     if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
       return NextResponse.redirect(new URL("/auth/login", request.url));
     }

     return authRes;
   }

   export const config = {
     matcher: [
       "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
     ],
   };
   ```

### Phase 3: Session Management Migration

1. **Update Session Access Patterns**

   ```typescript
   // Before (NextAuth)
   import { auth } from "@/app/(auth)/auth";
   const session = await auth();

   // After (Auth0)
   import { auth0 } from "@/lib/auth0";
   const session = await auth0.getSession();
   ```

2. **Client-Side Session**

   ```typescript
   // Before (NextAuth)
   import { useSession } from "next-auth/react";
   const { data: session } = useSession();

   // After (Auth0)
   import { useUser } from "@auth0/nextjs-auth0";
   const { user, isLoading } = useUser();
   ```

### Phase 4: SuperDuperAI Token Integration

1. **Enhanced Token Storage**

   ```typescript
   // Update session with SuperDuperAI token
   await auth0.updateSession({
     ...session,
     user: {
       ...session.user,
       superduperai_token: userToken,
       superduperai_connected: true,
     },
   });
   ```

2. **Token Resolution Logic**
   ```typescript
   // lib/auth/token-resolver.ts
   export async function getSuperduperAIToken(): Promise<string | null> {
     const session = await auth0.getSession();

     // Priority 1: User's personal token
     if (session?.user?.superduperai_token) {
       return session.user.superduperai_token;
     }

     // Priority 2: Guest limitations (no token)
     if (!session) {
       throw new Error("Guest users have limited access");
     }

     // Priority 3: Encourage connection
     throw new Error("Please connect your SuperDuperAI account");
   }
   ```

### Phase 5: Route Handlers Update

1. **Auth Routes** (Handled automatically by Auth0 SDK)

   - `/auth/login` - Auto-mounted
   - `/auth/logout` - Auto-mounted
   - `/auth/callback` - Auto-mounted
   - `/auth/me` - Auto-mounted

2. **SuperDuperAI OAuth Integration**

   ```typescript
   // app/api/auth/superduperai/connect/route.ts
   import { auth0 } from "@/lib/auth0";

   export async function POST(request: Request) {
     const session = await auth0.getSession();
     if (!session) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     // Handle SuperDuperAI OAuth flow
     const { origin } = new URL(request.url);
     const callbackUrl = `${origin}/api/auth/superduperai/callback`;
     const authUrl = `${
       process.env.SUPERDUPERAI_URL
     }/api/v1/auth/login?redirect_url=${encodeURIComponent(callbackUrl)}`;

     return NextResponse.json({ authUrl });
   }
   ```

### Phase 6: Component Updates

1. **Login Components**

   ```tsx
   // Before (NextAuth)
   import { signIn } from 'next-auth/react'
   <button onClick={() => signIn('auth0')}>Login</button>

   // After (Auth0)
   <a href="/auth/login">Login</a>
   ```

2. **Profile Components**

   ```tsx
   // components/user-profile.tsx
   "use client";
   import { useUser } from "@auth0/nextjs-auth0";

   export function UserProfile() {
     const { user, isLoading } = useUser();

     if (isLoading) return <div>Loading...</div>;
     if (!user) return <a href="/auth/login">Login</a>;

     return (
       <div>
         <h1>Welcome, {user.name}!</h1>
         <SuperDuperAIConnection user={user} />
         <a href="/auth/logout">Logout</a>
       </div>
     );
   }
   ```

### Phase 7: Database Schema Update

1. **User Table Enhancement**

   ```sql
   -- Add Auth0 specific fields
   ALTER TABLE users ADD COLUMN auth0_sub VARCHAR(255) UNIQUE;
   ALTER TABLE users ADD COLUMN superduperai_connected BOOLEAN DEFAULT FALSE;

   -- Index for performance
   CREATE INDEX idx_users_auth0_sub ON users(auth0_sub);
   ```

2. **User Synchronization**
   ```typescript
   // lib/db/auth0-sync.ts
   export async function syncAuth0User(auth0Sub: string, email: string) {
     const existingUser = await getUserByAuth0Sub(auth0Sub);

     if (!existingUser) {
       return await createAuth0User({
         auth0_sub: auth0Sub,
         email,
         superduperai_connected: false,
       });
     }

     return existingUser;
   }
   ```

## Risk Mitigation

### Data Migration Strategy

1. **User Data Preservation**

   - Map existing NextAuth sessions to Auth0 profiles
   - Preserve SuperDuperAI token associations
   - Maintain chat history and artifacts

2. **Rollback Plan**
   - Keep NextAuth code in feature branch
   - Environment variable switching capability
   - Database rollback scripts

### Testing Strategy

1. **Unit Tests**

   - Auth0 session handling
   - Token resolution logic
   - Component authentication states

2. **Integration Tests**

   - End-to-end auth flows
   - SuperDuperAI token integration
   - Media generation with personal tokens

3. **User Acceptance Testing**
   - Login/logout flows
   - SuperDuperAI account connection
   - Generation with personal credits

## Success Metrics

### Primary Goals

- [ ] Personal SuperDuperAI tokens used for 100% of authenticated user generations
- [ ] Admin token usage eliminated for user-initiated generations
- [ ] Simplified authentication codebase (single system)

### Performance Metrics

- [ ] Authentication flow completion rate > 95%
- [ ] Session persistence across browser sessions
- [ ] Token connection success rate > 90%

### User Experience

- [ ] Seamless login experience
- [ ] Clear SuperDuperAI connection status
- [ ] Personal credit usage visibility

## Implementation Timeline

### Week 1: Foundation

- [ ] Install Auth0 SDK
- [ ] Basic client configuration
- [ ] Environment setup

### Week 2: Core Migration

- [ ] Middleware replacement
- [ ] Session management update
- [ ] Route handlers migration

### Week 3: Integration

- [ ] SuperDuperAI token integration
- [ ] Component updates
- [ ] Database schema changes

### Week 4: Testing & Polish

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates

## Dependencies

### Required Environment Variables

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_SECRET=32-byte-hex-secret
APP_BASE_URL=http://localhost:3000
SUPERDUPERAI_URL=http://localhost:8000
```

### Package Updates

```json
{
  "dependencies": {
    "@auth0/nextjs-auth0": "^4.x.x"
  },
  "devDependencies": {
    "openssl": "for secret generation"
  }
}
```

## Next Steps

1. **Human Review**: Get approval for this migration plan
2. **Environment Setup**: Configure Auth0 tenant and application
3. **Branch Creation**: Create feature branch for migration
4. **Implementation**: Execute phases sequentially
5. **Testing**: Comprehensive testing before production deployment

## Notes

- This migration will eliminate the admin token dependency completely
- Users will be required to connect their SuperDuperAI accounts for generations
- Guest users will have limited access (no generation capabilities)
- The system will be more cost-effective and scalable
