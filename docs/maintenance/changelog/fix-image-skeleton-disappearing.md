# Fix: Image Generation Skeleton Disappearing Issue

**Date:** 2025-01-27  
**Type:** Bug Fix  
**Severity:** Medium  
**Component:** Image Artifacts

## Problem

Loading skeletons were disappearing during image generation in chat, making the interface appear broken. Users would see no visual feedback during the generation process.

## Root Cause Analysis

Through detailed debugging with console logs, discovered that `onStreamPart` in `imageArtifact` was **unconditionally overwriting content** with new stream parts, including invalid JSON:

```typescript
onStreamPart: ({ streamPart, setArtifact }) => {
  if (streamPart.type === "text-delta") {
    // BUG: Always overwrites content, even with invalid JSON
    setArtifact((draft) => ({
      ...draft,
      content: streamPart.content as string,
      isVisible: true,
    }));
  }
};
```

**Timeline of bug:**

1. Initial valid JSON content: `{status: 'pending', projectId: '...'}` (1559 chars)
2. AI streams continue, `text-delta` arrives with empty/incomplete content: `''`
3. `onStreamPart` overwrites valid content with empty string
4. JSON parsing fails: `'Unexpected end of JSON input'`
5. `parsedContent` becomes `null`, skeletons disappear

## Solution

Added **JSON validation** before overwriting content:

```typescript
onStreamPart: ({ streamPart, setArtifact }) => {
  if (streamPart.type === "text-delta") {
    // AICODE-FIX: Validate JSON content before overwriting to prevent skeleton disappearing
    const newContent = streamPart.content as string;
    try {
      JSON.parse(newContent);
      setArtifact((draft) => ({
        ...draft,
        content: newContent,
        isVisible: true,
      }));
    } catch {
      // Invalid JSON - don't overwrite existing content
      console.log("🖼️ ⚠️ Skipping invalid JSON content in stream part");
    }
  }
};
```

## Technical Details

**Files Modified:**

- `artifacts/image/client.tsx` - Added JSON validation in `onStreamPart`

**Protection Mechanism:**

- Only update content if new content is valid JSON
- Preserve existing valid content when stream parts contain partial/invalid data
- Maintain skeleton display during loading states

**Debugging Approach:**

- Added comprehensive console logs to trace content changes
- Identified exact moment when content gets corrupted
- Removed debug logs after fix confirmation

## Impact

- ✅ **Fixed:** Skeletons now display consistently during image generation
- ✅ **Improved:** User experience with proper loading feedback
- ✅ **Protected:** Content integrity during streaming
- ✅ **Maintained:** Backward compatibility with existing functionality

## Testing

The fix ensures:

1. Skeletons appear immediately when image generation starts
2. Skeletons remain visible during entire generation process
3. Completed images display properly when ready
4. Invalid stream parts don't break the interface

## Architecture Notes

This fix demonstrates the importance of **defensive programming** in streaming interfaces:

- Always validate streamed content before state updates
- Preserve valid state when receiving invalid updates
- Implement graceful degradation for parsing failures

The solution maintains the streaming architecture while adding necessary content validation to prevent UI breakage.
