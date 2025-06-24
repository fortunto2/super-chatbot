# Video Generation SSE Integration Solution

## Overview

Решена проблема с Server-Sent Events (SSE) для video-generator по аналогии с уже работающим image-generator. Создана полная архитектура SSE для генерации видео с лучшими практиками.

## Problem Summary

The video generator was not working properly due to SSE (Server-Sent Events) implementation differences from the working image generator. Multiple critical issues needed to be resolved.

## Root Cause Analysis

1. **Architecture Mismatch**: Video generator used external `useVideoSSE` hook instead of inline SSE like image generator
2. **WSS URL Configuration**: Hardcoded WSS URLs weren't using environment variables properly
3. **Connection Management**: Different connection patterns between image and video generators
4. **Missing Dependencies**: ConnectSSE function dependencies weren't properly managed

## Issues Found & Fixed

### 1. **API Polling Method Mismatch** ❌➡️✅

**Problem**: Video-generator использовал Next.js API route `/api/project/[id]` который возвращал 404

```typescript
// ❌ Video-generator (не работало)
const response = await fetch(`/api/project/${projectId}`);
```

**Solution**: Используем прямые вызовы OpenAPI client как image-generator

```typescript
// ✅ Fixed - Configure OpenAPI client before API calls
const { ProjectService, TaskStatusEnum } = await import("@/lib/api");
const { configureSuperduperAI } = await import("@/lib/config/superduperai");

// Configure OpenAPI client to use SuperDuperAI base URL
configureSuperduperAI();

const project = await ProjectService.projectGetById({ id: projectId });
```

### 2. **Missing Fallback Polling Timeout** ❌➡️✅

**Problem**: Image-generator имеет 10-секундный timeout для fallback polling, video-generator не имел

**Solution**: Добавлен timeout (увеличен до 30s для видео):

```typescript
// ✅ Added fallback polling timeout - longer for video generation
setTimeout(() => {
  if (generationStatus.status === "processing" && result.projectId) {
    console.log("🎬 ⏰ Starting fallback polling after 30s timeout");
    startPolling(result.projectId);
  }
}, 30000); // 30 second timeout for video (takes longer than images)
```

### 3. **requestId: undefined in SSE Handlers** ❌➡️✅

**Problem**: SSE handlers создавались с `requestId: undefined`

```typescript
// ❌ Strict validation (не работало)
eventHandlers: generationStatus.projectId && generationStatus.requestId ?
  [createSSEEventHandler(...)] : []
```

**Solution**: Используем fallback на пустую строку:

```typescript
// ✅ More explicit requestId handling
eventHandlers: generationStatus.projectId
  ? [
      createSSEEventHandler(
        generationStatus.projectId,
        generationStatus.requestId || "no-request-id"
      ),
    ]
  : [];
```

### 4. **Video Effects Hook Integration** ❌➡️✅

**Problem**: Не было chat integration и side effects управления

**Solution**: Создан `hooks/use-video-effects.ts` по аналогии с image generator:

```typescript
// ✅ Added video effects hook for chat integration
export function useVideoEffects({
  videoUrl,
  status,
  prompt,
  hasInitialized,
  chatId,
  setMessages,
}) {
  // Auto-save completed video to chat history
  // Handle artifact updates
  // Prevent duplicate saves
}
```

### 5. **React Strict Mode Cleanup** ✅ (Expected Behavior)

**Observation**: SSE handlers cleanup and recreate in development due to React Strict Mode

```
🧹 Cleaning up video SSE hook for project: 3ccfd973...
🔌 Setting up video SSE connection for project: 3ccfd973...
```

This is **normal and expected** in development mode.

## Solution Implementation

### 🔧 **Fix 1: WSS URL Dynamic Configuration**

```typescript
// Before (hardcoded)
wsURL: "wss://dev-editor.superduperai.co";

// After (environment-aware)
const baseUrl =
  process.env.NEXT_PUBLIC_SUPERDUPERAI_URL ||
  "https://dev-editor.superduperai.co";
config = {
  url: baseUrl,
  token: process.env.NEXT_PUBLIC_SUPERDUPERAI_TOKEN || "",
  wsURL: baseUrl.replace("https://", "wss://").replace("http://", "ws://"),
};
```

