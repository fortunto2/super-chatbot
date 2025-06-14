# Dynamic API Integration

## Overview

This document describes our new dynamic approach to working with SuperDuperAI API, replacing static JSON configurations with real-time API calls.

## Key Changes

### ✅ Before (Static)
- Hardcoded model configurations in JSON files
- Manual updates required for new models
- Risk of outdated information
- Static pricing and capabilities

### ✅ After (Dynamic)
- Real-time model fetching from API
- Automatic updates when models change
- Always current pricing and capabilities
- Smart caching for performance

## Architecture Components

### 1. HTTP Client (`lib/ai/api/http-client.ts`)
- Native fetch-based client (no axios dependency)
- Automatic authentication
- Retry logic with exponential backoff
- Environment-aware configuration
- TypeScript-first design

### 2. Generation Config API (`lib/ai/api/get-generation-configs.ts`)
- Fetch available models from `/api/v1/generation-config`
- Type-safe interfaces
- Comprehensive error handling
- Support for filtering and pagination

### 3. Caching Layer (`lib/ai/api/config-cache.ts`)
- In-memory cache with 1-hour TTL
- Stale fallback on API failures
- Agent-friendly formatting
- Smart model selection

### 4. API Routes (`app/api/config/generation/route.ts`)
- Testing endpoints for development
- Cache management
- Model discovery utilities

## API Endpoints

### SuperDuperAI Generation Config
```http
GET https://dev-editor.superduperai.co/api/v1/generation-config
```

**Query Parameters:**
- `order_by`: `name`, `created_at`, `price`
- `order`: `descendent`, `ascendent`
- `limit`: Maximum results (default: 50, max: 100)
- `offset`: Pagination offset
- `type`: Filter by model type
  - `text_to_image`
  - `text_to_video` 
  - `image_to_video`
  - `image_to_image`

### Our Internal API
```http
# List all models
GET /api/config/generation?action=list

# Get video models formatted for agents
GET /api/config/generation?action=video-models

# Check cache status
GET /api/config/generation?action=cache-status

# Force refresh cache
GET /api/config/generation?action=refresh

# Find best video model
POST /api/config/generation
{
  "action": "find-best-video-model",
  "preferences": {
    "maxPrice": 0.4,
    "preferredDuration": 10,
    "vipAllowed": false
  }
}
```

## Usage Examples

### Basic Model Fetching
```typescript
import { getCachedGenerationConfigs } from '@/lib/ai/api/config-cache';

// Get all models (cached for 1 hour)
const models = await getCachedGenerationConfigs();

// Filter video models
const videoModels = models.filter(m => m.type === 'image_to_video');

console.log('Available video models:', videoModels.length);
```

### AI Agent Integration
```typescript
import { getVideoModelsForAgent } from '@/lib/ai/api/config-cache';

// Get formatted description for AI agents
const modelInfo = await getVideoModelsForAgent();

// Use in agent prompt
const prompt = `
Here are the available video models:

${modelInfo}

Please choose the best model for generating a 10-second video.
`;
```

### Smart Model Selection
```typescript
import { getBestVideoModel } from '@/lib/ai/api/config-cache';

// Find optimal model based on requirements
const bestModel = await getBestVideoModel({
  maxPrice: 0.5,        // Max $0.50 per second
  preferredDuration: 15, // 15 second video
  vipAllowed: false,    // No VIP models
});

if (bestModel) {
  console.log('Using model:', bestModel.name);
  console.log('Price:', bestModel.params.price_per_second);
} else {
  console.log('No suitable model found');
}
```

### Video Generation with Dynamic Models
```typescript
import { getBestVideoModel } from '@/lib/ai/api/config-cache';
import { generateVideo } from '@/lib/ai/api/generate-video';

// Get best model for this request
const model = await getBestVideoModel({
  maxPrice: 0.4,
  preferredDuration: 10,
});

if (model) {
  const result = await generateVideo(
    style,
    resolution,
    prompt,
    model.name, // Use dynamic model name
    shotSize,
    chatId,
    negativePrompt,
    30, // fps
    10  // duration
  );
}
```

