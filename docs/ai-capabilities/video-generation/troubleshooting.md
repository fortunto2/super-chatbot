# Проблема: Только одна видео модель в компоненте настроек

## Симптомы
- В компоненте настроек видео генерации отображается только одна модель: `comfyui/ltx`
- В логах видна ошибка: `Error fetching video models: Error: Failed to fetch models: Not Found`
- Система падает на fallback к единственной модели LTX

## Анализ проблемы

### 1. Несоответствие API Endpoints

**Проблема**: В коде есть конфликт между endpoint'ами для получения моделей:

```typescript
// В lib/config/superduperai.ts
export const API_ENDPOINTS = {
  LIST_MODELS: '/api/v1/generation-configs', // С 's' на конце
  // ...
}

// В lib/ai/api/get-generation-configs.ts
const endpoint = `/api/v1/generation-config?${queryParams.toString()}`; // Без 's'
```

### 2. Разные системы для получения моделей

В системе используются две параллельные системы:

1. **Старая система** (`getAvailableVideoModels` в `superduperai.ts`):
   - Использует endpoint `/api/v1/generation-configs` (с 's')
   - Получает ошибку 404 "Not Found"
   - Падает на fallback к LTX модели

2. **Новая система** (`getCachedGenerationConfigs` в `config-cache.ts`):
   - Использует endpoint `/api/v1/generation-config` (без 's')
   - Вероятно работает корректно

### 3. Причина загрузки только LTX

Когда `getAvailableVideoModels()` получает ошибку 404, код выполняет fallback:

```typescript
// В getAvailableVideoModels()
catch (error) {
  console.error('Error fetching video models:', error);
  
  // AICODE-NOTE: Ultimate fallback to ensure system still works
  return [
    {
      id: 'comfyui/ltx',
      name: 'LTX Video',
      description: 'LTX Video - High quality video generation by Lightricks',
      // ... только одна модель
    },
  ];
}
```

## Решения

### Решение 1: Исправить endpoint (Рекомендуется)

Обновить `API_ENDPOINTS.LIST_MODELS` в `lib/config/superduperai.ts`:

```typescript
export const API_ENDPOINTS = {
  // Изменить с:
  LIST_MODELS: '/api/v1/generation-configs',
  // На:
  LIST_MODELS: '/api/v1/generation-config',
}
```

### Решение 2: Унифицировать систему

Заменить использование `getAvailableVideoModels` на новую систему `getCachedGenerationConfigs`:

```typescript
// В configure-video-generation.ts и других местах
// Заменить:
const superDuperModels = await getAvailableVideoModels();

// На:
const allConfigs = await getCachedGenerationConfigs();
const videoConfigs = allConfigs.filter(c => c.type === 'image_to_video');
```

### Решение 3: Проверить правильность URL API

Убедиться что переменная окружения `SUPERDUPERAI_URL` указывает на правильный endpoint.

## Диагностические команды

### Проверить какие модели доступны через новую систему:
```bash
curl "http://localhost:3000/api/config/generation?action=video-models"
```

### Проверить статус кэша:
```bash
curl "http://localhost:3000/api/config/generation?action=cache-status"
```

### Принудительно обновить кэш:
```bash
curl "http://localhost:3000/api/config/generation?action=refresh"
```

### Проверить доступность SuperDuperAI API:
```bash
curl -H "Authorization: Bearer $SUPERDUPERAI_TOKEN" \
  "https://dev-editor.superduperai.co/api/v1/generation-config"
```

## Ожидаемые видео модели

После исправления должны быть доступны:

### Бюджетные модели (Non-VIP)
- **LTX** (`comfyui/ltx`) - $0.40/sec
- **LipSync** (`comfyui/lip-sync`) - $0.40/sec

### Премиум модели (VIP Required)
- **Google VEO3** - $3.00/sec
- **Google VEO2** - $2.00/sec  
- **KLING 2.1** - $1.00-2.00/sec
- **Minimax** - $1.20/sec
- **OpenAI Sora** - $2.00/sec

## Временное решение

Пока проблема не исправлена, можно использовать модели через новую систему:

```typescript
// В браузерной консоли
fetch('/api/config/generation?action=video-models')
  .then(r => r.json())
  .then(data => console.log('Available models:', data));
```

# Video Generation Troubleshooting Guide

## Problem: Images Not Displaying in Chat

### Symptoms
- Image generation starts successfully on server
- API returns success response with `file_ids`
- Images don't appear in chat interface or artifacts
- WebSocket connection appears to work

### Root Causes & Solutions

#### 1. API Endpoint Mismatch

**Problem**: Using wrong API endpoint for image generation.

**Solution**: Use `/api/v1/project` endpoint with `params` structure:

