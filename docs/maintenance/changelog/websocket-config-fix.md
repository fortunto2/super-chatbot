# WebSocket Configuration Fix

## Issue Description
WebSocket connections were failing with "undefined" errors because the `wsURL` property was missing from the SuperDuperAI configuration object.

## Root Cause
The `SuperduperAIConfig` interface and `getSuperduperAIConfig()` function were missing the `wsURL` field, but the code was trying to access `config.wsURL` in multiple places:

- `lib/websocket/image-websocket-store.ts`
- `hooks/use-image-websocket.ts`
- `hooks/use-artifact-websocket.ts`
- `hooks/use-chat-image-websocket.ts`
- Various test files

## Error Symptoms
```
Should connect WebSocket: false chatId: undefined
Creating event handlers array for chatId: undefined requestId: undefined
WebSocket connection error: wsURL is undefined
```

## Solution Applied

### 1. Updated Interface
```typescript
interface SuperduperAIConfig {
  url: string;
  token: string;
  wsURL: string; // Added this field
}
```

### 2. Updated Configuration Function
```typescript
export function getSuperduperAIConfig(): SuperduperAIConfig {
  const url = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
  const token = process.env.SUPERDUPERAI_TOKEN || process.env.SUPERDUPERAI_API_KEY || '';
  const wsURL = url.replace('https://', 'wss://').replace('http://', 'ws://'); // Added WebSocket URL generation

  if (!token) {
    throw new Error('SUPERDUPERAI_TOKEN or SUPERDUPERAI_API_KEY environment variable is required');
  }

  return { url, token, wsURL }; // Added wsURL to return object
}
```

### 3. Updated WebSocket URL Creation
```typescript
export function createWSURL(path: string, config?: SuperduperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  return `${apiConfig.wsURL}${path}`; // Changed from url to wsURL
}
```

## Testing
Created `test-websocket.js` script to verify the configuration works correctly.

## Files Modified
- `lib/config/superduperai.ts` - Main configuration fix
- `test-websocket.js` - Test script for verification

## Expected Result
- WebSocket connections should now work properly
- Chat image generation should receive real-time updates
- Console errors about undefined WebSocket URLs should be resolved

## Environment Requirements
Ensure `SUPERDUPERAI_URL` is set in your environment variables. If not set, it defaults to `https://dev-editor.superduperai.co`.

## WebSocket URL Examples
- HTTP URL: `https://dev-editor.superduperai.co`
- WebSocket URL: `wss://dev-editor.superduperai.co`
- Full WebSocket path: `wss://dev-editor.superduperai.co/api/v1/ws/project.{projectId}` 