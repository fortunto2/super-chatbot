# File-Based SSE Architecture Fix

**Date:** January 15, 2025  
**Type:** Critical Fix  
**Scope:** Video Generation SSE Integration

## Problem Summary

The video generation system had a critical naming confusion where `projectId` variables actually contained `fileId` values throughout the codebase. This caused incorrect SSE channels and API inconsistency.

## Root Cause

Video API returns:
```json
{
  "id": "d768160d-9e2d-4cdd-9538-0e166258fea7",  // This is fileId
  "project_id": null                              // This is projectId (optional)
}
```

But code treated `result.id` as `projectId` everywhere, causing confusion.

## Solution Implementation

### 1. Fixed API Response Handling
**File:** `lib/ai/api/generate-video.ts`
```typescript
// Before (WRONG)
const finalProjectId = result.id || chatId;

// After (CORRECT) 
const fileId = result.id;
const projectId = result.project_id || chatId;
```

### 2. Fixed Video Generator Hook  
**File:** `app/tools/video-generator/hooks/use-video-generator.ts`
- Use `result.fileId` instead of `result.projectId`
- Simplified polling with `FileService.fileGetById()`

### 3. Fixed Video Artifact Components
**Files:** `artifacts/video/client.tsx`, `artifacts/video/server.ts`
- Changed all `projectId` references to `fileId` 
- Use correct SSE channels: `file.{fileId}`

## Benefits Achieved

✅ Correct SSE events using `file.{fileId}` channels  
✅ Clear variable naming (`fileId` vs `projectId`)  
✅ Simplified file-based polling  
✅ API consistency with image generation  
✅ Better debugging and maintainability

## Testing Results

```bash
# Video generation returns correct fileId
curl -X POST /api/generate/video → {"id": "fileId", "project_id": null}

# File status check works  
curl -X GET /api/file/{fileId} → {"url": null, "tasks": [{"status": "in_progress"}]}
```

This fix resolves the critical naming confusion and establishes consistent file-based SSE architecture. 