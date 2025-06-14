# SuperDuperAI API Security Migration

This document summarizes the migration from hardcoded API tokens to secure environment-based configuration.

## Overview

Based on the SuperDuperAI API documentation analysis, we've implemented:

1. **Secure token management** with environment variables
2. **Dual environment support** (development/production)
3. **Correct video model configuration** using `comfyui/ltx`
4. **Centralized configuration** for all API calls

## Key Changes

### 1. New Configuration System

#### Before (Insecure)
```typescript
// ❌ Hardcoded in multiple files
const token = "afda4dc28cf1420db6d3e35a291c2d5f";
const url = "https://editor.superduperai.co";
```

#### After (Secure)
```typescript
// ✅ Environment-based configuration
import { getSuperduperAIConfig } from '@/lib/config/superduperai';
const config = getSuperduperAIConfig();
```

### 2. Video Model Configuration

Based on API documentation analysis:

#### Correct Model Name
- **API Model**: `comfyui/ltx` (not `runway/gen3`)
- **Model Type**: `image_to_video`
- **Price**: $0.4 per second

#### Request Structure
```json
{
  "config": {
    "prompt": "Ocean waves gently crashing on a sandy beach",
    "dynamic": 1,
    "aspect_ratio": "16:9",
    "image_generation_config_name": "comfyui/ltx",
    "image_model_type": "flux",
    "quality": "hd",
    "seed": 0,
    "voiceover_volume": 0,
    "music_volume": 0.5,
    "sound_effect_volume": 0.3,
    "transition": {
      "type": "fade"
    },
    "zoom": {
      "type": "slow",
      "ease": "linear"
    }
  }
}
```

## Files Modified

### Configuration Files
- `lib/config/superduperai.ts` - Main configuration system
- `lib/config/video-models.json` - Video model definitions
- `docs/environment-setup.md` - Environment setup guide

### API Files Updated
- `lib/ai/api/generate-video.ts` - Video generation with LTX model
- `lib/ai/api/generate-image.ts` - Image generation (security update)
- `lib/ai/api/get-image-project.ts` - Project fetching (needs update)

### Documentation
- `docs/superduperai-video-models.md` - Complete API documentation
- `docs/api-security-migration.md` - This migration guide

## Environment Variables Required

### Development
```bash
SUPERDUPERAI_DEV_URL="https://dev-editor.superduperai.co"
SUPERDUPERAI_DEV_WS_URL="wss://dev-editor.superduperai.co"
SUPERDUPERAI_DEV_TOKEN="your-dev-token"
```

### Production
```bash
SUPERDUPERAI_PROD_URL="https://editor.superduperai.co"
SUPERDUPERAI_PROD_WS_URL="wss://editor.superduperai.co"  
SUPERDUPERAI_PROD_TOKEN="your-prod-token"
```

## API Endpoints

### Video Generation
- **URL**: `POST /api/v1/project/video`
- **Model**: `comfyui/ltx`
- **Required**: `image_generation_config_name` = `"comfyui/ltx"`

### Image Generation  
- **URL**: `POST /api/v1/project/image`
- **Model**: `comfyui/flux`
- **Config**: `generation_config_name` = `"comfyui/flux"`

## Migration Steps

### 1. Set Environment Variables
```bash
# In .env.local for development
SUPERDUPERAI_DEV_TOKEN="afda4dc28cf1420db6d3e35a291c2d5f"
SUPERDUPERAI_DEV_URL="https://dev-editor.superduperai.co"
```

### 2. Update API Calls
```typescript
// Old
const response = await fetch('https://editor.superduperai.co/api/v1/project/video', {
  headers: { 'Authorization': `Bearer ${hardcodedToken}` }
});

// New  
const response = await fetch(createAPIURL(API_ENDPOINTS.GENERATE_VIDEO), {
  headers: createAuthHeaders()
});
```

### 3. Use Correct Model Names
```typescript
// Old (incorrect)
"generation_config_name": "runway/gen3"

// New (correct)
"image_generation_config_name": "comfyui/ltx"
```

## Benefits

### Security
- ✅ No hardcoded tokens in source code
- ✅ Environment-specific configuration
- ✅ Secure token rotation capability

### Maintainability
- ✅ Centralized configuration
- ✅ Type-safe API calls
- ✅ Consistent error handling

### Functionality
- ✅ Correct model names from API documentation
- ✅ Proper request structure for video generation
- ✅ Support for all LTX model features

## Testing

### Verify Configuration
```typescript
import { getSuperduperAIConfig } from '@/lib/config/superduperai';

try {
  const config = getSuperduperAIConfig();
  console.log('✅ Configuration loaded:', config.environment);
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
```

### Test Video Generation
```typescript
import { VIDEO_MODELS } from '@/lib/config/superduperai';
import videoModelsConfig from '@/lib/config/video-models.json';

console.log('Available models:', VIDEO_MODELS);
console.log('Default config:', videoModelsConfig.default_config);
```

## Next Steps

1. **Complete Migration**: Update remaining files (`get-image-project.ts`, etc.)
2. **Remove Hardcoded Tokens**: Search and remove any remaining hardcoded values
3. **Update Tests**: Modify tests to use new configuration system
4. **Documentation**: Ensure all team members understand new setup

## Troubleshooting

### Common Issues
1. **Missing Token**: Set appropriate environment variable
2. **Wrong Model Name**: Use `comfyui/ltx` for video, `comfyui/flux` for images
3. **Template Required Error**: Ensure request structure matches API documentation

### Debug Mode
```bash
DEBUG=superduperai:* npm run dev
```

This migration provides a secure, maintainable foundation for SuperDuperAI API integration while ensuring compatibility with the actual API specification. 