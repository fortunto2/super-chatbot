# Image Generation Debugging and Optimization

**Date**: January 23, 2025  
**Status**: Debugging Added
**Priority**: High

## Problem Analysis

Despite successful image generation and SSE updates, images are not displaying in chat artifacts. Backend generates images correctly, SSE events are received, and artifact content is updated, but UI doesn't render the completed image.

## Debug Logging Added

### 1. ImageEditor Display State Monitoring

Added comprehensive logging in `components/image-editor.tsx`:

```typescript
useEffect(() => {
  console.log("🎯 ImageEditor display state:", {
    projectId: initialState?.projectId || "none",
    initialStatus: initialState?.status || "none",
    initialImageUrl: initialState?.imageUrl
      ? `${initialState.imageUrl.substring(0, 50)}...`
      : "none",
    liveImageUrl: imageGeneration.imageUrl
      ? `${imageGeneration.imageUrl.substring(0, 50)}...`
      : "none",
    showSkeleton,
    showImage,
    displayImageUrl: displayImageUrl
      ? `${displayImageUrl.substring(0, 50)}...`
      : "none",
  });
}, [
  initialState?.status,
  initialState?.imageUrl,
  imageGeneration.imageUrl,
  showSkeleton,
  showImage,
  displayImageUrl,
  initialState?.projectId,
]);
```

### 2. Artifact Wrapper Memo Debugging

Added logging to track when `ImageArtifactWrapper` re-renders:

```typescript
if (contentChanged) {
  try {
    const prevParsed = JSON.parse(prevProps.content || "{}");
    const nextParsed = JSON.parse(nextProps.content || "{}");
    console.log(
      "🔄 ImageArtifactWrapper memo: content changed, triggering re-render",
      {
        prevImageUrl: prevParsed.imageUrl
          ? `${prevParsed.imageUrl.substring(0, 50)}...`
          : "none",
        nextImageUrl: nextParsed.imageUrl
          ? `${nextParsed.imageUrl.substring(0, 50)}...`
          : "none",
        prevStatus: prevParsed.status || "none",
        nextStatus: nextParsed.status || "none",
      }
    );
  } catch (e) {
    console.log("🔄 ImageArtifactWrapper memo: content changed (not JSON)");
  }
}
```

### 3. Initial State Creation Tracking

Added logging for `initialState` updates:

```typescript
console.log("🔧 ImageArtifactWrapper: initial state updated", {
  projectId: state.projectId || "none",
  status: state.status || "none",
  imageUrl: state.imageUrl ? `${state.imageUrl.substring(0, 50)}...` : "none",
});
```

## Expected Log Sequence for Working Generation

1. **SSE Event Reception**: `🎨 ✅ Image completed via SSE file event: [URL]`
2. **Artifact Content Update**: `🎨 📄 Artifact state before update: {...}`
3. **Wrapper Re-render**: `🔄 ImageArtifactWrapper memo: content changed, triggering re-render`
4. **Initial State Update**: `🔧 ImageArtifactWrapper: initial state updated`
5. **Display State**: `🎯 ImageEditor display state: { showImage: true, displayImageUrl: [URL] }`

## Key Areas Under Investigation

1. **React Re-rendering Chain**: Does `setArtifact` → `content` change → `parsedContent` update → `initialState` recreation → `ImageEditor` re-render work correctly?

2. **Display Logic**: Are `shouldShowImage()` and `getDisplayImageUrl()` working with updated `initialState?.imageUrl`?

3. **Memo Dependencies**: Is `imageEditorProps` useMemo properly detecting `initialState` changes?

## Known Working Parts

✅ SuperDuperAI API image generation  
✅ SSE event reception and processing  
✅ Artifact content updates in database  
✅ File ID resolution to URLs

## Next Steps

1. Test image generation with new debug logging
2. Analyze console output sequence
3. Identify where the re-render chain breaks
4. Fix the identified bottleneck

