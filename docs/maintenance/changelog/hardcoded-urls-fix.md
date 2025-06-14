# Hardcoded URLs and Tokens Fix

**Date**: June 14, 2025  
**Type**: Security & Configuration Fix  
**Impact**: Critical - Proper environment-based configuration

## Problem

The codebase contained multiple hardcoded URLs and API tokens, which caused several issues:

1. **Security Risk**: Hardcoded tokens in source code
2. **Environment Mismatch**: WebSocket connections using wrong domains (prod vs dev)
3. **Configuration Inconsistency**: Different files using different hardcoded values
4. **Deployment Issues**: Unable to switch between environments properly

## Root Cause Analysis

### Hardcoded URLs Found
- `wss://editor.superduperai.co` in WebSocket connections
- `https://editor.superduperai.co` in API calls
- Mixed usage of dev and prod URLs

### Hardcoded Tokens Found
- `afda4dc28cf1420db6d3e35a291c2d5f` in multiple files
- `9ab6d5b74e654a7887015a4fa2b10e7f` in conditional logic

## Solution

### 1. Fixed WebSocket URL Configuration

**Files Updated:**
- `hooks/use-chat-image-websocket.ts`
- `lib/websocket/image-websocket-store.ts`
- `hooks/use-image-websocket.ts`
- `hooks/use-artifact-websocket.ts`
- `lib/utils/console-helpers.ts`

**Before:**
```typescript
const url = `wss://editor.superduperai.co/api/v1/ws/project.${projectId}`;
```

**After:**
```typescript
const config = getSuperduperAIConfig();
const url = createWSURL(`/api/v1/ws/project.${projectId}`, config);
```

### 2. Fixed API URL Configuration

**Files Updated:**
- `lib/ai/api/get-image-project.ts`
- `lib/ai/api/get-styles.ts`

**Before:**
```typescript
const url = "https://editor.superduperai.co";
const token = "afda4dc28cf1420db6d3e35a291c2d5f";
```

**After:**
```typescript
const config = getSuperduperAIConfig();
const url = config.baseURL;
const token = config.apiToken;
```

### 3. Centralized Configuration

All URLs and tokens now use the centralized configuration from `lib/config/superduperai.ts`:

```typescript
export function getSuperduperAIConfig(): SuperDuperAIConfig {
  const baseURL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
  const wsURL = baseURL.replace('https://', 'wss://').replace('http://', 'ws://');
  const apiToken = process.env.SUPERDUPERAI_TOKEN || '';
  
  return { baseURL, wsURL, apiToken };
}
```

## Benefits

✅ **Security**: No more hardcoded tokens in source code  
✅ **Environment Consistency**: WebSocket and API use same domain  
✅ **Easy Deployment**: Single environment variable controls all endpoints  
✅ **Development Flexibility**: Easy switching between dev/prod environments  

## Environment Variables

Required environment variables:
```bash
SUPERDUPERAI_URL="https://dev-editor.superduperai.co"  # or prod URL
SUPERDUPERAI_TOKEN="your-api-token-here"
```

## Testing

- ✅ WebSocket connections now use correct domain
- ✅ API calls use environment-based URLs
- ✅ Token authentication uses environment variables
- ✅ Easy switching between dev/prod environments

## Migration Notes

For existing deployments, ensure these environment variables are set:
- `SUPERDUPERAI_URL` - API base URL
- `SUPERDUPERAI_TOKEN` - API authentication token

The system will fall back to dev environment if variables are not set. 