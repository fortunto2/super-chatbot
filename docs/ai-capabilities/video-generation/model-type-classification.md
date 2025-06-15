# Video Model Type Classification Fix

## Problem Statement

The system was incorrectly classifying video models based on name patterns instead of actual API type information, causing confusion between text-to-video and image-to-video models.

## Symptoms

- User requests "Google VEO2 (Text-to-Video)" but system treats it as image-to-video model
- System incorrectly requires source images for text-to-video models
- VEO models always classified as image-to-video regardless of actual type

## Root Cause Analysis

### 1. Incorrect Type Detection Logic

**Old Logic (Broken)**:
```typescript
const isImageToVideoModel = selectedModel.id.includes('veo') || 
                           selectedModel.id.includes('kling') ||
                           selectedModel.id.includes('image-to-video');
```

This logic assumed **all** VEO models are image-to-video, but API provides both types:

### 2. API Provides Correct Type Information

**VEO Models in API**:
```json
{
  "name": "google-cloud/veo2-text2video",
  "label": "Google VEO2 (Text-to-Video)", 
  "type": "text_to_video"
}
{
  "name": "google-cloud/veo2",
  "label": "Google VEO2 (Image-to-Video)",
  "type": "image_to_video"
}
{
  "name": "google-cloud/veo3-text2video",
  "label": "Google VEO3 (Text-to-Video)",
  "type": "text_to_video" 
}
{
  "name": "google-cloud/veo3", 
  "label": "Google VEO3 (Image-to-Video)",
  "type": "image_to_video"
}
```

### 3. Missing Type Field in Interfaces

The `VideoModel` interfaces in both `lib/config/superduperai.ts` and `lib/types/media-settings.ts` were missing the `type` field.

## Solution

### 1. ✅ Added Type Field to VideoModel Interfaces

**In `lib/config/superduperai.ts`**:
```typescript
export interface VideoModel {
  // ... existing fields
  type?: 'image_to_video' | 'text_to_video'; // AICODE-NOTE: Model type for proper classification
}
```

**In `lib/types/media-settings.ts`**:
```typescript
export interface VideoModel {
  // ... existing fields  
  type?: 'image_to_video' | 'text_to_video'; // AICODE-NOTE: Model type for proper classification
}
```

### 2. ✅ Preserve Type Information from API

**In `lib/config/superduperai.ts`**:
```typescript
const models: VideoModel[] = videoConfigs.map((config: any) => ({
  // ... other mappings
  type: config.type, // AICODE-NOTE: Preserve actual type from API
}));
```

**In `lib/ai/tools/configure-video-generation.ts`**:
```typescript
function convertToVideoModel(sdModel: any): VideoModel {
  return {
    // ... other fields
    type: sdModel.type, // AICODE-NOTE: Preserve type information for proper classification
  };
}
```

### 3. ✅ Fixed Type Detection Logic

**New Logic (Correct)**:
```typescript
// AICODE-NOTE: Check if selected model is image-to-video based on actual type field from API
const isImageToVideoModel = selectedModel.type === 'image_to_video';

console.log('🔧 🎯 Model type check:', {
  modelId: selectedModel.id,
  modelName: selectedModel.label,
  apiType: selectedModel.type,
  isImageToVideo: isImageToVideoModel
});
```

### 4. ✅ Updated Model Filtering

**Include both video types**:
```typescript
const videoConfigs = data.filter((config: any) => 
  config.type === 'image_to_video' || 
  config.type === 'text_to_video' ||
  config.name.toLowerCase().includes('video') ||
  config.name.toLowerCase().includes('ltx')
);
```

## Result

Now the system correctly:

1. **Loads both text-to-video and image-to-video models**
2. **Distinguishes between VEO2 Text-to-Video and VEO2 Image-to-Video**
3. **Only requires source images for actual image-to-video models**
4. **Provides accurate error messages with correct model classifications**

## Available Model Types

### Text-to-Video Models (No Source Image Required)
- `google-cloud/veo3-text2video` - Google VEO3 (Text-to-Video)
- `google-cloud/veo2-text2video` - Google VEO2 (Text-to-Video)  
- `comfyui/ltx` - LTX Video

### Image-to-Video Models (Source Image Required)
- `google-cloud/veo3` - Google VEO3 (Image-to-Video)
- `google-cloud/veo2` - Google VEO2 (Image-to-Video)
- `fal-ai/minimax/video-01/image-to-video` - Minimax
- `fal-ai/minimax/video-01-live/image-to-video` - Minimax Live
- `fal-ai/kling-video/v2.1/standard/image-to-video` - KLING 2.1 Standard
- `fal-ai/kling-video/v2.1/pro/image-to-video` - KLING 2.1 Pro

## Files Modified

- `lib/config/superduperai.ts` - Added type field to VideoModel interface and preservation logic
- `lib/types/media-settings.ts` - Added type field to VideoModel interface  
- `lib/ai/tools/configure-video-generation.ts` - Fixed type detection logic and conversion function 