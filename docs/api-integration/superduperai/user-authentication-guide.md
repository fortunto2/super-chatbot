# SuperDuperAI User Authentication Guide

**Date**: 2025-01-29  
**Status**: Implementation Ready  
**Related**: [Implementation Plan](../../development/implementation-plans/superduperai-auth-integration-plan.md)

## Overview

This guide covers the implementation of user-specific SuperDuperAI authentication, allowing each user to connect their own SuperDuperAI account and use their personal credits for image and video generation.

## Architecture

### Current System (Shared Token)

```
All Users → Next.js App → System Token → SuperDuperAI API
```

### New System (User Tokens)

```
User 1 → Next.js App → User 1 Token → SuperDuperAI API
User 2 → Next.js App → User 2 Token → SuperDuperAI API
Guest  → Next.js App → System Token → SuperDuperAI API (limited)
```

## Available Authentication Endpoints

### SuperDuperAI AuthService

The auto-generated API client provides these authentication methods:

```typescript
import { AuthService, UserService } from "@/lib/api";

// 1. Initiate OAuth login
const loginResponse = await AuthService.authLogin({
  redirectUrl: "https://yourapp.com/api/auth/superduperai/callback",
});

// 2. Handle OAuth callback
const callbackResponse = await AuthService.authLoginCallback({
  redirectUrl: "https://yourapp.com/profile",
});

// 3. Get current user token
const tokenResponse = await AuthService.authToken();

// 4. Get user profile information
const userProfile = await UserService.userMe();

// 5. Logout
const logoutResponse = await AuthService.authLogout({
  redirectUrl: "https://yourapp.com/",
});
```

### User Model

The `IUserRead` interface provides user information:

```typescript
export type IUserRead = {
  sub: string; // Unique user identifier
  nickname: string; // Display name
  email: string; // User email
  given_name?: string; // First name
  family_name?: string; // Last name
  name?: string; // Full name
  picture?: string; // Avatar URL
  email_verified?: boolean;
  locale?: string;
  balance?: number; // Credit balance
  vip?: boolean; // VIP status
  admin?: boolean; // Admin privileges
  id: string; // Database ID
};
```

## Implementation Steps

### 1. Database Schema Update

Add SuperDuperAI fields to the User table:

```sql
-- Migration: Add SuperDuperAI integration fields
ALTER TABLE "User" ADD COLUMN superduperai_token VARCHAR(255);
ALTER TABLE "User" ADD COLUMN superduperai_user_id VARCHAR(255);
ALTER TABLE "User" ADD COLUMN superduperai_connected_at TIMESTAMP;
ALTER TABLE "User" ADD COLUMN superduperai_balance INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN superduperai_last_sync TIMESTAMP;

-- Add indices for performance
CREATE INDEX idx_user_superduperai_token ON "User"(superduperai_token);
CREATE INDEX idx_user_superduperai_user_id ON "User"(superduperai_user_id);
```

### 2. Token Encryption Utilities

Create secure token storage:

```typescript
// lib/utils/token-encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-gcm";

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from("superduperai"));

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, tagHex, encrypted] = encryptedToken.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from("superduperai"));
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

### 3. Database Queries

Update user queries to handle SuperDuperAI data:

```typescript
// lib/db/queries.ts
import { encryptToken, decryptToken } from "@/lib/utils/token-encryption";

export async function updateUserSuperduperAI(
  userId: string,
  data: {
    token: string;
    superduperaiUserId: string;
    balance?: number;
  }
): Promise<void> {
  const encryptedToken = encryptToken(data.token);

  await db
    .update(user)
    .set({
      superduperai_token: encryptedToken,
      superduperai_user_id: data.superduperaiUserId,
      superduperai_connected_at: new Date(),
      superduperai_balance: data.balance || 0,
      superduperai_last_sync: new Date(),
    })
    .where(eq(user.id, userId));
}