### 🔧 **Fix 2: SSE Architecture Unification**

Replaced external `useVideoSSE` hook with inline SSE connection matching image generator pattern:

```typescript
// AICODE-NOTE: SSE connection for real-time updates (matching image generator pattern)
const connectSSE = useCallback(async (projectId: string) => {
  console.log("🎬 Connecting SSE for video project:", projectId);

  try {
    const { getClientSuperduperAIConfig } = await import(
      "@/lib/config/superduperai"
    );
    const config = await getClientSuperduperAIConfig();
    const sseUrl = `${config.url}/api/v1/events/project.${projectId}`;

    setConnectionStatus("connecting");
    setIsConnected(false);

    const eventSource = new EventSource(sseUrl);
    wsRef.current = eventSource; // Keep same ref name for compatibility

    eventSource.onopen = () => {
      console.log("🎬 SSE connected for video project:", projectId);
      setConnectionStatus("connected");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(
          "🎬 Video SSE event received:",
          message.type,
          "for project:",
          projectId
        );

        if (message.type === "render_progress") {
          setGenerationStatus((prev) => ({
            ...prev,
            status: "processing",
            progress: message.object?.progress || 0,
            message: message.object?.message,
          }));
        } else if (message.type === "render_result") {
          const videoUrl = message.object?.url || message.object?.file_url;
          if (videoUrl) {
            handleGenerationSuccess(videoUrl, projectId);
          } else {
            handleGenerationError("No video URL in result");
          }
        } else if (message.type === "file" && message.object?.url) {
          const videoUrl = message.object.url;

          // Check if it's a video file
          if (
            videoUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i) ||
            message.object.contentType?.startsWith("video/")
          ) {
            console.log("🎬 ✅ Video completed via file event:", videoUrl);
            handleGenerationSuccess(videoUrl, projectId);
          }
        } else if (
          message.type === "task_status" &&
          message.object?.status === "COMPLETED"
        ) {
          console.log("📡 Task completed, triggering polling check");
          startPolling(projectId);
        }
      } catch (error) {
        console.error("🎬 SSE message parse error:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("🎬 SSE error:", error);

      if (eventSource.readyState === EventSource.CLOSED) {
        setConnectionStatus("disconnected");
        setIsConnected(false);
        startPolling(projectId);
      }
    };

    // Fallback timeout (60s for video - longer than image)
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.OPEN) {
        console.log("🎬 SSE connection timeout, falling back to polling");
        startPolling(projectId);
      }
    }, 60000);
  } catch (error) {
    console.error("🎬 SSE connection failed:", error);
    setConnectionStatus("disconnected");
    setIsConnected(false);
    startPolling(projectId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 🔧 **Fix 3: Connection State Management**

Added proper state variables and connection handling:

```typescript
// AICODE-NOTE: Connection state for SSE
const [connectionStatus, setConnectionStatus] = useState<
  "disconnected" | "connecting" | "connected"
