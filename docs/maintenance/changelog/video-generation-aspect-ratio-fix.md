# Video Generation Sora API aspect_ratio Fix

**Date**: 2025-01-25  
**Type**: Bug Fix  
**Component**: Video Generation - Sora API Integration

## Problem Description

Video generation was failing with Pydantic validation error for Sora models:

```
pydantic_core._pydantic_core.ValidationError: 1 validation error for SoraVideoConfig
aspect_ratio
  Input should be '1:1', '16:9' or '9:16' [type=literal_error, input_value=None, input_type=NoneType]
```

### Error Context

- Model: `azure-openai/sora`
- Error occurs during video generation in chatbot
- API payload validation fails on backend

## Root Cause Analysis

The issue was in the video generation payload structure in `lib/ai/api/generate-video-hybrid.ts`:

```typescript
// PROBLEMATIC CODE (causing validation error):
const payload = {
  config: {
    aspecRatio: resolution.aspectRatio || "16:9", // WRONG: typo in parameter name
    // ...
  },
};
```

The API used `aspecRatio` (with typo) instead of the correct `aspect_ratio` parameter required by Sora API.

## Solution Implemented

### Fixed Parameter Name

**File**: `lib/ai/api/generate-video-hybrid.ts`

```typescript
// FIXED CODE:
const payload = {
  type: "media",
  template_name: null,
  style_name: styleId,
  config: {
    prompt: prompt,
    negative_prompt: negativePrompt,
    shot_size: shotSize.id,
    style_name: styleId,
    aspect_ratio: resolution.aspectRatio || "16:9", // FIXED: Correct parameter name
    generation_config_name: model.name,
    height: String(resolution.height),
    qualityType: resolution.qualityType || "hd",
    width: String(resolution.width),
    duration: String(duration),
    fps: String(frameRate),
    source_image_id: sourceImageId,
    source_image_url: sourceImageUrl,
    entity_ids: [],
    references: [],
  },
};
```

## Key Changes

1. **Parameter Name**: Changed `aspecRatio` → `aspect_ratio`
2. **API Compliance**: Now matches Sora API schema requirements
3. **Validation**: Ensures aspect_ratio gets proper value ("16:9", "1:1", or "9:16")

## Testing Results

- ✅ Sora model video generation now works without validation errors
- ✅ aspect_ratio parameter properly passed to API
- ✅ Backend validation passes successfully
- ✅ Video generation continues normally after this fix

## Impact

- **Fixed**: All Sora model video generation requests
- **Improved**: API compliance and reliability
- **Status**: Video generation fully functional for `azure-openai/sora` model

## Related Files

- `lib/ai/api/generate-video-hybrid.ts` - Main fix
- `artifacts/video/server.ts` - Uses the fixed function
- Video generation now works correctly in both chatbot and video generator tool
