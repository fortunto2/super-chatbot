# Video Generation: Image-to-Video Models Support

**Date:** June 14, 2025  
**Type:** Feature Enhancement  
**Impact:** High - Enables VEO2, VEO3, and KLING 2.1 models  

## Summary

Added comprehensive support for image-to-video models in the video generation system. Users can now use Google VEO2/VEO3 and KLING 2.1 models that require source images to generate videos.

## Changes Made

### 🔧 Core API Updates

**File:** `lib/ai/api/generate-video.ts`
- Added `sourceImageId` and `sourceImageUrl` parameters
- Implemented image-to-video payload structure matching SuperDuperAI format
- Added automatic model type detection based on name patterns
- Preserved existing text-to-video functionality

**File:** `lib/ai/tools/configure-video-generation.ts`
- Added source image parameters to tool schema
- Implemented validation for image-to-video models requiring source images
- Added helpful error messages with alternative model suggestions

### 🤖 Agent Improvements

**File:** `lib/ai/prompts.ts`
- Updated agent guidance for image-to-video model usage
- Added model type categorization (text-to-video vs image-to-video)
- Included instructions to ask for source image when needed

### 🎨 Artifacts Integration

**File:** `artifacts/video/server.ts`
- Updated both create and update document handlers
- Added support for source image parameters in video generation

### 🧪 Testing & Tools

**New File:** `lib/ai/tools/find-chat-images.ts`
- Placeholder implementation for finding recent images in chat
- Ready for future database integration

**New File:** `tests/video-generation-image-to-video-test.js`
- Comprehensive tests for image-to-video functionality
- Tests payload structure, validation, and error handling

**Updated:** `package.json`
- Added `npm run test:video:i2v` script

## API Payload Structures

### Image-to-Video Models (VEO, KLING)
```json
{
  "params": {
    "config": { "seed": 123, "steps": 50, "width": 1920, "height": 1080, "prompt": "...", "duration": 8, "batch_size": 1, "aspect_ratio": "16:9", "negative_prompt": "" },
    "file_ids": ["image-id"],
    "references": [{ "type": "source", "reference_url": "image-url" }],
    "generation_config": { "name": "google-cloud/veo2", "type": "image_to_video", "label": "Google VEO2", "params": {...}, "source": "superduperai" }
  }
}
```

### Text-to-Video Models (LTX, Sora)
```json
{
  "projectId": "chat-id",
  "requestId": "vid_123",
  "type": "video",
  "template_name": null,
  "config": { "prompt": "...", "negative_prompt": "", "width": 1920, "height": 1080, "aspect_ratio": "16:9", "qualityType": "full_hd", "shot_size": "Long Shot", "seed": "123", "generation_config_name": "comfyui/ltx", "batch_size": 1, "style_name": "flux_steampunk", "entity_ids": [], "references": [], "duration": 10, "frame_rate": 30 }
}
```

## Model Detection Logic

```typescript
const isImageToVideo = model.id.includes('veo') || 
                      model.id.includes('kling') ||
                      model.id.includes('image-to-video') ||
                      model.id.includes('img2vid');
```

## Agent Behavior Changes

### Before
- All video models treated as text-to-video
- No source image support
- VEO/KLING models would fail with backend errors

### After
- Automatic detection of image-to-video models
- Validation requires source image for image-to-video models
- Helpful error messages with model suggestions
- Agent prompts user for source image when needed

## User Experience

### Example Interactions

**User requests VEO2 without source image:**
```
Agent: "VEO2 is an image-to-video model that needs a source image. Would you like to use the image you just generated, or do you have another image in mind?"
```

**User provides source image:**
```
User: "Generate video with VEO2 using image ID abc-123"
Agent: "I'll generate that video using VEO2 with your source image! Creating a video artifact..."
```

## Testing

### New Test Commands
```bash
# Test image-to-video functionality
npm run test:video:i2v

# Test general video generation  
npm run test:video

# Test with real API (costs money)
npm run test:video:live
```

### Test Coverage
- ✅ Image-to-video payload structure validation
- ✅ Text-to-video compatibility preservation
- ✅ Source image requirement validation
- ✅ Error handling for missing source images

## Documentation

### New Documentation
- `docs/ai-capabilities/video-generation/image-to-video-models.md` - Complete guide
- `docs/development/implementation-plans/fix-video-generation-image-to-video.md` - Implementation plan
- Updated `tests/README.md` with new test information

### Updated Documentation
- `docs/ai-capabilities/README.md` - Added image-to-video section
- `lib/ai/prompts.ts` - Updated agent guidance

## Breaking Changes

**None** - All existing text-to-video functionality preserved.

## Migration Guide

No migration needed. Existing video generation continues to work unchanged.

## Future Enhancements

1. **Image Discovery**: Implement database query to find recent images in chat history
2. **Image Upload**: Add direct image upload capability for image-to-video generation  
3. **Model Metadata**: Enhance model discovery to include type information from API
4. **UI Components**: Add image selection UI for better user experience

## Troubleshooting

### Common Issues

1. **"Model requires source image" error**
   - Provide `sourceImageId` or `sourceImageUrl` parameter
   - Or switch to text-to-video model like LTX

2. **Invalid payload structure**
   - Check if using correct payload format for model type
   - Image-to-video uses `params` wrapper, text-to-video uses flat structure

### Debug Commands
```bash
npm run test:video:i2v  # Check payload structure
npm run test:video:dry  # Validate API integration
```

## Impact Assessment

- **Positive**: Enables premium VEO and KLING models for users
- **Risk**: Low - comprehensive testing and backward compatibility
- **Performance**: No impact on existing functionality
- **Cost**: User-controlled - image-to-video models are more expensive but optional 