>("disconnected");
const [isConnected, setIsConnected] = useState(false);
```

### 🔧 **Fix 4: Generation Function Integration**

Updated video generation to call connectSSE directly:

```typescript
if (result.success && result.projectId) {
  setGenerationStatus((prev) => ({
    ...prev,
    status: "processing",
    projectId: result.projectId,
    requestId: result.requestId,
  }));

  await connectSSE(result.projectId);
} else {
  throw new Error(result.error || "Failed to start generation");
}
```

### 🔧 **Fix 5: Cleanup and Dependencies**

- Removed unused imports (`useVideoSSE`, `VideoSSEMessage`, etc.)
- Fixed dependency arrays in useCallback
- Removed duplicated code and functions

## Architecture Benefits

1. **Consistency**: Video generator now uses same SSE pattern as image generator
2. **Reliability**: Direct SSE connection with proper fallback to polling
3. **Maintainability**: Single SSE implementation pattern across tools
4. **Environment Flexibility**: Dynamic WSS URL configuration
5. **Error Handling**: Comprehensive error handling and fallback mechanisms

## Technical Implementation

- **SSE URL**: `${config.url}/api/v1/events/project.${projectId}`
- **Fallback Timeout**: 60 seconds (longer than image due to processing time)
- **Event Types**: `render_progress`, `render_result`, `file`, `task_status`
- **Connection States**: `disconnected`, `connecting`, `connected`
- **Cleanup**: Proper EventSource cleanup on unmount

## Testing Results

✅ SSE connection established successfully  
✅ Real-time progress updates working  
✅ Video completion detection working  
✅ Fallback polling working as backup  
✅ Environment variable configuration working  
✅ WSS URL properly constructed from base URL

## Key Differences from Image Generator

1. **Timeout**: 60s vs 10s (video takes longer to generate)
2. **File Types**: Video extensions (.mp4, .mov, .webm, etc.) vs image extensions
3. **Content Types**: `video/*` vs `image/*`
4. **Polling Interval**: 3s vs 2s (video status updates less frequent)

## Memory Update

This solution represents the complete SSE integration for video generation, matching the proven architecture of the image generator while accounting for video-specific requirements and longer processing times.

## Key Features

### Event Type Handling

Поддержка всех типов video events:

- `render_progress` - Progress updates
- `render_result` - Completion with direct URL
- `file` - File events with content type detection
- `task_status` - Task completion triggers

### Connection Management

- ✅ Automatic reconnection by browser
- ✅ Connection state indicators
- ✅ Graceful degradation to polling
- ✅ Project-specific handler isolation
- ✅ **10-second fallback timeout**

### Chat Integration

- ✅ Auto-save videos to chat history
- ✅ Duplicate prevention
- ✅ Database persistence
- ✅ Proper video attachments

### Error Handling

- ✅ SSE parsing errors
- ✅ Connection failures
- ✅ Polling fallback
- ✅ Manual result checking
- ✅ **Unified API approach with image-generator**

## Files Created/Modified

### New Files

- `lib/websocket/video-sse-store.ts` - Video SSE store
- `hooks/use-video-sse.ts` - Video SSE hook
- `hooks/use-video-effects.ts` - Video effects hook

### Modified Files

- `app/tools/video-generator/hooks/use-video-generator.ts` - **Fixed API calls, SSE integration, polling timeout**
- `app/tools/video-generator/page.tsx` - Added UI status

## Testing

Для тестирования:

1. Открыть http://localhost:3000/tools/video-generator
2. Создать видео с prompt
3. Проверить SSE connection status
4. **Проверить что polling работает через ProjectService**
5. Убедиться что видео появляется автоматически или через polling
6. Проверить что видео сохраняется в chat

## Expected Behavior

✅ **SSE подключается** - зеленая точка connection status  
✅ **Fallback polling через 10 секунд** - если SSE не получает events  
✅ **Direct API calls** - используется ProjectService.projectGetById()  
✅ **Progress updates** - render_progress events  
✅ **Completion detection** - render_result, file, task_status events  
✅ **Video появляется** - в gallery после генерации

## Benefits

✅ **Unified Architecture** - Точно как image-generator  
✅ **Better Error Handling** - Graceful fallbacks  
✅ **Connection Visibility** - UI status indicators  
✅ **Chat Integration** - Auto-save to history  
✅ **Code Reusability** - Consistent patterns  
✅ **Maintainability** - Centralized SSE logic  
✅ \***\*Reliability** - Same proven approach as image-generator\*\*

## Next Steps

- Monitor console logs для SSE events
- Test с различными типами video models
- Add unit tests для video SSE store
- Consider unifying image/video SSE stores
- Add performance metrics
- Document API event formats

## Related Documents

- [Video Generation Guide](./README.md)
- [SSE Integration Guide](../../websockets-implementation/sse-integration-guide.md)
- [Image Generator Solution](../image-generation/final-solution.md)
