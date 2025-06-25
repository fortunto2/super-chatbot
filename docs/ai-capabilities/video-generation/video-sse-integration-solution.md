# Video Generation SSE Integration - Complete Solution

## Overview

Решение для интеграции Server-Sent Events (SSE) с генерацией видео, обеспечивающее real-time обновления статуса и результатов без необходимости polling.

## Key Changes Made

### 1. Video Hook Architecture Update

**File**: `app/tools/video-generator/hooks/use-video-generator.ts`

- ✅ **SSE Connection**: Унифицированная архитектура с image-generator
- ✅ **Inline connectSSE**: Убрана зависимость от внешнего hook
- ✅ **Dynamic Configuration**: Автоматическое получение baseUrl
- ✅ **Fallback Polling**: Автоматический переход на polling при ошибках SSE
- ✅ **FileId Support**: Использование fileId для SSE URL

### 2. SSE URL Configuration

**Updated SSE URL format**:

```typescript
// OLD: Using projectId only
const sseUrl = `${config.url}/api/v1/events/file.${projectId}`;

// NEW: Using fileId when available, fallback to projectId
const eventId = fileId || connectionId;
const sseUrl = `${config.url}/api/v1/events/file.${eventId}`;
```

**Key improvements**:

- fileId приходит из API response в `result.data[0].value.file_id`
- fileId используется для более точного подключения к SSE events
- Fallback на projectId обеспечивает совместимость

### 3. API Response Handling

**File**: `lib/ai/api/generate-video.ts`

```typescript
export interface VideoGenerationResult {
  success: boolean;
  projectId?: string;
  requestId?: string;
  fileId?: string; // NEW: Added fileId support
  message?: string;
  error?: string;
  files?: any[];
  url?: string;
}

// Extract fileId from API response
const fileData = result.data?.[0];
const fileId = fileData?.value?.file_id || fileData?.id;

return {
  success: true,
  projectId: finalProjectId,
  requestId,
  fileId, // NEW: Return fileId
  message: `Video generation started successfully! Project ID: ${finalProjectId}, Request ID: ${requestId}, File ID: ${fileId}`,
  files: result.files || [],
  url: result.url || null,
};
```

### 4. GenerationStatus Interface Update

**File**: `app/tools/image-generator/components/generation-progress.tsx`

```typescript
export interface GenerationStatus {
  status: "idle" | "pending" | "processing" | "completed" | "error";
  progress?: number;
  message?: string;
  estimatedTime?: number;
  projectId?: string;
  requestId?: string;
  fileId?: string; // NEW: Added fileId support
}
```

### 5. Connection Logic

**Updated connectSSE function**:

```typescript
const connectSSE = useCallback(
  async (connectionId: string, fileId?: string) => {
    console.log("🎬 Connecting SSE for video:", { connectionId, fileId });

    // Use fileId if available, otherwise fall back to connectionId (projectId)
    const eventId = fileId || connectionId;
    const sseUrl = `${config.url}/api/v1/events/file.${eventId}`;

    console.log("🎬 SSE URL constructed:", sseUrl);
    // ... rest of SSE logic
  },
  []
);

// Usage in generation function
const connectionId = result.fileId || result.projectId;
await connectSSE(connectionId, result.fileId);
```

## Event Handling

### SSE Event Types

```typescript
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "render_progress":
      setGenerationStatus((prev) => ({
        ...prev,
        status: "processing",
        progress: message.object?.progress || 0,
        message: message.object?.message,
      }));
      break;

    case "render_result":
      const videoUrl = message.object?.url || message.object?.file_url;
      if (videoUrl) {
        handleGenerationSuccess(videoUrl, connectionId);
      }
      break;

    case "file":
      if (message.object?.url) {
        const videoUrl = message.object.url;
        if (
          videoUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i) ||
          message.object.contentType?.startsWith("video/")
        ) {
          handleGenerationSuccess(videoUrl, connectionId);
        }
      }
      break;

    case "task_status":
      if (message.object?.status === "COMPLETED") {
        startPolling(connectionId);
      }
      break;
  }
};
```

### Fallback Mechanisms

1. **SSE Timeout**: 60 секунд (увеличено для video)
2. **Connection Failure**: Автоматический переход на polling
3. **Error Handling**: Graceful degradation с уведомлениями

## Benefits

### 1. Real-time Updates

- Мгновенные обновления progress
- Немедленное получение результатов
- Улучшенный UX

### 2. Resource Efficiency

- Меньше HTTP requests
- Экономия server resources
- Оптимизированная производительность

### 3. Reliability

- Автоматический fallback
- Error recovery
- Multiple event types support

### 4. Precise Event Targeting

- fileId обеспечивает точное подключение к нужным событиям
- Минимизирует ложные срабатывания
- Улучшенная производительность SSE

## Architecture Benefits

### 1. Unified Pattern

- Идентичная архитектура с image-generator
- Consistent event handling
- Shared error recovery logic

### 2. Dynamic Configuration

- Автоматическое определение environment
- Гибкое подключение к различным backends
- WSS URL construction из HTTPS URL

### 3. Enhanced Debugging

- Подробное логирование SSE events
- Clear connection status tracking
- Comprehensive error reporting

## Testing

### 1. SSE Connection Test

```bash
# Test SSE endpoint
curl -N -H "Accept: text/event-stream" \
  "${SUPERDUPERAI_URL}/api/v1/events/file.${FILE_ID}"
```

### 2. Manual Check Function

```typescript
const forceCheckResults = useCallback(async () => {
  // Manual project status check
  // Useful for debugging and recovery
}, []);
```

### 3. Connection Status Monitoring

```typescript
const [connectionStatus, setConnectionStatus] = useState<
  "disconnected" | "connecting" | "connected"
>("disconnected");
const [isConnected, setIsConnected] = useState(false);
```

## Integration Status

- ✅ **SSE Events**: Fully integrated
- ✅ **FileId Support**: Implemented and tested
- ✅ **Fallback Polling**: Working seamlessly
- ✅ **Error Recovery**: Comprehensive handling
- ✅ **Status Tracking**: Real-time connection status
- ✅ **Unified Architecture**: Matches image-generator pattern

## Next Steps

1. **Monitor Performance**: Track SSE connection success rates
2. **Optimize Timeouts**: Fine-tune based on production data
3. **Enhanced Logging**: Add more detailed event tracking if needed
4. **FileId Validation**: Add validation for fileId format if required

This completes the Video Generation SSE integration with fileId support, providing a robust, efficient, and user-friendly real-time experience for video generation workflows.

## Related Documents

- [Video Generation Guide](./README.md)
- [SSE Integration Guide](../../websockets-implementation/sse-integration-guide.md)
- [Image Generator Solution](../image-generation/final-solution.md)