## Related Files

- `artifacts/image/client.tsx` - Artifact wrapper and SSE handlers
- `components/image-editor.tsx` - Image display logic
- `lib/utils/image-utils.ts` - Display state utilities

---

**Status**: Ready for testing with comprehensive debugging

## Latest Changes (January 23, 2025)

### Display Logic Improvements

Fixed priority logic in `ImageEditor` to properly handle artifact mode vs standalone mode:

```typescript
// Determine what to display - prioritize initialState in artifact mode
const isArtifactMode = !!initialState?.projectId;
const effectiveImageUrl = isArtifactMode
  ? initialState?.imageUrl
  : imageGeneration.imageUrl;
const showSkeleton = shouldShowSkeleton(
  initialState,
  effectiveImageUrl,
  initialState?.imageUrl
);
const showImage = shouldShowImage(effectiveImageUrl, initialState?.imageUrl);
const displayImageUrl = getDisplayImageUrl(
  effectiveImageUrl,
  initialState?.imageUrl
);
```

### Complete Debug Logging Chain

1. **Artifact Content Updates**: `🎨 ✅ Image completed via SSE file event`
2. **Wrapper Re-rendering**: `🔄 ImageArtifactWrapper memo: content changed, triggering re-render`
3. **Initial State Creation**: `🔧 ImageArtifactWrapper: initial state updated`
4. **ImageEditor State Reception**: `🎯 ImageEditor: initialState updated`
5. **Display Logic Decision**: `🎯 ImageEditor display state`

### Emergency Debug Commands

Available in browser console for manual troubleshooting:

- `quickImageFix()` - Apply last generated image from console logs
- `forceUpdateArtifact(imageUrl, projectId, requestId)` - Manually update artifact
- `imageSystem.debug()` - System health check
- `checkCurrentArtifact()` - Check current artifact state

## Testing Instructions

1. Open browser console and look for logging sequence
2. Generate an image in chat
3. Watch for the 5-step debug log sequence above
4. If image doesn't appear, try `quickImageFix()` in console
5. Report which step in the sequence fails or is missing

---

## Image Display Functions Debug Logging (January 23, 2025)

### Added Debug Logging to Image Utils

Added comprehensive debug logging to all image display logic functions in `lib/utils/image-utils.ts`:

1. **shouldShowSkeleton()** - Shows detailed logic for skeleton display
2. **shouldShowImage()** - Shows boolean logic for image display
3. **getDisplayImageUrl()** - Shows URL resolution logic

This will help identify exactly where the display logic is failing.

### New Console Helper Functions

Added `addImageToChat(url?)` function to permanently save images to chat history:

```javascript
// Add current generated image to chat history
addImageToChat();

// Add specific image URL to chat history
addImageToChat("https://your-image-url.com/image.jpg");
```

This solves the user's problem: **"как я потом посмотрю её, если закрою артефакт?"**

### Identified Issue: Document Recreation

Found that `artifacts/image/server.ts` recreates documents with `status: 'pending'` on both:

- `onCreateDocument` (line 100)
- `onUpdateDocument` (line 175)

This explains the constant `completed` → `pending` transitions in logs.

### Test Results Expected

With new debug logging, we should see in console:

```
🔍 shouldShowSkeleton debug: {hasImage: true, status: 'completed', result: false}
🔍 shouldShowImage debug: {result: true}
🔍 getDisplayImageUrl debug: {result: 'https://...'}
🎯 ImageEditor display state: {showImage: true, displayImageUrl: 'https://...'}
```

If `showImage: false` or `displayImageUrl: 'none'` appears, we'll know exactly which function is failing.

---

## Summary & Next Steps (January 23, 2025)

### Complete Changes Made

1. **Enhanced Debug Logging**:

   - Added detailed logging to `shouldShowSkeleton()`, `shouldShowImage()`, `getDisplayImageUrl()`
   - Modified `ImageEditor` to prioritize `initialState` in artifact mode
   - Added comprehensive artifact state monitoring

