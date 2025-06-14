# Fix Video Generation for Image-to-Video Models

## Problem
Current video generation system doesn't support image-to-video models which require source images. SuperDuperAI API expects different payload structure for image-to-video models.

## Analysis

### Current Implementation Issues:
1. Video generation API doesn't distinguish between text-to-video and image-to-video models
2. No support for `file_ids` and `references` fields required for image-to-video
3. Agent prompt doesn't ask for source image when image-to-video model is selected
4. Model detection doesn't identify image-to-video capabilities

### Correct API Structure (from user example):
```json
{
  "params": {
    "config": { 
      "seed": 98962002139797,
      "steps": 50, 
      "width": 1920,
      "height": 1080,
      "prompt": "...",
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
        "arguments_template": "...",
        "available_durations": [5, 6, 7, 8]
      },
      "source": "google_cloud"
    }
  }
}
```

## Implementation Plan

### Phase 1: API Updates
1. **Update video generation API** (`lib/ai/api/generate-video.ts`):
   - Add `sourceImageId` parameter for image-to-video models
   - Add `sourceImageUrl` parameter for image-to-video models  
   - Modify payload structure to include `file_ids` and `references` when source image provided
   - Use correct `params` wrapper structure

2. **Update model information** (`lib/config/superduperai.ts`):
   - Add `type` field to model discovery to identify image-to-video models
   - Filter models by type when needed

### Phase 2: Agent Tool Updates
1. **Update video generation tool** (`lib/ai/tools/configure-video-generation.ts`):
   - Add `sourceImageId` parameter for image-to-video models
   - Detect when image-to-video model is selected and require source image
   - Implement image selection from chat history

2. **Update agent prompts** (`lib/ai/prompts.ts`):
   - Add guidance for image-to-video model usage
   - Include instructions to ask for source image when needed
   - Add logic to suggest using recently generated images from chat

### Phase 3: Chat Integration  
1. **Add image discovery**:
   - Function to find recent images in chat history
   - UI component to select source image for video generation
   - Auto-suggest last generated image for convenience

## Expected Outcomes
- Support for Google VEO2, KLING 2.1 and other image-to-video models
- Automatic image requirement detection based on model type
- Seamless user experience with image selection from chat history
- Proper API payload structure for SuperDuperAI backend

## Acceptance Criteria
- [x] Image-to-video models work without backend errors
- [x] Agent asks for source image when image-to-video model selected
- [x] Recent chat images can be selected as source (placeholder implementation)
- [x] API payload matches SuperDuperAI expected structure
- [x] All existing text-to-video functionality preserved

## Implementation Status: ✅ COMPLETED

### Changes Made:

1. **Updated Video Generation API** (`lib/ai/api/generate-video.ts`):
   - Added `sourceImageId` and `sourceImageUrl` parameters
   - Implemented image-to-video payload structure matching SuperDuperAI format
   - Added automatic model type detection based on model name patterns
   - Preserved existing text-to-video functionality

2. **Updated Video Generation Tool** (`lib/ai/tools/configure-video-generation.ts`):
   - Added `sourceImageId` and `sourceImageUrl` parameters
   - Implemented validation for image-to-video models requiring source images
   - Added helpful error messages with suggestions for alternative models

3. **Updated Agent Prompts** (`lib/ai/prompts.ts`):
   - Added guidance for image-to-video model usage
   - Included instructions to ask for source image when needed
   - Added model type categorization (text-to-video vs image-to-video)

4. **Updated Artifacts Handler** (`artifacts/video/server.ts`):
   - Added support for source image parameters in video generation
   - Updated both create and update document handlers

5. **Created Image Search Tool** (`lib/ai/tools/find-chat-images.ts`):
   - Placeholder implementation for finding recent images in chat
   - Ready for future database integration

6. **Added Comprehensive Tests** (`tests/video-generation-image-to-video-test.js`):
   - Tests image-to-video payload structure
   - Tests text-to-video functionality preservation
   - Tests validation for missing source images

### API Payload Structure:

**Image-to-Video (VEO, KLING):**
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

**Text-to-Video (LTX, Sora):**
```json
{
  "projectId": "chat-id",
  "requestId": "vid_123",
  "type": "video",
  "template_name": null,
  "config": { "prompt": "...", "negative_prompt": "", "width": 1920, "height": 1080, "aspect_ratio": "16:9", "qualityType": "full_hd", "shot_size": "Long Shot", "seed": "123", "generation_config_name": "comfyui/ltx", "batch_size": 1, "style_name": "flux_steampunk", "entity_ids": [], "references": [], "duration": 10, "frame_rate": 30 }
}
``` 