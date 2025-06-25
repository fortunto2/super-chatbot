# WebSocket to SSE Migration Plan

**Date:** June 15, 2025  
**Status:** Implementation Planning  
**Priority:** High  
**Requester:** SuperDuperAI Backend Team Migration  

## Overview

SuperDuperAI backend has migrated from WebSocket to Server-Sent Events (SSE) architecture. This plan outlines the complete migration of our WebSocket-based real-time communication to SSE for improved reliability, automatic reconnection, and simplified infrastructure.

## Background

- **From:** WebSocket-based real-time communication (`wss://dev-editor.superduperai.co/api/v1/ws/...`)
- **To:** SSE with EventSource API (`/api/v1/events/{channel}`)
- **Reason:** Backend migration, improved reliability, automatic reconnection
- **New Endpoint:** `/api/v1/events/{channel}` via `EventsService.subscribeApiV1EventsChannelGet()`

## Channels

Based on SuperDuperAI documentation:
- `project.{project_id}` - Project-scoped events
- `file.{file_id}` - File generation events  
- `user.{user_id}` - User-level tasks

## Architecture Changes

### Current WebSocket Architecture
```typescript
const ws = new WebSocket(`wss://dev-editor.superduperai.co/api/v1/ws/project.${projectId}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};
```

### New SSE Architecture
```typescript
const eventSource = new EventSource(`${baseUrl}/api/v1/events/project.${projectId}`);
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};
```

## Files to Migrate

### Core WebSocket Files
1. `hooks/use-image-websocket.ts` → `hooks/use-image-sse.ts`
2. `lib/websocket/image-websocket-store.ts` → `lib/websocket/image-sse-store.ts`
3. `hooks/use-artifact-websocket.ts` → `hooks/use-artifact-sse.ts`
4. `hooks/use-chat-image-websocket.ts` → `hooks/use-chat-image-sse.ts`

### Application Files
5. `app/tools/image-generator/hooks/use-image-generator.ts` - Update WebSocket calls
6. `app/tools/video-generator/hooks/use-video-generator.ts` - Update WebSocket calls

### Configuration Files
7. `lib/config/superduperai.ts` - Remove `createWSURL`, add SSE config
8. Various test files - Update to use SSE

## Implementation Steps

### Step 1: Create SSE Store Infrastructure
- [ ] Create `lib/websocket/image-sse-store.ts` with EventSource
- [ ] Implement automatic reconnection (built into EventSource)
- [ ] Add proper error handling and connection state management
- [ ] Support for multiple event handlers per project

### Step 2: Create SSE Hooks  
- [ ] Create `hooks/use-image-sse.ts` replacing WebSocket functionality
- [ ] Create `hooks/use-artifact-sse.ts` for general artifact events
- [ ] Maintain same interface for backward compatibility

### Step 3: Update Application Tools
- [ ] Update `use-image-generator.ts` to use SSE instead of WebSocket
- [ ] Update `use-video-generator.ts` to use SSE instead of WebSocket
- [ ] Test generation flow with SSE events

### Step 4: Update Configuration
- [ ] Remove WebSocket URL configuration from `superduperai.ts`
- [ ] Add SSE endpoint configuration
- [ ] Update environment variable handling

### Step 5: Testing and Validation
- [ ] Test image generation with SSE events
- [ ] Test video generation with SSE events  
- [ ] Verify automatic reconnection works
- [ ] Test connection error handling

### Step 6: Documentation Updates
- [ ] Update AGENTS.md with SSE patterns
- [ ] Update API integration documentation
- [ ] Create SSE troubleshooting guide
- [ ] Archive WebSocket documentation

### Step 7: Cleanup
- [ ] Remove old WebSocket files
- [ ] Remove WebSocket dependencies
- [ ] Update imports throughout codebase

## Technical Implementation Details

### SSE Store Pattern
```typescript
class ImageSSEStore {
  private eventSource: EventSource | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  
  initConnection(channel: string, handlers: EventHandler[]) {
    const url = `${getSuperduperAIConfig().baseUrl}/api/v1/events/${channel}`;
    this.eventSource = new EventSource(url);
    
    this.eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    // Automatic reconnection handled by EventSource
  }
}
```

### Channel Mapping
- Image generation: `project.{projectId}`
- Video generation: `project.{projectId}`  
- File updates: `file.{fileId}`
- User notifications: `user.{userId}`

### Message Types (Same as WebSocket)
- `task` - Task status updates
- `render_progress` - Generation progress
- `render_result` - Generation completion
- `data`, `file`, `entity`, `scene` - Other updates

## Benefits of SSE Migration

1. **Automatic Reconnection** - Browser handles reconnection automatically
2. **Infrastructure Compatibility** - Works with all proxies, CDNs, load balancers
3. **Simplified Code** - No manual connection management needed
4. **Better Debugging** - Visible in browser Network tab
5. **Standardized** - EventSource is web standard
6. **Lower Resource Usage** - No persistent connections to manage

## Risks and Mitigation

### Risk: Breaking Changes
- **Mitigation:** Maintain same hook interfaces, gradual migration

### Risk: Message Format Changes  
- **Mitigation:** Verify message formats match between WebSocket and SSE

### Risk: Connection Reliability
- **Mitigation:** Test thoroughly with network interruptions

## Testing Strategy

### Unit Tests
- [ ] Test SSE store connection management
- [ ] Test event handler registration/cleanup
- [ ] Test error handling scenarios

### Integration Tests  
- [ ] Test full image generation flow with SSE
- [ ] Test video generation flow with SSE
- [ ] Test multiple concurrent connections

### E2E Tests
- [ ] Test generation tools work end-to-end
- [ ] Test progress updates display correctly
- [ ] Test reconnection after network issues

## Migration Timeline

- **Week 1:** Implement SSE infrastructure (Steps 1-2)
- **Week 2:** Update application tools (Steps 3-4) 
- **Week 3:** Testing and validation (Step 5)
- **Week 4:** Documentation and cleanup (Steps 6-7)

## Success Criteria

- [ ] All generation tools work with SSE instead of WebSocket
- [ ] Automatic reconnection works seamlessly
- [ ] Progress updates display correctly in real-time
- [ ] No performance degradation
- [ ] All tests pass
- [ ] Documentation updated

## Approval Required

This plan requires approval before implementation to ensure:
- Architecture decisions align with project standards
- Breaking changes are acceptable
- Timeline fits project roadmap

**Next Steps:** Await approval, then proceed with Step 1 implementation. 