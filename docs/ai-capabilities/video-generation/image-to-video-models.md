# Image-to-Video Models Support

## Overview

The video generation system now supports both text-to-video and image-to-video models. Image-to-video models (like Google VEO2, VEO3, and KLING 2.1) require a source image in addition to the text prompt to generate videos.

## Supported Model Types

### Text-to-Video Models
Generate videos from text prompts only:
- **LTX** (`comfyui/ltx`) - $0.40/sec, no VIP required, 5s max
- **Sora** (`azure-openai/sora`) - $2.00/sec, VIP required, up to 20s

### Image-to-Video Models  
Require source image + text prompt:
- **VEO3** (`google-cloud/veo3`) - $3.00/sec, VIP required, 5-8s
- **VEO2** (`google-cloud/veo2`) - $2.00/sec, VIP required, 5-8s
- **KLING 2.1** (`fal-ai/kling-video/v2.1/standard/image-to-video`) - $1.00/sec, VIP required, 5-10s

## API Payload Structure

### Image-to-Video Payload
```json
{
  "params": {
    "config": {
      "seed": 98962002139797,
      "steps": 50,
      "width": 1920,
      "height": 1080,
      "prompt": "Holloway leads the descent, gripping the curved rail...",
      "duration": 8,
      "batch_size": 1,
      "aspect_ratio": "16:9",
      "negative_prompt": ""
    },
    "file_ids": ["ed7f0616-2c39-4c2f-81ed-35e4f9c691c6"],
    "references": [{
      "type": "source",
      "reference_url": "https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/image/2025/6/4/8/GgPSMsa6xWapv39BMwZZFk.png"
    }],
    "generation_config": {
      "name": "google-cloud/veo2",
      "type": "image_to_video",
      "label": "Google VEO2 (Image-to-Video)",
      "params": {
        "vip_required": true,
        "price_per_second": 2,
        "arguments_template": "{\"prompt\": {{config.prompt|tojson}}, \"image_url\": \"{{reference.source}}\", \"aspect_ratio\": \"{{config.aspect_ratio}}\", \"duration\": {{config.duration|int}}, \"fps\": 24, \"enhance_prompt\": true, \"samples\": {{config.batch_size|default(1)}}, \"seed\": {{config.seed|int}}, \"negative_prompt\": {{config.negative_prompt|tojson}}}",
        "available_durations": [5, 6, 7, 8]
      },
      "source": "superduperai"
    }
  }
}
```

### Text-to-Video Payload
```json
{
  "projectId": "chat-id",
  "requestId": "vid_123",
  "type": "video",
  "template_name": null,
  "config": {
    "prompt": "Ocean waves gently crashing on a sandy beach...",
    "negative_prompt": "",
    "width": 1920,
    "height": 1080,
    "aspect_ratio": "16:9",
    "qualityType": "full_hd",
    "shot_size": "Long Shot",
    "seed": "123456789",
    "generation_config_name": "comfyui/ltx",
    "batch_size": 1,
    "style_name": "flux_steampunk",
    "entity_ids": [],
    "references": [],
    "duration": 10,
    "frame_rate": 30
  }
}
```

## Usage in AI Agent

### Agent Tool Parameters
The `configureVideoGeneration` tool now supports:
- `sourceImageId` - ID of source image for image-to-video models
- `sourceImageUrl` - URL of source image for image-to-video models

### Agent Behavior
1. **Model Detection**: Automatically detects image-to-video models by name patterns (veo, kling, image-to-video)
2. **Source Image Validation**: Requires source image for image-to-video models
3. **Error Handling**: Provides helpful error messages and suggests alternative models
4. **User Guidance**: Prompts user to provide source image or use text-to-video models

### Example Agent Interactions

**User requests VEO2 without source image:**
```
Agent: "VEO2 is an image-to-video model that needs a source image. Would you like to use the image you just generated, or do you have another image in mind?"
```

**User provides source image:**
```
User: "Generate video with VEO2 using image ID abc-123"
Agent: "I'll generate that video using VEO2 with your source image! Creating a video artifact..."
```

## Implementation Details

### Key Files Modified
- `lib/ai/api/generate-video.ts` - Added source image parameters and payload logic
- `lib/ai/tools/configure-video-generation.ts` - Added validation and parameters
- `lib/ai/prompts.ts` - Updated agent guidance for image-to-video models
- `artifacts/video/server.ts` - Updated artifact handlers

### Model Detection Logic
```typescript
const isImageToVideo = model.id.includes('veo') || 
                      model.id.includes('kling') ||
                      model.id.includes('image-to-video') ||
                      model.id.includes('img2vid');
```

### Validation Logic
```typescript
if (isImageToVideoModel && !sourceImageId && !sourceImageUrl) {
  return {
    error: `The selected model "${selectedModel.label}" is an image-to-video model and requires a source image.`,
    suggestion: "You can use a recently generated image from this chat as the source, or upload a new image first.",
    availableTextToVideoModels: [...]
  };
}
```

## Testing

### Test Coverage
- Image-to-video payload structure validation
- Text-to-video compatibility preservation  
- Source image requirement validation
- Error handling for missing source images

### Running Tests
```bash
# Test image-to-video functionality
npm run test:video:i2v

# Test general video generation
npm run test:video

# Test with real API (costs money)
npm run test:video:live
```

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

3. **Model not detected as image-to-video**
   - Verify model name contains 'veo', 'kling', or 'image-to-video'
   - Update detection logic if needed

### Debug Commands
```bash
# Check payload structure
npm run test:video:i2v

# Validate API integration
npm run test:video:dry
``` 