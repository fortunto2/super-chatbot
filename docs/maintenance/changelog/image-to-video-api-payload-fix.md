# Fix: Correct Image-to-Video API Payload Format

**Date**: 2025-01-30
**Type**: Critical API Fix
**Component**: Video Generation - Image-to-Video API Payload
**Files Modified**:

- `lib/ai/api/video-generation-strategies.ts`
- `app/tools/video-generator/hooks/use-video-generator.ts`
- `app/api/file/upload/route.ts` (new)

## Problem

**Root Cause**: Wrong API payload structure for image-to-video generation causing API validation errors.

**Incorrect Format (Before)**:

```json
{
  "config": {
    "prompt": "animate this image",
    "generation_config_name": "google-cloud/veo2",
    "params": {
      "duration": 5,
      "aspect_ratio": "16:9",
      "source_image_url": "data:image/webp;base64,..."
    }
  }
}
```

**Impact**: API rejecting requests, no video generation possible.

## Solution

**Correct Format (After)**: Following SuperDuperAI API specification:

```json
{
  "params": {
    "config": {
      "seed": 38191716379278,
      "steps": 50,
      "width": 1920,
      "height": 1080,
      "prompt": "animate this image",
      "duration": 5,
      "batch_size": 1,
      "aspect_ratio": "16:9",
      "negative_prompt": ""
    },
    "file_ids": ["file-id"], // For uploaded files
    "references": [
      {
        // For Base64 data URLs
        "type": "source",
        "reference_url": "data:image/webp;base64,..."
      }
    ],
    "generation_config": {
      "name": "google-cloud/veo2",
      "type": "image_to_video",
      "label": "Google VEO2 (Image-to-Video)",
      "source": "google_cloud"
    }
  }
}
```

## Technical Changes

### 1. ImageToVideoStrategy.generatePayload() Rewrite

- **Structure**: `config` → `params.config`
- **Generation Config**: Moved to `params.generation_config` with complete params
- **Image References**: Using `file_ids` or `references` arrays
- **Resolution**: Set width/height to `null` for image-to-video
- **Complete Config**: Added params with arguments_template and pricing

### 2. New Resolution Parsing

```typescript
private parseResolution(resolution: any): { width: number, height: number, aspectRatio: string } {
  // Handles both object and string resolution formats
  // Calculates proper aspect ratio using GCD
}
```

### 3. File Upload Priority System

```typescript
// 1. Try file upload first (preferred)
const uploadResponse = await fetch("/api/file/upload", {
  method: "POST",
  body: uploadFormData, // FormData with 'payload' field
});

if (uploadResponse.ok) {
  sourceImageId = result.id; // Use file_ids array
} else {
  // 2. Fallback to Base64 data URL
  sourceImageUrl = await fileToBase64DataUrl(file); // Use references array
}
```

### 4. New API Routes

- **`/api/file/upload`**: Server-side file upload proxy to SuperDuperAI
- **Validation**: File type (JPEG, PNG, WebP), size limits (10MB)
- **Response**: `{id, url, type}` for successful uploads
- **Error Handling**: Graceful fallback to Base64 on failures

### 5. Image Reference Handling

```typescript
// Prefer file_ids over references (mutual exclusion)
if (params.sourceImageId) {
  payload.params.file_ids = [params.sourceImageId];
  payload.params.references = []; // Empty when using file_ids
} else if (params.sourceImageUrl) {
  payload.params.file_ids = [];
  payload.params.references = [
    {
      type: "source",
      reference_url: params.sourceImageUrl,
    },
  ];
}
```

## API Payload Comparison

| Field    | Old Location                     | New Location                         |
| -------- | -------------------------------- | ------------------------------------ |
| prompt   | `config.prompt`                  | `params.config.prompt`               |
| duration | `config.params.duration`         | `params.config.duration`             |
| model    | `config.generation_config_name`  | `params.generation_config.name`      |
| image    | `config.params.source_image_url` | `params.references[0].reference_url` |

## Results Expected

✅ **API Compatibility**: Payload matches SuperDuperAI specification exactly  
✅ **File Upload Priority**: Prefers file_ids over Base64 references for better quality  
✅ **Robust Fallback**: Automatic Base64 conversion when upload fails  
✅ **Resolution Handling**: Correct null width/height for image-to-video  
✅ **Complete Config**: Full generation_config with params and pricing  
✅ **Error Resilience**: Graceful handling of backend magic library issues

## Testing

```bash
# Test complete image-to-video generation flow
1. Upload image file (JPEG, PNG, WebP)
2. Select "Image-to-Video" mode
3. Add animation prompt (optional)
4. Generate video
5. Monitor console logs:
   - "🎬 Attempting file upload to get file_id..."
   - Either: "✅ File upload successful, file_id: xxx"
   - Or: "⚠️ File upload failed, falling back to Base64..."
6. Check payload structure:
   - Root object: "params"
   - Either: "file_ids": ["file-id"] (preferred)
   - Or: "references": [{"type": "source", "reference_url": "..."}]
   - Complete "generation_config" with params
   - Null width/height in config
7. Verify polling fallback after 15 seconds if SSE fails
8. Expected result: Video generated within 1-3 minutes
```

## Integration with Previous Fixes

This fix complements:

- **[Client-Side Base64 Conversion](./client-side-base64-conversion-fix.md)** - Provides Base64 data URL
- **[Backend Magic Library Workaround](./backend-magic-library-workaround.md)** - Avoids file upload issues
- **[Strategy Pattern Implementation](../video-generation/strategy-pattern-architecture.md)** - Extensible architecture maintained

## Future Considerations

- **File Upload Support**: When backend magic library is fixed, can use `file_ids` instead of `references`
- **Multiple Images**: Payload supports multiple file_ids/references for advanced use cases
- **Model Parameters**: Can extend `generation_config` with model-specific parameters

---

**Impact**: Critical fix enabling proper image-to-video API communication  
**Priority**: High - Core functionality restoration  
**Status**: ✅ Completed with file upload system and polling fallback
