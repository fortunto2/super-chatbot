# Fix Sora Priority for Video Generation

## Problem Identified

- **LTX model** was configured as `image_to_video` instead of `text_to_video` in backend
- **Default model selection** prioritized LTX over better models like Sora
- **ComfyUI errors** when processing text-only prompts without source images

## Root Cause Analysis

Frontend was correctly sending `type: "media"` format, but:

1. Backend LTX model misconfigured as `image_to_video`
2. Frontend model selection logic prioritized first available model (LTX)
3. ComfyUI expected image input for `image_to_video` workflow but got text-only prompt

## Changes Made

### 1. Enhanced Default Model Priority (`lib/config/superduperai.ts`)

- **Moved Sora to top priority** for text-to-video generation
- **Added logging** for model selection debugging
- **Prioritized text_to_video models** over image_to_video

### 2. Smart Model Selection (`lib/ai/api/config-cache.ts`)

- **Text_to_video models prioritized** over image_to_video
- **Quality-based ranking**: Sora > VEO > LTX
- **Graceful fallback** with price sorting

### 3. Agent Tool Enhancement (`lib/ai/tools/configure-video-generation.ts`)

- **Smart model selection** instead of first available
- **VIP model support** for better defaults
- **Type-aware model adaptation**

## Expected Results

### Before Fix:

```json
{
  "params": {
    "generation_config": {
      "name": "comfyui/ltx",
      "type": "image_to_video" // ❌ Wrong for text prompts!
    }
  }
}
```

### After Fix:

```json
{
  "params": {
    "generation_config": {
      "name": "azure-openai/sora",
      "type": "text_to_video" // ✅ Correct for text prompts!
    }
  }
}
```

## Benefits

- **Sora selected by default** for text-to-video generation
- **Better video quality** with appropriate model selection
- **ComfyUI errors eliminated** for text-only prompts
- **Graceful degradation** if premium models unavailable

## Status

- ✅ **Frontend model selection improved**
- ✅ **Smart prioritization implemented**
- ⚠️ **Backend LTX configuration may still need fix**

## Next Steps

1. Test video generation to verify Sora is selected
2. Monitor backend payloads for correct model types
3. Backend team: Consider separate LTX variants for different use cases
