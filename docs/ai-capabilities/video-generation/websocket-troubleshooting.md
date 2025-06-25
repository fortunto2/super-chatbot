# Video WebSocket Troubleshooting Guide

## Problem Description

Video generation was working on the server side but results were not appearing in the chat interface. The issue was identified in the WebSocket system that handles real-time updates for media generation.

## Root Cause

The `use-artifact-websocket.ts` hook had two critical issues blocking video support:

1. **Artifact Kind Filter**: Only allowed `image` artifacts, blocking `video` artifacts
2. **URL Field Mismatch**: Only set `imageUrl` field, but video artifacts need `videoUrl`

## Solution Implemented

### Fixed Artifact Kind Support

**Before:**
```typescript
if (!artifact.content || artifact.kind !== 'image') {
  return { projectId: null, requestId: null };
}
```

**After:**
```typescript
if (!artifact.content || (artifact.kind !== 'image' && artifact.kind !== 'video')) {
  return { projectId: null, requestId: null };
}
```

### Added Video URL Handling

**Before:**
```typescript
const updatedContent = {
  ...currentContent,
  status: 'completed',
  imageUrl: mediaUrl, // Only image support
  message: 'Image generation completed!'
};
```

**After:**
```typescript
const isVideoArtifact = currentArtifact.kind === 'video';
const isVideoMedia = mediaType === 'video';

let updatedContent;
if (isVideoArtifact || isVideoMedia) {
  updatedContent = {
    ...currentContent,
    status: 'completed',
    videoUrl: mediaUrl,
    message: 'Video generation completed!'
  };
} else {
  updatedContent = {
    ...currentContent,
    status: 'completed',
    imageUrl: mediaUrl,
    message: 'Image generation completed!'
  };
}
```

## WebSocket Architecture

The system uses a unified WebSocket store (`imageWebsocketStore`) for both image and video generation:

1. **Server Side**: `artifacts/video/server.ts` creates artifact with `projectId`
2. **Client Side**: `use-artifact-websocket.ts` connects to WebSocket using `projectId`
3. **Real-time Updates**: WebSocket receives `file` events with media URLs
4. **Artifact Update**: Hook updates artifact content with appropriate URL field

## Testing WebSocket Connection

Use browser console to debug WebSocket issues:

```javascript
// Check current WebSocket state
window.imageWebsocketStore.getDebugInfo()

// Test connection to specific project
chatWebSocket.testConnection('your-project-id')

// Force connect to project
chatWebSocket.forceConnectToProject('your-project-id')

// Simulate WebSocket event
chatWebSocket.simulateEvent('your-project-id', 'file')
```

## Common Issues

### 1. No WebSocket Connection
- Check if `projectId` is present in artifact content
- Verify WebSocket URL formation
- Check browser network tab for WebSocket connection

### 2. Events Not Processed
- Verify artifact kind is `image` or `video`
- Check if `projectId` matches between event and artifact
- Look for handler registration in console logs

### 3. Wrong URL Field
- Image artifacts should get `imageUrl`
- Video artifacts should get `videoUrl`
- Check `eventData.object.type` for media type detection

## Environment Variables

```bash
# WebSocket base URL (optional, defaults to editor.superduperai.co)
NEXT_PUBLIC_WS_URL=https://editor.superduperai.co
```

## Console Debugging

Enable detailed WebSocket logging:

```javascript
// Enable debug mode
localStorage.setItem('debug-websocket', 'true')

// Check artifact state
console.log(window.artifactInstance?.artifact)

// Check WebSocket handlers
window.imageWebsocketStore.getDebugInfo()
```

## Related Files

- `hooks/use-artifact-websocket.ts` - Main WebSocket hook
- `lib/websocket/image-websocket-store.ts` - WebSocket store
- `artifacts/video/server.ts` - Video generation server
- `artifacts/video/client.tsx` - Video artifact component 