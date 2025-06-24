# SSE File Endpoints Fix

**Date**: January 15, 2025  
**Type**: Critical Bug Fix  
**Impact**: Image Generation SSE Events  

## Problem

Image generation was failing to receive SSE events due to incorrect endpoint format:

```
❌ Old: GET http://localhost:3000/api/v1/project/xxx 404 (Not Found)
✅ New: GET http://localhost:3000/api/file/xxx 200 (OK)
```

**Root Cause**: SuperDuperAI API changed from project-based to file-based event system, but client code still used old `project.{id}` format.

## Solution

### 1. Fixed SSE Channel Format

| Component | Old Format | New Format |
|-----------|------------|------------|
| Image Artifact | `project.{projectId}` | `file.{projectId}` |
| Image SSE Hook | `/api/v1/events/project.{id}` | `/api/v1/events/file.{id}` |
| Image SSE Store | `project.{projectId}` | `file.{projectId}` |
| WebSocket Fallback | `/api/v1/ws/project.{id}` | `/api/v1/events/file.{id}` |

### 2. Key Understanding

In the current implementation:
- `parsedContent.projectId` is actually `fileId` (from `generate-image.ts` line 173)
- SSE events are sent to `file.{fileId}` channel, not `project.{projectId}`
- File status polling uses `/api/file/{fileId}` endpoint

### 3. Files Changed

- `artifacts/image/client.tsx` - Fixed SSE channel
- `hooks/use-image-sse.ts` - Fixed SSE URL format  
- `lib/websocket/image-sse-store.ts` - Fixed channel parsing and URL construction
- `lib/ai/api/generate-image-hybrid.ts` - Fixed WebSocket URL for fallback

## Technical Details

### Before (Broken)
```typescript
// Wrong channel format
channel: `project.${parsedContent.projectId}`

// Wrong SSE URL
const sseUrl = `${config.url}/api/v1/events/project.${projectId}`;

// Wrong WebSocket URL  
const wsUrl = `${config.wsURL}/api/v1/ws/project.${fileId}`;
```

### After (Fixed)
```typescript
// Correct channel format
channel: `file.${parsedContent.projectId}` // projectId is actually fileId

// Correct SSE URL
const sseUrl = `${config.url}/api/v1/events/file.${projectId}`;

// Correct SSE URL (WebSocket deprecated)
const wsUrl = `${config.wsURL}/api/v1/events/file.${fileId}`;
```

## Testing

1. Start image generation in chat
2. Check browser DevTools Network tab
3. Verify SSE connection to `/api/v1/events/file.{fileId}`
4. Confirm real-time progress updates work

## Impact

- ✅ Real-time image generation progress
- ✅ Automatic image completion updates
- ✅ No more 404 errors in console
- ✅ Proper SSE event handling 