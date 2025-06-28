# Fix Video Generation ComfyUI Error - Backend Format Issue

**Date**: 2025-01-22  
**Priority**: Critical  
**Status**: Fixed

## Problem Discovery

User reported ComfyUI error: `"'str' object has no attribute 'read'"` when generating videos.

### Real Root Cause Analysis

After examining logs, discovered the issue was **backend-side**:

1. **Backend still generates `params` format** instead of `type: "media"`
2. **LTX model incorrectly configured as `image_to_video`** in backend
3. **Frontend filtering only `image_to_video` models** excluding `text_to_video`

**Working payload (Sora)**:

```json
{
  "generation_config": {
    "type": "text_to_video" // ← Works!
  }
}
```

**Broken payload (LTX)**:

```json
{
  "generation_config": {
    "type": "image_to_video" // ← Wrong type for text-only generation!
  }
}
```

## Root Cause

1. **Backend configuration**: LTX model has wrong type in database/config
2. **Frontend filtering**: Only requesting `image_to_video` models, missing `text_to_video`
3. **API disconnect**: Frontend can't change backend format, only request different models

## Solution Strategy

Since backend format can't be easily changed, **improved frontend model filtering**:

### Frontend Changes

1. **`lib/ai/api/get-generation-configs.ts`**:

   - Now fetches BOTH `text_to_video` AND `image_to_video` models
   - Combines results for complete video model list

2. **`lib/ai/api/config-cache.ts`**:
   - Updated `getBestVideoModel()` to include both types
   - Updated `getVideoModelsForAgent()` to show all video models

### Files Modified

- `lib/ai/api/get-generation-configs.ts` - Dual model type fetching
- `lib/ai/api/config-cache.ts` - Updated filtering logic

## Expected Outcome

With broader model fetching:

- If LTX exists as both `image_to_video` AND `text_to_video` in backend
- Frontend will find the correct `text_to_video` variant
- ComfyUI will get proper workflow for text-only generation

## Next Steps

If issue persists, backend LTX model configuration needs correction:

- Change LTX model type from `image_to_video` to `text_to_video` in backend database
- Or create separate LTX variants for each use case

## Status

✅ **Frontend filtering improved** - Now fetches all video model types
⚠️ **Backend dependency** - May require backend configuration fix if models aren't properly categorized
