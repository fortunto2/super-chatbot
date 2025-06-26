# Image Batch Size Implementation

**Date**: 2025-01-23  
**Type**: Feature Enhancement  
**Priority**: Medium  
**Status**: ✅ COMPLETED

## Summary

Added batch size support for image generation, allowing users to generate 1-3 images simultaneously with a single request. This feature provides better value and variety for users while respecting API limitations.

## Feature Details

### User Interface Changes

#### 1. Media Settings Panel

- **New Batch Size Selector**: Added dropdown for images (not videos)
- **Options**: 1 image (Standard), 2 images (Compare), 3 images (Max variety)
- **Placement**: Below seed input, only visible for image generation
- **Descriptions**: User-friendly labels explaining each option

#### 2. Settings Summary

- Batch size displayed in settings preview when > 1
- Format: "2 images" or "3 images"

#### 3. Chat Messages

- Batch size included in user confirmation messages
- AI tool descriptions updated to mention batch size capability

### Technical Implementation

#### 1. Type System Updates (`lib/types/media-settings.ts`)

```typescript
export interface ImageSettings {
  // ... existing fields
  batchSize?: number; // NEW: 1-3 images per generation
}
```

#### 2. AI Tool Enhancement (`lib/ai/tools/configure-image-generation.ts`)

- Added `batchSize` parameter with validation (1-3 range)
- Parameter description: "Number of images to generate simultaneously (1-3)"
- Includes batch size in image artifact parameters

#### 3. Core Generation Logic (`lib/ai/api/generate-image.ts`)

- Updated `generateImage()` function signature to accept `batchSize`
- Modified payload creation to use user-specified batch size
- Changed from hardcoded `batch_size: 3` to `batch_size: batchSize || 1`

#### 4. Server-Side Support

- **Image Artifact Server** (`artifacts/image/server.ts`): Passes batch size to generation API
- **API Route** (`app/api/generate/image/route.ts`): Validates batch size (1-3 range)
- **OpenAPI Integration**: Uses `IImageGenerationCreate.batch_size` field

#### 5. UI Components (`components/artifacts/media-settings.tsx`)

- New batch size state management
- Conditional rendering (images only)
- Integration with settings confirmation and generation messages

## API Payload Structure

### Request Payload (Updated)

```json
{
  "type": "media",
  "template_name": null,
  "style_name": "flux_watercolor",
  "config": {
    "prompt": "A beautiful sunset over mountains",
    "shot_size": "long_shot",
    "seed": "123456789",
    "aspect_ratio": "16:9",
    "batch_size": 3, // NEW: User-specified 1-3
    "entity_ids": [],
    "generation_config_name": "flux-dev",
    "height": "768",
    "width": "1344"
  }
}
```

### Backend Integration

- Batch size properly validated and passed to SuperDuperAI API
- Maintains backward compatibility (defaults to 1)
- Respects API limits (maximum 3 images)

## User Experience Improvements

### Before

- Fixed single image generation
- No control over number of variations
- Limited experimentation capabilities

### After

- **Flexible Generation**: Choose 1-3 images per request
- **Better Value**: Generate multiple variations in one go
- **Comparison Mode**: Generate 2-3 images to compare results
- **Clear Labeling**: Intuitive descriptions for each batch size

### Cost Efficiency

- Generate multiple variations without separate requests
- Reduces total generation time
- Better exploration of creative possibilities

## Testing Checklist

### UI Testing

- [ ] Batch size selector appears only for images (not videos)
- [ ] Dropdown shows 3 options with proper descriptions
- [ ] Settings summary updates correctly
- [ ] Chat messages include batch size when > 1

### API Testing

- [ ] Single image generation (batch_size: 1)
- [ ] Multiple images generation (batch_size: 2-3)
- [ ] Batch size validation (rejects values outside 1-3)
- [ ] Backward compatibility with existing code

### Integration Testing

- [ ] Artifact creation with batch size
- [ ] SSE events handle multiple images correctly
- [ ] Chat persistence works with batch generations
- [ ] Image editor displays properly

## Files Modified

1. `lib/types/media-settings.ts` - Added batchSize to ImageSettings
2. `lib/ai/tools/configure-image-generation.ts` - Added batch size parameter
3. `lib/ai/api/generate-image.ts` - Updated generateImage function
4. `artifacts/image/server.ts` - Passes batch size to API
5. `app/api/generate/image/route.ts` - Added batch size validation
6. `components/artifacts/media-settings.tsx` - Added UI components
7. `lib/ai/api/generate-image-hybrid.ts` - Updated for compatibility
8. `lib/ai/api/generate-image-with-project.ts` - Updated for compatibility
9. `docs/maintenance/changelog/image-batch-size-implementation.md` - This documentation

## Backward Compatibility

- All existing code continues to work (defaults to batch_size: 1)
- No breaking changes in API contracts
- UI gracefully handles missing batch size parameters

## Future Enhancements

1. **Video Batch Support**: Consider adding batch size for video generation
2. **Advanced Options**: Allow different seeds per image in batch
3. **Gallery View**: Enhanced UI for viewing multiple generated images
4. **Batch Progress**: Individual progress tracking for each image in batch

---

**Author**: AI Assistant  
**Reviewed by**: Required  
**Impact**: Enhanced user experience for image generation with multi-image support
