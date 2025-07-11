# Implementation Plan: SuperDuperAI Authentication Integration

**Date**: 2025-01-29  
**AI Agent**: Claude Sonnet 4  
**Reviewer**: TBD  
**Status**: Planning

## Проблема

Сейчас для генерации изображений и видео через SuperDuperAI API используется единый токен из переменных окружения (`SUPERDUPERAI_TOKEN`), что означает:

1. **Общий баланс кредитов** - все пользователи тратят кредиты с одного аккаунта
2. **Нет персонализации** - нельзя отслеживать расходы по пользователям
3. **Масштабирование** - при росте пользователей расходы будут неконтролируемыми
4. **Безопасность** - один токен для всех операций

## Цель

Интегрировать авторизацию SuperDuperAI с существующей системой NextAuth + Auth0, чтобы каждый пользователь:

- Мог подключить свой SuperDuperAI аккаунт
- Использовал свои кредиты для генерации
- Видел свой баланс и статистику
- Управлял подключением к SuperDuperAI

## Архитектурное решение

### 1. Hybrid Authentication Architecture

```
NextAuth (Primary Auth)
    ├── Auth0 Provider (основная авторизация)
    ├── Credentials Provider (локальные аккаунты)
    ├── Guest Provider (гостевые сессии)
    └── SuperDuperAI Integration (дополнительная авторизация)
```

### 2. User Token Management

**Текущая схема пользователя:**

```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY,
  email VARCHAR(64) NOT NULL,
  password VARCHAR(64)
);
```

**Новая схема с SuperDuperAI интеграцией:**

```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY,
  email VARCHAR(64) NOT NULL,
  password VARCHAR(64),
  -- SuperDuperAI Integration
  superduperai_token VARCHAR(255), -- encrypted token
  superduperai_user_id VARCHAR(255),
  superduperai_connected_at TIMESTAMP,
  superduperai_balance INTEGER DEFAULT 0,
  superduperai_last_sync TIMESTAMP
);
```

### 3. Token Resolution Strategy

```typescript
// Приоритет получения токена:
// 1. Пользовательский токен (если подключен SuperDuperAI)
// 2. Fallback к системному токену (для неподключенных пользователей)
// 3. Guest token (для гостевых пользователей с ограничениями)

async function resolveSuperduperAIToken(userId: string): Promise<string> {
  const user = await getUserById(userId);

  if (user.superduperai_token) {
    return decrypt(user.superduperai_token);
  }

  // Fallback to system token
  return process.env.SUPERDUPERAI_TOKEN;
}
```

## Детальное планирование

### Phase 1: Database & Core Integration

#### 1.1 Database Schema Migration

```sql
-- Add SuperDuperAI fields to User table
ALTER TABLE "User" ADD COLUMN superduperai_token VARCHAR(255);
ALTER TABLE "User" ADD COLUMN superduperai_user_id VARCHAR(255);
ALTER TABLE "User" ADD COLUMN superduperai_connected_at TIMESTAMP;
ALTER TABLE "User" ADD COLUMN superduperai_balance INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN superduperai_last_sync TIMESTAMP;
```

#### 1.2 Token Encryption/Decryption Utilities

```typescript
// lib/utils/token-encryption.ts
export function encryptToken(token: string): string;
export function decryptToken(encryptedToken: string): string;
```

#### 1.3 Updated User Queries

```typescript
// lib/db/queries.ts
export async function updateUserSuperduperAI(
  userId: string,
  data: {
    token: string;
    userId: string;
    balance?: number;
  }
): Promise<void>;

export async function getUserSuperduperAIStatus(userId: string): Promise<{
  isConnected: boolean;
  balance: number;
  lastSync: Date | null;
}>;
```

### Phase 2: API Integration

#### 2.1 SuperDuperAI Auth API Routes

```typescript
// app/api/auth/superduperai/login/route.ts
export async function POST(request: Request) {
  // Redirect to SuperDuperAI OAuth
  const authUrl = `${SUPERDUPERAI_URL}/api/v1/auth/login?redirect_url=${encodeURIComponent(
    callbackUrl
  )}`;
  return Response.redirect(authUrl);
}

// app/api/auth/superduperai/callback/route.ts
export async function GET(request: Request) {
  // Handle OAuth callback
  // Extract token and user info
  // Store in database (encrypted)
  // Redirect to profile page
}

// app/api/auth/superduperai/disconnect/route.ts
export async function POST(request: Request) {
  // Remove SuperDuperAI connection for user
}

// app/api/auth/superduperai/balance/route.ts
export async function GET(request: Request) {
  // Get current user balance from SuperDuperAI
  // Sync with local database
}
```

#### 2.2 Token Resolution Middleware

```typescript
// lib/config/superduperai.ts
export async function getSuperduperAIConfigForUser(
  userId?: string
): Promise<SuperduperAIConfig> {
  if (!userId) {
    // Guest or unauthenticated - use system token
    return getSuperduperAIConfig();
  }

  const userToken = await getUserSuperduperAIToken(userId);
  if (userToken) {
    return {
      url: process.env.SUPERDUPERAI_URL,
      token: userToken,
      wsURL: process.env.SUPERDUPERAI_URL.replace("https://", "wss://"),
    };
  }

  // Fallback to system token
  return getSuperduperAIConfig();
}
```

### Phase 3: Generation Updates

#### 3.1 Updated Generation APIs

