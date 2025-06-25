# Artifact Polling File Endpoint Fix

**Date**: 2025-01-25  
**Type**: Critical Bug Fix  
**Scope**: Image Artifacts, Polling Fallback

## Problem Description

Artifact polling fallback was using wrong endpoint `/api/project/{fileId}` instead of `/api/file/{fileId}`. This caused:

1. **404 Errors**: Polling failed with "Not Found" because `fileId` is not a project ID
2. **Broken Fallback**: When SSE worked but polling failed, users saw error logs
3. **Architecture Mismatch**: SSE uses `file.{fileId}` format, polling should match

## Root Cause

In `artifacts/image/client.tsx`, polling was designed for project-based architecture but image generation returns file IDs, not project IDs:

```typescript
// WRONG: Trying to get project by file ID
const response = await fetch(`/api/project/${fileId}`);

// CORRECT: Get file by file ID
const response = await fetch(`/api/file/${fileId}`);
```

## Solution Implementation

### Fixed Polling Logic

**File**: `artifacts/image/client.tsx` (lines 108-165)

1. **Correct Endpoint**: Changed from `/api/project/${fileId}` to `/api/file/${fileId}`
2. **Simplified Logic**: Direct file response handling instead of complex project data parsing
3. **Unified Architecture**: Both SSE and polling now work with file endpoints

### Before vs After

**Before** (Broken):

```typescript
const response = await fetch(`/api/project/${fileId}`);
const project = await response.json();
// Complex logic to find image in project.data array
const imageData = project.data?.find(...)
```

**After** (Fixed):

```typescript
const response = await fetch(`/api/file/${fileId}`);
const file = await response.json();
// Simple direct check
if (file.url && file.type === "image") {
  // Use file.url directly
}
```

## Technical Details

### API Architecture Alignment

- **SSE**: `/api/events/file.{fileId}` ✅
- **Polling**: `/api/file/{fileId}` ✅ (Now matches!)
- **File Resolution**: Both use file-based endpoints consistently

### Error Elimination

- **No more 404s**: Polling uses correct endpoint
- **Cleaner Logs**: No more "project not found" errors
- **Better UX**: Fallback actually works when SSE fails

## Impact

### Immediate Benefits

- ✅ Polling fallback now works correctly
- ✅ No more 404 error spam in console
- ✅ Better reliability when SSE connections fail

### Performance

- ✅ Simplified polling logic (direct file access vs project data parsing)
- ✅ Faster polling responses (file endpoint is lighter than project)

## Verification

Test polling by:

1. Generate image in chatbot
2. Temporarily disable SSE in DevTools Network tab
3. Verify polling successfully retrieves completed image
4. Check no 404 errors in console

## Files Modified

- `artifacts/image/client.tsx` - Fixed polling endpoint and logic

## Related Issues

This fix resolves the fundamental architecture mismatch between SSE (file-based) and polling (was project-based) for image artifacts.
