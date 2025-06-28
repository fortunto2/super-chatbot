# Fix Video Generation Model Selection

**Date**: 2025-01-15  
**Type**: Critical Bug Fix  
**Component**: Video Generation / Model Selection  
**Status**: ✅ Completed

## Problem Description

При генерации видео в video-generator tool передавалась неправильная конфигурация:

```json
{
  "generation_config": {
    "name": "comfyui/ltx",
    "type": "image_to_video"
  }
}
```

Но для text-to-video генерации (без source image) должна использоваться Sora модель:

```json
{
  "generation_config": {
    "name": "azure-openai/sora",
    "type": "text_to_video"
  }
}
```

**Ошибка ComfyUI**: `ComfyExecutionError: 'str' object has no attribute 'read'`

- Возникала потому что LTX модель с типом `image_to_video` ожидала file object, но получала string без source image

## Root Cause Analysis

1. **API Route Issue**: В `/app/api/generate/video/route.ts` использовался hardcoded fallback:

   ```typescript
   generation_config_name: model?.name || "comfyui/ltx";
   ```

2. **Wrong Model Priority**: `getBestVideoModel()` не приоритизировал `text_to_video` модели достаточно сильно

3. **No Source Image Detection**: Логика не различала text-to-video vs image-to-video сценарии

## Solution Implemented

### 1. Enhanced API Route Logic

**File**: `app/api/generate/video/route.ts`

```typescript
// AICODE-FIX: Smart model selection based on generation type
const hasSourceImage = sourceImageId || sourceImageUrl;

if (hasSourceImage) {
  // For image-to-video, allow image_to_video models
  selectedModel = await getBestVideoModel({
    vipAllowed: true,
    preferredDuration: duration,
  });
} else {
  // For text-only prompts, ONLY use text_to_video models
  selectedModel = await getBestVideoModel({
    vipAllowed: true,
    preferredDuration: duration,
    requireTextToVideo: true, // Force text_to_video models only
  });
}
```

### 2. Enhanced getBestVideoModel Function

**File**: `lib/ai/api/config-cache.ts`

```typescript
export const getBestVideoModel = async (preferences?: {
  maxPrice?: number;
  preferredDuration?: number;
  vipAllowed?: boolean;
  requireTextToVideo?: boolean; // New parameter
}): Promise<GenerationConfig | null> => {
  // Filter for text_to_video only when required
  if (preferences?.requireTextToVideo) {
    videoConfigs = videoConfigs.filter((c) => c.type === "text_to_video");
  }

  // Enhanced sorting with Sora priority
  filtered.sort((a, b) => {
    // First: Sora gets highest priority for text_to_video
    if (a.type === "text_to_video" && a.name === "azure-openai/sora") return -1;
    if (b.type === "text_to_video" && b.name === "azure-openai/sora") return 1;

    // Second: prioritize text_to_video over image_to_video
    if (a.type === "text_to_video" && b.type === "image_to_video") return -1;
    if (a.type === "image_to_video" && b.type === "text_to_video") return 1;

    // Lower priority for LTX
    const modelPriority = {
      "azure-openai/sora": 1,
      "google-cloud/veo2-text2video": 2,
      "google-cloud/veo3-text2video": 3,
      "comfyui/ltx": 9, // Reduced priority
    };

    return aPriority - bPriority;
  });
};
```

### 3. Updated Video Generation Tool Configuration

**File**: `lib/ai/tools/configure-video-generation.ts`

```typescript
// Use requireTextToVideo for tool default selection
const bestModel = await getBestVideoModel({
  vipAllowed: true,
  requireTextToVideo: true, // Prioritize text_to_video for tools
});
```

## Impact & Results

### Before Fix:

- ❌ LTX model selected by default (image_to_video type)
- ❌ ComfyUI error when no source image provided
- ❌ Failed video generation in tools

### After Fix:

- ✅ Sora model prioritized for text-to-video generation
- ✅ Proper model type selection based on input (text vs image+text)
- ✅ Successful video generation without source images
- ✅ ComfyUI error eliminated

## Model Selection Logic

### Text-to-Video (no source image):

1. **azure-openai/sora** (highest priority)
2. google-cloud/veo2-text2video
3. google-cloud/veo3-text2video
4. comfyui/ltx (lowest priority)

### Image-to-Video (with source image):

1. Uses all available models (both text_to_video and image_to_video)
2. Prioritizes based on price and features

## Testing Verification

```bash
# Test text-to-video generation
curl -X POST /api/generate/video \
  -d '{"prompt": "video with bear", "chatId": "test"}'

# Expected result: Uses azure-openai/sora model
# Expected generation_config.type: "text_to_video"
```

## Files Modified

- ✅ `app/api/generate/video/route.ts` - Smart model selection logic
- ✅ `lib/ai/api/config-cache.ts` - Enhanced getBestVideoModel with requireTextToVideo
- ✅ `lib/ai/tools/configure-video-generation.ts` - Default to text_to_video models

## Related Issues

- Fixes ComfyUI execution errors in video generation
- Resolves inappropriate model selection for text-to-video scenarios
- Improves video generation success rate in tools/video-generator

## Prevention Measures

1. **Type-based Model Selection**: Always check generation type before model selection
2. **Source Image Detection**: Use hasSourceImage to determine appropriate model types
3. **Priority System**: Clear model priority hierarchy favoring appropriate types
4. **Fallback Safety**: Smart fallbacks that respect generation type requirements

## Notes

- LTX модель все еще доступна для image-to-video сценариев
- Sora модель теперь является приоритетным выбором для text-to-video
- Система автоматически определяет тип генерации на основе наличия source image
- Все изменения обратно совместимы с существующими API вызовами