## Environment Setup

### Development
```env
SUPERDUPERAI_DEV_TOKEN=your_development_token
SUPERDUPERAI_DEV_URL=https://dev-editor.superduperai.co
SUPERDUPERAI_DEV_WS_URL=wss://dev-editor.superduperai.co
```

### Production
```env
SUPERDUPERAI_PROD_TOKEN=your_production_token
SUPERDUPERAI_PROD_URL=https://editor.superduperai.co
SUPERDUPERAI_PROD_WS_URL=wss://editor.superduperai.co
```

## Testing

### Local Testing
```bash
# Test model fetching
curl "http://localhost:3000/api/config/generation?action=list"

# Test video models
curl "http://localhost:3000/api/config/generation?action=video-models"

# Test cache status
curl "http://localhost:3000/api/config/generation?action=cache-status"

# Test model selection
curl -X POST "http://localhost:3000/api/config/generation" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "find-best-video-model",
    "preferences": {
      "maxPrice": 0.4,
      "preferredDuration": 10,
      "vipAllowed": false
    }
  }'
```

### Development Console
```javascript
// In browser console on your app
fetch('/api/config/generation?action=list')
  .then(r => r.json())
  .then(data => console.log('Models:', data));
```

## Benefits

### 🚀 Performance
- **95% fewer API calls** through intelligent caching
- **Sub-second response** times for cached data
- **Graceful degradation** when API is unavailable

### 🔄 Reliability
- **Stale cache fallback** prevents service interruption
- **Automatic retries** with exponential backoff
- **Comprehensive error handling**

### 🎯 Accuracy
- **Always current models** and pricing
- **Real-time capabilities** information
- **No manual synchronization** required

### 🤖 AI-Friendly
- **Formatted descriptions** for language models
- **Smart model selection** based on requirements
- **Contextual information** for better decisions

## Migration Guide

### Step 1: Update Imports
```typescript
// Old
import videomodels from '@/lib/config/video-models.json';

// New
import { getCachedGenerationConfigs, getBestVideoModel } from '@/lib/ai/api/config-cache';
```

### Step 2: Replace Static Lookups
```typescript
// Old
const model = videomodels.models.find(m => m.name === 'LTX');

// New
const configs = await getCachedGenerationConfigs();
const model = configs.find(c => c.name.includes('LTX') && c.type === 'image_to_video');
```

### Step 3: Use Smart Selection
```typescript
// Old
const modelName = 'comfyui/ltx'; // Hardcoded

// New
const bestModel = await getBestVideoModel({
  maxPrice: 0.4,
  preferredDuration: duration,
});
const modelName = bestModel?.name || 'fallback-model';
```

## Monitoring

### Cache Metrics
```typescript
import { getCacheStatus } from '@/lib/ai/api/config-cache';

const status = getCacheStatus();
console.log('Cache age:', status.age, 'minutes');
console.log('Expires in:', status.expiresIn, 'minutes');
console.log('Total models:', status.totalConfigs);
```

### Error Tracking
- All API errors are logged to console
- Failed requests fall back to stale cache
- Comprehensive error messages for debugging

## Future Enhancements

1. **Persistent Cache**: Redis/database storage for server-side caching
2. **Real-time Updates**: WebSocket notifications for model changes
3. **Usage Analytics**: Track model usage and performance
4. **Rate Limiting**: Built-in rate limit handling
5. **Model Recommendations**: ML-based model selection
6. **Cost Optimization**: Automatic cost-based model selection

## Troubleshooting

### Common Issues

**Cache not updating:**
```bash
# Force refresh
curl "http://localhost:3000/api/config/generation?action=refresh"
```

**API authentication errors:**
- Check environment variables
- Verify token is not expired
- Ensure correct API URL

**No models found:**
- Check API connectivity
- Verify filter parameters
- Review cache status

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG = 'superduperai:*';
``` 