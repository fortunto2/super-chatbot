# Image Generation Premature SSE Connection Fix

**Date:** 2025-01-21  
**Issue:** useImageGeneration hook was creating SSE connections immediately on component load using chatId as fileId  
**Severity:** High - Performance and architectural issue

## Problem Analysis

### Original Behavior

- `useImageGeneration` hook automatically connected to SSE when receiving any `chatId`
- Used `chatId` directly as `fileId` for SSE connection: `file.{chatId}`
- This created invalid SSE connections like `/api/events/file.0a107c66-61f8-43b6-b544-c647c1300214`
- Connections were attempted even when no image generation was active

### Root Cause in Image Editor

```typescript
// components/image-editor.tsx
const effectiveProjectId = initialState?.projectId || chatId;
const imageGeneration = useImageGeneration(effectiveProjectId);
```

When `initialState?.projectId` was undefined, `chatId` was passed to `useImageGeneration`, which treated it as a file ID.

### Original useImageGeneration Hook Logic

```typescript
// hooks/use-image-generation.ts (BEFORE)
const websocketOptions = useMemo(() => {
  const shouldConnect = !!chatIdState && mountedRef.current;

  return {
    fileId: chatIdState || "", // ← Used chatId as fileId!
    eventHandlers,
    enabled: shouldConnect, // ← Always enabled if chatId exists
  };
}, [chatIdState, eventHandlers]);
```

### Error Symptoms

```
🔌 Initializing SSE connection for ID: 0a107c66-61f8-43b6-b544-c647c1300214 (file)
❌ SSE error: Event {type: 'error'}
GET /api/events/file.0a107c66-61f8-43b6-b544-c647c1300214 net::ERR_EMPTY_RESPONSE
```

## Solution Implementation

### Smart Connection Logic

Changed `useImageGeneration` to only connect when there's actual image generation in progress:

```typescript
// hooks/use-image-generation.ts (AFTER)
const websocketOptions = useMemo(() => {
  // Only connect if we have a real projectId from active generation, not just chatId
  const hasActiveGeneration = !!(state.projectId && state.isGenerating);
  const shouldConnect =
    !!chatIdState && mountedRef.current && hasActiveGeneration;

  return {
    fileId: (state.projectId || chatIdState) ?? "",
    eventHandlers,
    enabled: shouldConnect, // ← Only enabled during active generation
  };
}, [chatIdState, eventHandlers, state.projectId, state.isGenerating]);
```

### Key Changes

#### 1. **Conditional Connection**

- SSE only connects when `state.projectId` exists AND `state.isGenerating` is true
- No more automatic connections on component mount

#### 2. **Proper File ID Usage**

- Uses `state.projectId` (real project ID from generation) as primary `fileId`
- Falls back to `chatIdState` only when needed

#### 3. **State-Based Enablement**

- `enabled` flag now depends on active generation state
- Prevents premature connections

## Technical Benefits

### Performance Improvements

- **Zero unnecessary connections**: No SSE attempts without active generation
- **Proper resource management**: Connections only when needed
- **Reduced error noise**: Eliminates failed connection attempts

### Architectural Benefits

- **Correct ID usage**: Uses actual project IDs instead of chat IDs
- **State-driven connections**: SSE lifecycle matches generation lifecycle
- **Better separation**: Clear distinction between chat context and generation context

## Impact on Components

### Image Editor Behavior

**Before Fix:**

```
1. Component loads with chatId
2. useImageGeneration immediately tries SSE connection to file.{chatId}
3. Connection fails (chatId is not a file ID)
4. Continuous error logs
```

**After Fix:**

```
1. Component loads with chatId
2. useImageGeneration waits for active generation
3. SSE connection only when generation starts with real projectId
4. Clean, error-free behavior
```

### Tool Components Unaffected

- Image generator tool continues working correctly
- Video generator tool maintains existing behavior
- Only impacts standalone image editor usage

## Testing Verification

### Before Fix

```bash
# Navigate to any chat page
# Console immediately shows:
🔌 Initializing SSE connection for ID: [chat-id] (file)
❌ SSE error: Event {type: 'error'}
GET /api/events/file.[chat-id] net::ERR_EMPTY_RESPONSE
```

### After Fix

```bash
# Navigate to any chat page
# No automatic SSE connections
# Clean console output

# Start image generation
🔌 Initializing SSE connection for ID: [real-project-id] (file)
✅ SSE connection successful
```

## Files Modified

### Core Changes

- **hooks/use-image-generation.ts**
  - Added state-based connection logic
  - Proper projectId vs chatId handling
  - Smart enablement conditions

### Documentation

- **docs/maintenance/changelog/image-generation-premature-sse-fix.md**
  - Complete fix documentation
  - Technical analysis and solutions

## Related Issues

This fix resolves:

- Premature SSE connections using invalid file IDs
- Console error spam on chat page loads
- Resource waste from failed connection attempts
- Architectural confusion between chat IDs and file IDs

Maintains compatibility with:

- [SSE On-Demand Connection Fix](./sse-on-demand-connection-fix.md)
- [Video Generation Duplication Fix](./video-generation-duplication-fix.md)
- All existing generation workflows

## Future Considerations

### Recommended Pattern

For any component using `useImageGeneration`:

```typescript
// ✅ Good: Only pass projectId when generation is active
const imageGeneration = useImageGeneration();

// Use startTracking when generation actually begins
imageGeneration.startTracking(realProjectId, requestId);
```

```typescript
// ❌ Avoid: Passing chatId as default projectId
const imageGeneration = useImageGeneration(chatId || projectId);
```

### Architecture Notes

- SSE connections should be tied to actual generation state
- File IDs and chat IDs serve different purposes
- Connection lifecycle should match generation lifecycle