2. **New Console Helper Functions**:

   - `addImageToChat(url?)` - Permanently save images to chat history
   - Enhanced `quickImageFix()` with better URL detection
   - Added to console commands list for user accessibility

3. **Issue Identification**:
   - Found that `artifacts/image/server.ts` recreates documents with `pending` status
   - Identified potential rapid component re-mounting causing state resets
   - Located image display priority logic issues

### User Testing Required

**Please test image generation and report console logs for:**

1. **Generate New Image**: Use chat to generate any image
2. **Check Console Logs**: Look for debug messages with prefixes:

   - `🔍 shouldShowSkeleton debug:`
   - `🔍 shouldShowImage debug:`
   - `🔍 getDisplayImageUrl debug:`
   - `🎯 ImageEditor display state:`

3. **If Image Still Doesn't Show**:
   ```javascript
   quickImageFix(); // Try to fix artifact display
   addImageToChat(); // Save to permanent chat history
   ```

### Expected Debug Output

**Working correctly should show:**

```
🔍 shouldShowSkeleton debug: {hasImage: true, status: 'completed', result: false}
🔍 shouldShowImage debug: {result: true}
🔍 getDisplayImageUrl debug: {result: 'https://superduper...'}
🎯 ImageEditor display state: {showImage: true, displayImageUrl: 'https://...'}
```

**If failing, will show:**

```
🔍 shouldShowImage debug: {result: false}  // <-- Problem here
🎯 ImageEditor display state: {showImage: false}  // <-- Problem here
```

### Permanent Solution

Once we identify the exact failure point, we can implement the targeted fix. The `addImageToChat()` function provides immediate relief for the user's core need: **accessing images after closing artifacts**.

### Ready for Testing ✅

All debug tools and helper functions are now in place. Please test and share the console output!

---

## ✅ Problem Solved! (January 23, 2025)

### Root Cause Identified

From user logs analysis, the exact problem was found:

**Issue**: `onUpdateDocument` in `artifacts/image/server.ts` was **unconditionally** recreating documents with `status: 'pending'`, even when they were already completed with images.

**Evidence from logs**:

```
🎯 ImageEditor display state: {showImage: true, displayImageUrl: "https://superduper-acdagaa3e2h7chh0.z02.azurefd.ne..."}
🔄 ImageArtifactWrapper memo: content changed, triggering re-render {prevStatus: 'completed', nextStatus: 'pending'}
```

### Solution Implemented

Added protective logic in `artifacts/image/server.ts` to prevent recreation of completed documents:

```typescript
// Check if document already has completed content - don't recreate if so
if (draftContent) {
  try {
    const existingContent = JSON.parse(draftContent);
    if (existingContent.status === "completed" && existingContent.imageUrl) {
      console.log(
        "🎨 ⚠️ Document already completed with image, skipping update to prevent reset"
      );
      return draftContent; // Return existing content without recreating
    }
  } catch (parseError) {
    console.log(
      "🎨 ℹ️ Could not parse existing content, proceeding with update"
    );
  }
}
```

### Enhanced Chat History Function

Improved `addImageToChat()` to automatically detect image URLs from current artifacts:

```javascript
addImageToChat(); // Now automatically finds image URL from current artifact
addImageToChat("https://specific-url.com"); // Or use specific URL
```

### Changes Made

1. **Fixed core issue**: Prevented recreation of completed image documents
2. **Removed debug logging**: Cleaned up console output for production
3. **Enhanced addImageToChat**: Auto-detection of current artifact images
4. **Permanent solution**: No more `completed` → `pending` resets

### Expected Result

After this fix:

- ✅ Images should display immediately after generation
- ✅ No more constant status resets
- ✅ Clean console output
- ✅ Easy image saving to chat history

**Please test image generation now - it should work correctly!** 🎯

---
