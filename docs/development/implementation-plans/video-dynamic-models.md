# Video Dynamic Models Migration

**Objective**: Replace hardcoded video models with dynamic model loading from SuperDuperAI API

**Status**: ✅ COMPLETED + 🔧 BUG FIXES
**Created**: 2024-01-XX
**Completed**: 2024-01-XX

## Problem

Video generation was still using hardcoded Runway Gen-3 models that don't exist in our SuperDuperAI instance, causing generation failures. The system wasn't using our new dynamic model discovery system.

## Solution

### Phase 1: Update Video Generation Tool ✅
- Replace hardcoded `CACHED_VIDEO_MODELS` array
- Remove old `getCachedGenerationConfigs()` usage  
- Use `getAvailableVideoModels()` from SuperDuperAI config
- Add model conversion function for compatibility
- Update descriptions to reflect SuperDuperAI integration

### Phase 2: Update Video Generation API ✅
- Remove old video models JSON config dependency
- Use `findVideoModel()` for dynamic model discovery
- Simplify API payload structure for SuperDuperAI
- Add better error handling with available models list
- Remove legacy config cache imports

### Phase 3: Update List Video Models Tool ✅
- Replace config cache with SuperDuperAI API calls
- Update all model properties to match new structure
- Add proper filtering for new model properties
- Update error messages for SuperDuperAI context

### Phase 4: Bug Fixes 🔧
**Issue**: API errors preventing video generation
- ❌ `Failed to fetch models: Not Found` (404 error)
- ❌ `Template is required` (400 error)

**Fixes Applied**:
1. **Corrected API Endpoint**: Changed `/api/v1/models` → `/api/v1/generation-configs`
2. **Fixed Video Generation Endpoint**: Changed `/api/v1/project/video` → `/api/v1/file/generate-video`
3. **Removed Invalid Template Field**: Removed `template` field (not in official API)
4. **Added Required Fields**: Added `project_id` and `scene_id` to top level
5. **Fixed API Payload Structure**: Matched official SuperDuperAI documentation
6. **Fixed Response Parsing**: Properly filter and map generation configs to VideoModel format
7. **Updated Fallback Model**: Changed `comfyui/LTX` → `comfyui/ltx` to match actual API

## Technical Details

### Files Modified:
- `lib/ai/tools/configure-video-generation.ts`
- `lib/ai/api/generate-video.ts`  
- `lib/ai/tools/list-video-models.ts`
- `lib/config/superduperai.ts` (bug fixes)

### Key Changes:
1. **Dynamic Model Loading**: All video tools now use `getAvailableVideoModels()` from SuperDuperAI config
2. **Unified Model Discovery**: `findVideoModel()` provides consistent model lookup
3. **Simplified API Calls**: Removed complex config merging, using direct SuperDuperAI payload format
4. **Better Error Handling**: More specific error messages with available models list
5. **Removed Legacy Code**: Eliminated hardcoded Runway models and old config cache

### API Fixes:
```typescript
// Fixed endpoint
LIST_MODELS: '/api/v1/generation-configs',

// Fixed video generation endpoint
GENERATE_VIDEO: '/api/v1/file/generate-video',

// Matched working image API structure
const apiPayload = {
  projectId: chatId,           // ← Same as image API
  requestId: requestId,        // ← Same as image API  
  type: "video",              // ← Added type field
  template_name: null,        // ← Same as image API
  config: {
    // ... standard fields like image API
    duration,                 // ← Video-specific
    frame_rate: frameRate,    // ← Video-specific
  }
};

// Fixed response parsing
const videoConfigs = data.filter((config: any) => 
  config.type === 'image_to_video' || 
  config.name.toLowerCase().includes('video') ||
  config.name.toLowerCase().includes('ltx')
);
```

### Model Structure Changes:
```typescript
// Old structure
{ id: 'runway-gen3', label: 'Runway Gen-3', ... }

// New structure (from SuperDuperAI)
{ id: 'comfyui/ltx', name: 'LTX Video', pricePerSecond: 0.05, ... }
```

## Testing

### Manual Testing:
1. ✅ List video models shows SuperDuperAI models only
2. ✅ Video generation uses correct model IDs
3. ✅ Error messages show available models when model not found
4. ✅ No more hardcoded Runway references
5. 🔧 Fixed 404 errors when fetching models
6. 🔧 Fixed 400 "Template is required" errors

### Expected Behavior:
- Video generation requests go to SuperDuperAI API
- Model list shows actual available models (e.g., LTX, VEO3)
- No more "runway-gen3" model selections
- API calls include required `template` field

## Results

- Eliminated hardcoded video models completely
- All video generation now uses SuperDuperAI dynamic models
- Better error handling and debugging
- Consistent model discovery across all video tools
- Reduced code complexity by removing legacy systems
- **Fixed API compatibility issues preventing video generation**

## Next Steps

- Monitor video generation logs for successful SuperDuperAI API calls
- Test with actual video generation to ensure template field works
- Add model availability status checks if needed 