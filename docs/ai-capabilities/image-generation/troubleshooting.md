# Image Generation Troubleshooting Guide

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