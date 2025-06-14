# Hybrid Image Generation Solution

## Overview

This document describes the hybrid approach to image generation that combines WebSocket real-time updates with polling fallback to ensure reliable image delivery in the chat interface.

## Problem Analysis

### Initial Issue
- Image generation worked on server side but results weren't appearing in chat interface
- WebSocket connections were established but completion events weren't received
- Users saw "generating..." state indefinitely despite successful generation

### Root Cause Investigation
1. **WebSocket Infrastructure**: Connections work, subscriptions accepted, but completion events not received
2. **Domain Configuration**: Fixed hardcoded URLs to use dynamic configuration
3. **Event Pattern**: Current WebSocket subscription pattern doesn't match server event emission

## Solution: Hybrid Approach

### Architecture
```
Image Generation Request
         ↓
    API Call (Start Generation)
         ↓
    Try WebSocket (30s timeout)
         ↓
    [Success] → Display Image
         ↓
    [Timeout/Failure] → Fallback to Polling
         ↓
    Polling (2s intervals, 2min max)
         ↓
    Display Image
```

### Implementation

#### 1. Hybrid Generation Function
```typescript
// lib/ai/api/generate-image-hybrid.ts
export const generateImageHybrid = async (
  prompt: string,
  model: ImageModel,
  style: MediaOption,
  resolution: MediaResolution,
  shotSize: MediaOption,
  seed?: number
): Promise<ImageGenerationResult>
```

#### 2. WebSocket Attempt (30s timeout)
- Connects to `/api/v1/ws/project.{fileId}`
- Sends subscription message
- Waits for completion events
- Times out after 30 seconds if no events received

#### 3. Polling Fallback
- Checks file status every 2 seconds via `/api/v1/file/{fileId}`
- Continues until `url` field is populated
- Maximum wait time: 2 minutes

### Performance Metrics

| Method | Success Rate | Average Time | Reliability |
|--------|-------------|--------------|-------------|
| WebSocket Only | 0% | N/A (timeout) | Low |
| Polling Only | 100% | 30-40 seconds | High |
| Hybrid | 100% | 33 seconds* | High |

*Includes 30s WebSocket timeout + polling time

## Configuration

### Environment Variables
```bash
SUPERDUPERAI_URL=https://dev-editor.superduperai.co
SUPERDUPERAI_TOKEN=your_token_here
```

### Dynamic Configuration
All hardcoded URLs and tokens have been replaced with dynamic configuration:
- `getSuperduperAIConfig()` - Gets current environment settings
- `createAPIURL()` - Builds API endpoints
- `createAuthHeaders()` - Creates authorization headers

## Testing

### Test Scripts
```bash
# Test polling approach only
npm run test:polling

# Test hybrid approach (WebSocket + polling fallback)
npm run test:hybrid

# Test WebSocket endpoints
npm run test:ws:endpoints
```

### Test Results
```bash
🔀 Hybrid Approach Test
✅ Success via: polling
🖼️ Image URL: https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/...
⏱️ Total time: 33 seconds
```

## Implementation Status

### ✅ Completed
- [x] Hybrid generation function (`generate-image-hybrid.ts`)
- [x] Polling implementation with proper error handling
- [x] WebSocket attempt with timeout
- [x] Dynamic configuration system
- [x] Comprehensive testing suite
- [x] Documentation

### 🔄 Next Steps
1. **Integrate with Chat Interface**: Replace current image generation with hybrid approach
2. **Optimize Timing**: Reduce WebSocket timeout to 15s for faster fallback
3. **Add Progress Indicators**: Show "Trying WebSocket..." → "Falling back to polling..."
4. **WebSocket Investigation**: Continue investigating proper event subscription pattern

## Usage Example

```typescript
import { generateImageHybrid } from '@/lib/ai/api/generate-image-hybrid';

const result = await generateImageHybrid(
  "A beautiful landscape",
  model,
  style,
  resolution,
  shotSize,
  seed
);

if (result.success) {
  console.log(`Image generated via ${result.method}: ${result.url}`);
} else {
  console.error(`Generation failed: ${result.error}`);
}
```

## Troubleshooting

### Common Issues

1. **Both WebSocket and Polling Fail**
   - Check `SUPERDUPERAI_TOKEN` validity
   - Verify `SUPERDUPERAI_URL` accessibility
   - Check network connectivity

2. **WebSocket Always Times Out**
   - Expected behavior currently
   - Polling fallback ensures reliability
   - Consider reducing timeout for faster fallback

3. **Polling Takes Too Long**
   - Normal generation time: 30-40 seconds
   - Check server load and generation queue
   - Verify file ID is valid

### Debug Commands
```bash
# Check configuration
export SUPERDUPERAI_TOKEN=your_token && npm run test:hybrid

# Test specific endpoints
npm run test:ws:endpoints

# Test polling only
npm run test:polling
```

## Future Improvements

### Short Term
- Reduce WebSocket timeout to 15 seconds
- Add progress indicators in UI
- Implement retry logic for failed polls

### Long Term
- Investigate correct WebSocket event subscription pattern
- Implement WebSocket reconnection logic
- Add support for batch image generation
- Optimize polling intervals based on generation complexity

## Related Documentation
- [WebSocket Troubleshooting](./websocket-troubleshooting.md)
- [Image Generation API](../../api-integration/superduperai/image-generation.md)
- [Configuration Management](../../development/configuration.md) 