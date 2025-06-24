# SSE Architecture Simplification

**Date**: January 15, 2025  
**Type**: Architecture Improvement  
**Impact**: Image/Video Generation SSE Events  

## Summary

Simplified SSE architecture to use only file-based events for image and video generation, removing confusion between projectId and fileId.

## Key Changes

### 1. Simplified Config Functions

**Before (Complex):**
```typescript
createSSEURL(channelType: SSEChannelType, channelId: string)
```

**After (Simple):**
```typescript
createFileSSEURL(fileId: string)    // For image/video generation
createProjectSSEURL(projectId: string)  // For other features  
createUserSSEURL(userId: string)    // For user-level events
```

### 2. Updated useImageSSE Hook

**Before:**
```typescript
useImageSSE({ 
  fileId?: string, 
  projectId?: string, 
  userId?: string 
})
```

**After:**
```typescript
useImageSSE({ 
  fileId: string  // Only fileId needed
})
```

### 3. Fixed Naming Confusion

- `parsedContent.projectId` is actually `fileId` from `generate-image.ts`
- All image/video SSE events now use `file.{fileId}` channel
- No more confusion between project and file IDs

## Files Modified

- `lib/config/superduperai.ts` - Added 3 simple SSE URL functions
- `hooks/use-image-sse.ts` - Simplified to fileId only
- `artifacts/image/client.tsx` - Updated to use fileId directly
- `lib/websocket/image-sse-store.ts` - Fixed variable naming

## Benefits

- ✅ Clear separation: files for generation, projects for other features
- ✅ No more projectId/fileId confusion
- ✅ Simpler API with dedicated functions
- ✅ Better maintainability

## Usage Examples

```typescript
// Image generation SSE
const sseUrl = createFileSSEURL(fileId);

// Project-level events (future use)  
const sseUrl = createProjectSSEURL(projectId);

// User-level events (future use)
const sseUrl = createUserSSEURL(userId);
``` 