```typescript
// app/api/generate/image/route.ts
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  // Get user-specific or system config
  const config = await getSuperduperAIConfigForUser(userId);

  // Configure OpenAPI client with user token
  configureSuperduperAI(config);

  // Continue with generation...
}
```

#### 3.2 Balance Tracking

```typescript
// lib/utils/balance-tracking.ts
export async function trackGeneration(
  userId: string,
  type: "image" | "video",
  cost: number
): Promise<void> {
  // Update local balance cache
  // Optionally sync with SuperDuperAI
}
```

### Phase 4: User Interface

#### 4.1 Profile Page Components

```typescript
// components/auth/superduperai-connection.tsx
export function SuperDuperAIConnection() {
  // Shows connection status
  // Connect/Disconnect buttons
  // Balance display
  // Usage statistics
}
```

#### 4.2 Generation UI Updates

```typescript
// Show user balance before generation
// Display costs for different models
// Warning if insufficient balance
```

#### 4.3 Settings Integration

```typescript
// app/settings/page.tsx
// Add SuperDuperAI section
// Account linking
// Token management
// Usage history
```

## Security Considerations

### 1. Token Storage

- **Encryption**: All SuperDuperAI tokens encrypted in database
- **Environment**: Use strong encryption key from environment variables
- **Rotation**: Support for token refresh/rotation

### 2. Access Control

- **Authorization**: Only authenticated users can connect SuperDuperAI
- **Validation**: Verify tokens before storage
- **Audit**: Log all token operations

### 3. Error Handling

- **Graceful Fallback**: If user token invalid, fallback to system token
- **Rate Limiting**: Prevent abuse of auth endpoints
- **Error Logging**: Monitor auth failures

## Migration Strategy

### 1. Backward Compatibility

- **Phase 1**: Add new fields, keep system token as fallback
- **Phase 2**: UI for users to connect SuperDuperAI accounts
- **Phase 3**: Gradually migrate active users
- **Phase 4**: Optional system token deprecation

### 2. Data Migration

- **Existing Users**: Continue using system token until they connect
- **New Users**: Prompted to connect SuperDuperAI during onboarding
- **Guest Users**: Limited to system token with usage restrictions

### 3. Feature Flags

```typescript
// lib/config/features.ts
export const FEATURES = {
  SUPERDUPERAI_USER_AUTH: process.env.FEATURE_SUPERDUPERAI_USER_AUTH === "true",
  SYSTEM_TOKEN_FALLBACK: process.env.FEATURE_SYSTEM_TOKEN_FALLBACK === "true",
};
```

## Testing Strategy

### 1. Unit Tests

- Token encryption/decryption
- User queries
- Config resolution

### 2. Integration Tests

- SuperDuperAI OAuth flow
- Generation with user tokens
- Balance synchronization

### 3. E2E Tests

- Complete auth flow
- Generation workflows
- Error scenarios

## Metrics & Monitoring

### 1. Business Metrics

- User connection rate
- Cost per user
- Usage patterns
- Balance consumption

### 2. Technical Metrics

- Auth success/failure rates
- Token refresh frequency
- API response times
- Error rates

### 3. Dashboards

- User adoption
- Cost tracking
- System health
- Performance metrics

## Risks & Mitigation

### 1. High Risk

- **User Token Leakage**: Encrypt tokens, secure storage
- **Auth Flow Failure**: Robust error handling, fallbacks
- **Cost Explosion**: Usage limits, monitoring

### 2. Medium Risk

- **Performance Impact**: Caching, optimized queries
- **User Experience**: Clear UI, helpful messages
- **Migration Issues**: Phased rollout, testing

### 3. Low Risk

- **System Token Dependency**: Gradual migration plan
- **Documentation Lag**: Parallel documentation updates

## Success Criteria

### 1. Functional

- ✅ Users can connect SuperDuperAI accounts
- ✅ Generations use user tokens when available
- ✅ Balance tracking works accurately
- ✅ Fallback to system token when needed

### 2. Non-Functional

- ✅ Performance impact < 100ms per request
- ✅ 99.9% auth flow success rate
- ✅ Zero data breaches or token leaks
- ✅ User adoption rate > 50% within 3 months

### 3. Business

- ✅ Reduced system token costs
- ✅ Improved user engagement
- ✅ Better cost visibility and control
- ✅ Scalable cost model

## Implementation Timeline

### Week 1: Core Infrastructure

- [ ] Database schema migration
- [ ] Token encryption utilities
- [ ] Updated user queries
- [ ] Basic config resolution

### Week 2: Auth Integration

- [ ] SuperDuperAI OAuth API routes
- [ ] Callback handling
- [ ] Token storage/retrieval
- [ ] Testing auth flow

### Week 3: Generation Updates

- [ ] Update all generation APIs
- [ ] User token resolution
- [ ] Balance tracking
- [ ] Error handling

### Week 4: User Interface

- [ ] Profile page components
- [ ] Settings integration
- [ ] Generation UI updates
- [ ] Testing & refinement

### Week 5: Polish & Launch

- [ ] Documentation updates
- [ ] Performance optimization
- [ ] Final testing
- [ ] Production deployment

## Next Steps

1. **Review & Approval**: Get stakeholder approval for architecture
2. **Environment Setup**: Prepare SuperDuperAI OAuth application
3. **Database Planning**: Schedule migration window
4. **Development Start**: Begin with Phase 1 implementation
5. **Testing Strategy**: Set up test accounts and scenarios