export async function getUserSuperduperAIToken(
  userId: string
): Promise<string | null> {
  const result = await db
    .select({
      token: user.superduperai_token,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!result[0]?.token) return null;

  return decryptToken(result[0].token);
}

export async function getUserSuperduperAIStatus(userId: string): Promise<{
  isConnected: boolean;
  balance: number;
  lastSync: Date | null;
  superduperaiUserId: string | null;
}> {
  const result = await db
    .select({
      token: user.superduperai_token,
      balance: user.superduperai_balance,
      lastSync: user.superduperai_last_sync,
      superduperaiUserId: user.superduperai_user_id,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const userData = result[0];

  return {
    isConnected: !!userData?.token,
    balance: userData?.balance || 0,
    lastSync: userData?.lastSync || null,
    superduperaiUserId: userData?.superduperaiUserId || null,
  };
}

export async function disconnectUserSuperduperAI(
  userId: string
): Promise<void> {
  await db
    .update(user)
    .set({
      superduperai_token: null,
      superduperai_user_id: null,
      superduperai_connected_at: null,
      superduperai_balance: 0,
      superduperai_last_sync: null,
    })
    .where(eq(user.id, userId));
}
```

### 4. Authentication API Routes

Create OAuth flow endpoints:

```typescript
// app/api/auth/superduperai/login/route.ts
import { auth } from "@/app/(auth)/auth";
import { getSuperduperAIConfig } from "@/lib/config/superduperai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = getSuperduperAIConfig();
    const callbackUrl = `${request.headers.get(
      "origin"
    )}/api/auth/superduperai/callback`;

    const authUrl = `${url}/api/v1/auth/login?redirect_url=${encodeURIComponent(
      callbackUrl
    )}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("SuperDuperAI login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/auth/superduperai/callback/route.ts
import { auth } from "@/app/(auth)/auth";
import { configureSuperduperAI } from "@/lib/config/superduperai";
import { AuthService, UserService } from "@/lib/api";
import { updateUserSuperduperAI } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(
        new URL("/profile?error=auth_failed", request.url)
      );
    }

    // Configure client for server-side use
    configureSuperduperAI();

    // Handle OAuth callback
    const callbackResponse = await AuthService.authLoginCallback({
      redirectUrl: `${request.headers.get("origin")}/profile`,
    });

    // Get token
    const tokenResponse = await AuthService.authToken();

    // Get user info
    const userInfo = await UserService.userMe();

    // Store in database
    await updateUserSuperduperAI(session.user.id, {
      token: tokenResponse, // This will be the actual token from response
      superduperaiUserId: userInfo.id,
      balance: userInfo.balance || 0,
    });

    return NextResponse.redirect(
      new URL("/profile?connected=true", request.url)
    );
  } catch (error) {
    console.error("SuperDuperAI callback error:", error);
    return NextResponse.redirect(
      new URL("/profile?error=connection_failed", request.url)
    );
  }
}
```

```typescript
// app/api/auth/superduperai/disconnect/route.ts
import { auth } from "@/app/(auth)/auth";
import { disconnectUserSuperduperAI } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await disconnectUserSuperduperAI(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SuperDuperAI disconnect error:", error);
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}
```

```typescript
// app/api/auth/superduperai/balance/route.ts
import { auth } from "@/app/(auth)/auth";
import { getUserSuperduperAIToken } from "@/lib/db/queries";
import { configureSuperduperAI } from "@/lib/config/superduperai";
import { UserService } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userToken = await getUserSuperduperAIToken(session.user.id);
    if (!userToken) {
      return NextResponse.json(
        { error: "No SuperDuperAI connection" },
        { status: 404 }
      );
    }

    // Configure client with user token
    configureSuperduperAI({
      url: process.env.SUPERDUPERAI_URL!,
      token: userToken,
      wsURL: process.env.SUPERDUPERAI_URL!.replace("https://", "wss://"),
    });

    const userInfo = await UserService.userMe();

    return NextResponse.json({
      balance: userInfo.balance || 0,
      vip: userInfo.vip || false,
      admin: userInfo.admin || false,
    });
  } catch (error) {
    console.error("SuperDuperAI balance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
```

### 5. Updated Configuration

Modify SuperDuperAI config to support user tokens:

```typescript
// lib/config/superduperai.ts
import { getUserSuperduperAIToken } from "@/lib/db/queries";

export async function getSuperduperAIConfigForUser(
  userId?: string
): Promise<SuperduperAIConfig> {
  const baseConfig = getSuperduperAIConfig();

  if (!userId) {
    // Guest or unauthenticated - use system token
    return baseConfig;
  }

  try {
    const userToken = await getUserSuperduperAIToken(userId);
    if (userToken) {
      return {
        ...baseConfig,
        token: userToken, // Use user's personal token
      };
    }
  } catch (error) {
    console.error("Failed to get user SuperDuperAI token:", error);
  }

  // Fallback to system token
  return baseConfig;
}

export async function createAuthHeadersForUser(
  userId?: string,
  config?: SuperduperAIConfig
): Promise<Record<string, string>> {
  const apiConfig = config || (await getSuperduperAIConfigForUser(userId));

  // For client-side requests, don't include Authorization header
  if (typeof window !== "undefined") {
    return {
      "Content-Type": "application/json",
    };
  }

  // Server-side - use appropriate token
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiConfig.token}`,
    "User-Agent": "SuperChatbot/3.0.22 (NextJS; AI-Chatbot)",
    "X-Client-Version": "3.0.22",
    "X-Client-Platform": "NextJS",
    "X-User-Token": userId ? "true" : "false", // Indicate if user token is used
  };
}
```

### 6. Update Generation APIs

Modify generation endpoints to use user tokens:

```typescript
// app/api/generate/image/route.ts
import { auth } from "@/app/(auth)/auth";
import { getSuperduperAIConfigForUser } from "@/lib/config/superduperai";
import { configureSuperduperAI } from "@/lib/config/superduperai";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Get user-specific or system config
    const config = await getSuperduperAIConfigForUser(userId);

    // Configure OpenAPI client with appropriate token
    configureSuperduperAI(config);

    // Continue with existing generation logic...
    const params = await request.json();

    // Generate image using user's token
    const result = await FileService.fileGenerateImage({
      requestBody: {
        prompt: params.prompt,
        config_id: params.modelId,
        params: {
          width: params.width,
          height: params.height,
          quality: params.quality,
        },
      },
    });

    // Optional: Track usage for user
    if (userId) {
      await trackGeneration(userId, "image", calculateImageCost(params));
    }

    return Response.json(result);
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
```

### 7. User Interface Components

Create UI for SuperDuperAI account management:

```typescript
// components/auth/superduperai-connection.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoaderIcon, CheckIcon, XIcon } from "@/components/icons";

interface SuperDuperAIStatus {
  isConnected: boolean;
  balance: number;
  lastSync: Date | null;
  superduperaiUserId: string | null;
}

export function SuperDuperAIConnection() {
  const [status, setStatus] = useState<SuperDuperAIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/auth/superduperai/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch SuperDuperAI status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/auth/superduperai/login", {
        method: "POST",
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error("Failed to initiate SuperDuperAI connection:", error);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/auth/superduperai/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        await fetchStatus(); // Refresh status
      }
    } catch (error) {
      console.error("Failed to disconnect SuperDuperAI:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoaderIcon
            className="animate-spin"
            size={24}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          SuperDuperAI Connection
          {status?.isConnected ? (
            <Badge
              variant="default"
              className="bg-green-500"
            >
              <CheckIcon
                size={12}
                className="mr-1"
              />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XIcon
                size={12}
                className="mr-1"
              />
              Not Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your SuperDuperAI account to use your personal credits for
          image and video generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.isConnected ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Balance</p>
                <p className="text-2xl font-bold">{status.balance} credits</p>
              </div>
              <div>
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground">
                  {status.superduperaiUserId}
                </p>
              </div>
            </div>

            {status.lastSync && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(status.lastSync).toLocaleString()}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchStatus}
              >
                Refresh Balance
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your SuperDuperAI account to:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Use your personal credits</li>
              <li>• Track your usage and costs</li>
              <li>• Access premium features</li>
              <li>• Keep your generations private</li>
            </ul>

            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <LoaderIcon
                    className="animate-spin mr-2"
                    size={16}
                  />
                  Connecting...
                </>
              ) : (
                "Connect SuperDuperAI Account"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Usage Tracking

Implement usage tracking for cost management:

```typescript
// lib/utils/balance-tracking.ts
import { db } from "@/lib/db/drizzle";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function trackGeneration(
  userId: string,
  type: "image" | "video",
  estimatedCost: number
): Promise<void> {
  try {
    // Update local balance cache (optional)
    await db
      .update(user)
      .set({
        superduperai_balance: sql`superduperai_balance - ${estimatedCost}`,
        superduperai_last_sync: new Date(),
      })
      .where(eq(user.id, userId));

    // Log usage for analytics
    console.log(
      `User ${userId} generated ${type}, estimated cost: ${estimatedCost} credits`
    );
  } catch (error) {
    console.error("Failed to track generation:", error);
  }
}

export function calculateImageCost(params: any): number {
  // Calculate cost based on model, resolution, etc.
  const baseImageCost = 1; // 1 credit per image
  const resolutionMultiplier = (params.width * params.height) / (1024 * 1024);
  return Math.ceil(baseImageCost * resolutionMultiplier);
}

export function calculateVideoCost(params: any): number {
  // Calculate cost based on duration, resolution, etc.
  const baseCostPerSecond = 5; // 5 credits per second
  const duration = params.duration || 5;
  return baseCostPerSecond * duration;
}
```

## Environment Variables

Add required environment variables:

```bash
# .env.local
TOKEN_ENCRYPTION_KEY=your_very_secure_32_char_encryption_key_here

# Feature flags
FEATURE_SUPERDUPERAI_USER_AUTH=true
FEATURE_SYSTEM_TOKEN_FALLBACK=true

# Existing variables
SUPERDUPERAI_URL=https://dev-editor.superduperai.co
SUPERDUPERAI_TOKEN=your_system_token_here
```

## Security Considerations

### 1. Token Encryption

- All user tokens are encrypted before database storage
- Use AES-256-GCM for authenticated encryption
- Store encryption key securely in environment variables

### 2. Access Control

- Only authenticated users can connect SuperDuperAI accounts
- Validate all OAuth flows and callbacks
- Implement rate limiting on auth endpoints

### 3. Error Handling

- Graceful fallback to system token if user token fails
- Don't expose token errors to client
- Log security-related events

### 4. Data Privacy

- Never log or expose actual tokens
- Implement token rotation support
- Allow users to disconnect and remove data

## Testing

### Unit Tests

```typescript
// __tests__/auth/superduperai.test.ts
import { encryptToken, decryptToken } from "@/lib/utils/token-encryption";

describe("SuperDuperAI Token Encryption", () => {
  it("should encrypt and decrypt tokens correctly", () => {
    const originalToken = "sk-test-token-123";
    const encrypted = encryptToken(originalToken);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(originalToken);
    expect(encrypted).not.toBe(originalToken);
  });
});
```

### Integration Tests

```typescript
// __tests__/auth/oauth-flow.test.ts
describe("SuperDuperAI OAuth Flow", () => {
  it("should handle complete OAuth flow", async () => {
    // Test login initiation
    // Test callback handling
    // Test token storage
    // Test user info retrieval
  });
});
```

## Migration Guide

### For Existing Users

1. Current functionality remains unchanged
2. Users see option to "Connect SuperDuperAI Account" in profile
3. After connection, generations use their personal tokens
4. System token remains as fallback

### For New Users

1. During onboarding, show benefits of connecting SuperDuperAI
2. Optional connection step
3. Guest users limited to system token with usage restrictions

## Monitoring

Track key metrics:

- User connection adoption rate
- Cost distribution (system vs user tokens)
- Auth success/failure rates
- Token refresh frequency
- Usage patterns by user type

## Support

### Common Issues

**Q: What if my SuperDuperAI token expires?**
A: The system will automatically attempt to refresh the token. If that fails, it will fallback to the system token and notify you to reconnect.

**Q: Can I still use the service without connecting SuperDuperAI?**
A: Yes, the system will use the shared system token for generations, but you won't be able to track personal usage or costs.

**Q: How secure is my SuperDuperAI token?**
A: Tokens are encrypted using AES-256-GCM before storage and are never logged or exposed in client-side code.

**Q: Can I disconnect my SuperDuperAI account?**
A: Yes, you can disconnect at any time from your profile page. This will remove all stored token data.

## Next Steps

1. **Review & Approval**: Get stakeholder approval for architecture
2. **Database Migration**: Plan and execute schema changes
3. **Development**: Implement in phases as outlined in the implementation plan
4. **Testing**: Comprehensive testing of auth flows and edge cases
5. **Rollout**: Gradual rollout with feature flags and monitoring