```typescript
// ❌ Wrong - old endpoint
const response = await fetch('/api/v1/file/generate-image', {
  body: JSON.stringify({
    projectId: chatId,
    type: "image",
    config: { ... }
  })
});

// ✅ Correct - project endpoint with params structure
const response = await fetch('/api/v1/project', {
  body: JSON.stringify({
    params: {
      config: { ... },
      file_ids: [],
      references: [],
      generation_config: { ... }
    }
  })
});
```

#### 2. WebSocket Artifact Kind Filter

**Problem**: WebSocket hook only processes `image` artifacts, blocking `video` artifacts.

**Solution**: Fixed in `hooks/use-artifact-websocket.ts`:

```typescript
// ❌ Before - only images
if (!artifact.content || artifact.kind !== 'image') {
  return { projectId: null, requestId: null };
}

// ✅ After - both images and videos
if (!artifact.content || (artifact.kind !== 'image' && artifact.kind !== 'video')) {
  return { projectId: null, requestId: null };
}
```

#### 3. Incorrect URL Field Assignment

**Problem**: WebSocket handler only sets `imageUrl`, but video artifacts need `videoUrl`.

**Solution**: Dynamic field assignment based on media type:

```typescript
const isVideoArtifact = currentArtifact.kind === 'video';
const isVideoMedia = mediaType === 'video';

if (isVideoArtifact || isVideoMedia) {
  updatedContent.videoUrl = mediaUrl;
} else {
  updatedContent.imageUrl = mediaUrl;
}
```

#### 4. Project ID Mismatch

**Problem**: WebSocket connects with wrong project ID.

**Debugging**:
```javascript
// Check current WebSocket state
window.imageWebsocketStore.getDebugInfo()

// Check artifact content
console.log(window.artifactInstance?.artifact)

// Test connection manually
chatWebSocket.testConnection('your-project-id')
```

## Debugging Steps

### 1. Check API Response

Verify the API call returns a valid project ID:

```bash
# Run image generation test
npm run test:image
```

Expected output:
```
✅ API Response: {
  "id": "project-uuid-here",
  "status": "pending",
  ...
}
```

### 2. Verify WebSocket Connection

```bash
# Test WebSocket connectivity
npm run test:websocket
```

Expected output:
```
✅ WebSocket connected successfully!
✅ Subscription confirmed!
```

### 3. Check Browser Console

Look for these log messages:
```
🔌 Artifact WebSocket: Connecting to project: project-id
📨 Received message: { type: 'file', object: { url: '...' } }
🔌 Artifact WebSocket: Successfully updated artifact content
```

### 4. Verify Environment Variables

```bash
echo $SUPERDUPERAI_TOKEN
echo $SUPERDUPERAI_URL
echo $NEXT_PUBLIC_WS_URL
```

Required values:
- `SUPERDUPERAI_TOKEN`: Your API token
- `SUPERDUPERAI_URL`: https://dev-editor.superduperai.co (default)
- `NEXT_PUBLIC_WS_URL`: https://editor.superduperai.co (default)

## Common Issues

### Issue: "No project ID returned from API"

**Cause**: API endpoint or payload structure incorrect.

**Solution**: 
1. Check API endpoint is `/api/v1/project`
2. Verify payload uses `params` wrapper structure
3. Check authentication token

### Issue: "WebSocket connects but no messages received"

**Cause**: Project ID mismatch or generation not starting.

**Solution**:
1. Verify project ID from API response
2. Check SuperDuperAI service status
3. Ensure generation actually starts on server

### Issue: "Messages received but artifact not updated"

**Cause**: Artifact kind filter or URL field mismatch.

**Solution**:
1. Check artifact kind is `image` or `video`
2. Verify `eventData.object.type` matches expected media type
3. Check WebSocket handler logs

## Testing Tools

### Manual WebSocket Test
```javascript
// In browser console
window.imageWebsocketStore.getDebugInfo()
chatWebSocket.testConnection('project-id')
chatWebSocket.simulateEvent('project-id', 'file')
```

### API Test
```bash
# Test complete image generation flow
npm run test:image

# Test WebSocket only
npm run test:websocket
```

### Debug Logging
```javascript
// Enable debug mode
localStorage.setItem('debug-websocket', 'true')

// Check handlers
window.imageWebsocketStore.getDebugInfo()
```

## Related Files

- `lib/ai/api/generate-image.ts` - Image generation API
- `hooks/use-artifact-websocket.ts` - WebSocket handling
- `lib/websocket/image-websocket-store.ts` - WebSocket store
- `artifacts/image/server.ts` - Image artifact server
- `artifacts/image/client.tsx` - Image artifact component

## Environment Setup

Ensure these environment variables are set:

```bash
# .env.local
SUPERDUPERAI_TOKEN=your_token_here
SUPERDUPERAI_URL=https://dev-editor.superduperai.co
NEXT_PUBLIC_WS_URL=https://editor.superduperai.co
``` 