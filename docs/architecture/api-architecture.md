# API Architecture

## Overview

This document describes the architecture for working with SuperDuperAI API in our application.

## HTTP Client

### Why Native Fetch Instead of Axios?

We use the native `fetch` API instead of axios for several reasons:

1. **Lighter Weight**: No additional dependencies
2. **Modern Browser Support**: Fetch is well-supported in all modern browsers
3. **Native TypeScript Support**: Built-in types
4. **Sufficient Features**: Our needs are covered by fetch + custom wrapper

### HTTP Client Features

- **Authentication**: Automatic headers with API tokens
- **Environment Support**: Dev/prod configuration
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout Handling**: 30-second default timeout
- **Error Handling**: Comprehensive error responses
- **Type Safety**: Full TypeScript support

## Dynamic Model Configuration

### Problem with Static Configuration

Previously, we hardcoded model configurations in JSON files. This approach has several issues:

- **Outdated Information**: Models change frequently
- **Manual Updates**: Requires code changes for new models
- **Inconsistency**: Local config may differ from API reality

### Dynamic Solution

We now fetch generation configurations dynamically from the API:

```typescript
// Get all available models
const configs = await getCachedGenerationConfigs();

// Get video-specific models
const videoConfigs = configs.filter(c => c.type === 'image_to_video');

// Find best model for requirements
const bestModel = await getBestVideoModel({
  maxPrice: 0.5,
  preferredDuration: 10,
  vipAllowed: false
});
```

### Caching Strategy

**In-Memory Cache with TTL**:
- Cache duration: 1 hour
- Stale cache fallback on API errors
- Manual refresh capability
- Cache status monitoring

**Benefits**:
- Fast repeated access
- Resilient to API outages
- Up-to-date model information
- Optimized for AI agents

## API Endpoints

### Generation Config
```
GET /api/v1/generation-config
```

**Parameters**:
- `order_by`: name | created_at | price
- `order`: descendent | ascendent  
- `limit`: number (max 100)
- `offset`: number
- `type`: image_to_image | image_to_video | text_to_image | text_to_video

**Response Structure**:
```typescript
interface GenerationConfig {
  id: string;
  name: string;            // Use this in API calls
  label: string;           // Human-readable name
  type: string;            // Model type
  source: string;          // Model source/provider
  params: {
    price_per_second?: number;
    available_durations?: number[];
    // ... other parameters
  };
  vip_required: boolean;
  price: number;
}
```

### Video Generation
```
POST /api/v1/project/video
```

**Request Body**:
```typescript
{
  config: {
    prompt: string;
    aspect_ratio: string;          // "1216:704"
    image_generation_config_name: string;  // Model name from config
    duration?: number;
    frame_rate?: number;
    seed?: number;
    // ... other parameters from model config
  }
}
```

## Environment Configuration

### Development
```env
SUPERDUPERAI_DEV_TOKEN=your_dev_token
SUPERDUPERAI_DEV_URL=https://dev-editor.superduperai.co
SUPERDUPERAI_DEV_WS_URL=wss://dev-editor.superduperai.co
```

### Production
```env
SUPERDUPERAI_PROD_TOKEN=your_prod_token
SUPERDUPERAI_PROD_URL=https://editor.superduperai.co
SUPERDUPERAI_PROD_WS_URL=wss://editor.superduperai.co
```

## Usage Examples

### Basic API Call
```typescript
import { apiGet } from '@/lib/ai/api/http-client';

const response = await apiGet('/api/v1/generation-config', {
  timeout: 10000,
  retries: 2
});

if (response.success) {
  console.log('Models:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Cached Model Access
```typescript
import { getCachedGenerationConfigs, getBestVideoModel } from '@/lib/ai/api/config-cache';

// Get all models (cached)
const models = await getCachedGenerationConfigs();

// Find optimal model
const bestModel = await getBestVideoModel({
  maxPrice: 0.4,
  preferredDuration: 15,
  vipAllowed: true
});
```

### Agent Integration
```typescript
import { getVideoModelsForAgent } from '@/lib/ai/api/config-cache';

// Get formatted model list for AI agents
const modelDescription = await getVideoModelsForAgent();
console.log(modelDescription);
```

## Error Handling

### Network Errors
- Automatic retries with exponential backoff
- Fallback to stale cache when possible
- Comprehensive error messages

### API Errors
- HTTP status code handling
- Detailed error responses
- Authentication error detection

### Cache Errors
- Graceful degradation
- Stale data fallback
- Error logging and monitoring

## Performance Considerations

### Caching Benefits
- Reduces API calls by ~95%
- Faster model selection
- Better user experience
- Lower API costs

### Memory Usage
- Lightweight in-memory cache
- Automatic cleanup on expiry
- Minimal memory footprint

### Network Optimization
- Request deduplication
- Efficient query parameters
- Compressed responses when available

## Security

- Environment-based token management
- No hardcoded credentials
- Secure header handling
- Request validation

## Future Improvements

1. **Persistent Cache**: Redis/database storage for server-side caching
2. **Real-time Updates**: WebSocket notifications for model changes
3. **Advanced Filtering**: More sophisticated model selection logic
4. **Metrics**: API usage and performance monitoring
5. **Rate Limiting**: Built-in rate limit handling 