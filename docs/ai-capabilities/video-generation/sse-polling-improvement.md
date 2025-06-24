# SSE and Polling Improvements for Video Generation

## Problem Description

Video generation was completing successfully on the backend but results were not appearing in the frontend interface at `/tools/video-generator`. The system uses Server-Sent Events (SSE) for real-time updates and polling as a fallback mechanism.

## Root Causes Identified

1. **SSE Event Type Variations**: Different event types might be sent (`render_result`, `file`, `task_status`)
2. **SSE Connection Issues**: Timeout or connection failures without proper fallback
3. **Polling Logic Gaps**: Missing debug information and edge case handling
4. **Missing Manual Recovery**: No user-initiated way to check for completed results

## Solutions Implemented

### 1. Enhanced SSE Event Handling

**File**: `app/tools/video-generator/hooks/use-video-generator.ts`

```typescript
// Added support for multiple event types
if (message.type === "render_progress") {
  // Progress updates
} else if (message.type === "render_result") {
  // Primary completion event
} else if (message.type === "file" && message.object?.url) {
  // Alternative file event format
  const videoUrl = message.object.url;
  if (
    videoUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i) ||
    message.object.contentType?.startsWith("video/")
  ) {
    handleGenerationSuccess(videoUrl, projectId);
  }
} else if (
  message.type === "task_status" &&
  message.object?.status === "COMPLETED"
) {
  // Task completion trigger
  startPolling(projectId);
} else {
  // Log all other events for debugging
  console.log("📡 Other video SSE event:", message.type, message);
}
```

### 2. SSE Connection Safety Measures

**Added 10-second timeout fallback**:

```typescript
// Safety timeout to start polling if SSE doesn't connect quickly
setTimeout(() => {
  if (eventSource.readyState !== EventSource.OPEN) {
    console.log("📊 SSE not connected after 10s, starting polling as backup");
    startPolling(projectId);
  }
}, 10000);
```

### 3. Enhanced Polling Logic

**Improved data detection with detailed logging**:

```typescript
console.log("📊 All tasks completed, looking for video data...");

const videoData = project.data?.find((data) => {
  if (data.value && typeof data.value === "object") {
    const value = data.value as Record<string, any>;
    const hasUrl = !!value.url;
    const isVideo =
      value.contentType?.startsWith("video/") ||
      value.url?.match(/\.(mp4|mov|webm|avi|mkv)$/i);

    console.log("📊 Checking data entry:", {
      hasUrl,
      isVideo,
      contentType: value.contentType,
      url: value.url ? `${value.url.substring(0, 50)}...` : "none",
    });

    return hasUrl && isVideo;
  }
  return false;
});
```

### 4. Manual Results Check Function

**Added `forceCheckResults` function**:

```typescript
const forceCheckResults = useCallback(async () => {
  const projectId = generationStatus.projectId;

  if (!projectId) {
    toast.warning("No active video generation to check");
    return;
  }

  // Direct API call to check project status
  const project = await ProjectService.projectGetById({ id: projectId });

  // Check for completed tasks and video data
  const allCompleted = project.tasks?.every(
    (task) => task.status === TaskStatusEnum.COMPLETED
  );

  if (allCompleted) {
    // Look for video data and handle success
    // ... implementation details
  }
}, [generationStatus.projectId, handleGenerationSuccess, startPolling]);
```

### 5. User Interface Enhancement

**Added manual check button**:

```tsx
{
  /* Manual Check Button */
}
{
  generationStatus.projectId && generationStatus.status === "processing" && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-800 mb-3">
        Video generation is in progress. If results don&apos;t appear
        automatically, you can check manually:
      </p>
      <button
        onClick={forceCheckResults}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Check for Results
      </button>
    </div>
  );
}
```

## Testing and Verification

### Diagnostic Script Created

**File**: `scripts/debug-video-sse.js`

A comprehensive diagnostic script that:

- Lists recent video projects
- Checks project status and data
- Tests SSE connection
- Provides detailed diagnosis and recommendations

**Usage**:

```bash
# Install dependencies
pnpm add -D eventsource

# Run diagnostic
SUPERDUPERAI_TOKEN=your_token node scripts/debug-video-sse.js
```

### Expected Behavior

1. **SSE Success**: Video results appear automatically within seconds
2. **SSE Failure**: Polling fallback starts after 10 seconds
3. **Manual Recovery**: User can click "Check for Results" button
4. **Comprehensive Logging**: All events and checks are logged for debugging

## Monitoring and Debugging

### Console Logs to Watch For

**SSE Connection**:

```
🔌 SSE connected for video project: project_id
📡 Video SSE message: {type: "render_progress", object: {...}}
📡 Video SSE message: {type: "render_result", object: {url: "..."}}
```

**Polling Fallback**:

```
📊 Starting polling for video project: project_id
📊 All tasks completed, looking for video data...
📊 ✅ Video generation completed: url
```

**Manual Check**:

```
🔍 Force checking video results for project: project_id
🔍 ✅ Video found manually: url
```

## Recovery Procedures

### If Video Generation Completes but No Results

1. **Wait 30 seconds** for automatic polling
2. **Check browser console** for error messages
3. **Click "Check for Results"** button
4. **Run diagnostic script** if issues persist

### If SSE Connection Fails

The system automatically:

1. Attempts SSE connection first
2. Falls back to polling after 10 seconds
3. Continues polling every 3 seconds
4. Allows manual checking via button

## Future Improvements

1. **WebSocket Fallback**: Consider WebSocket as alternative to SSE
2. **Retry Logic**: Implement exponential backoff for failed connections
3. **User Preferences**: Allow users to choose primary connection method
4. **Better Error Messages**: More specific error handling and user feedback

## Related Files

- `app/tools/video-generator/hooks/use-video-generator.ts` - Main logic
- `app/tools/video-generator/page.tsx` - UI with manual check button
- `scripts/debug-video-sse.js` - Diagnostic tool
- `lib/config/superduperai.ts` - SSE URL configuration

## Impact

✅ **Resolved**: Video generation results now appear reliably  
✅ **Enhanced**: Better debugging and error recovery  
✅ **Improved**: User experience with manual fallback options  
✅ **Future-proof**: Comprehensive logging for issue diagnosis
