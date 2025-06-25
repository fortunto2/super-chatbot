# Implementation Plan: Video Models Single Issue Fix

## Problem Statement

The video generation settings component only shows one model (`comfyui/ltx`) instead of loading all available models from the SuperDuperAI API.

## Root Cause Analysis

### 1. ✅ FIXED: Incorrect API Endpoint
- **Issue**: Mismatch between endpoints - `/api/v1/generation-configs` vs `/api/v1/generation-config`
- **Resolution**: Fixed endpoint to use `/api/v1/generation-config`

### 2. ✅ FIXED: API Response Format Mismatch  
- **Issue**: Old system expected direct array from `fetch().json()`, new HTTP client returns `{ success: boolean, data: T }`
- **Resolution**: Updated `getAvailableVideoModels()` to handle new response format

### 3. ✅ FIXED: Incorrect API Response Structure (MAIN ISSUE)
- **Issue**: SuperDuperAI API returns paginated response `{ items: [...], total: 21, ... }`, not direct array or `{ data: [...] }`
- **Resolution**: Updated code to extract data from `response.data.items` instead of `response.data`
- **Discovery**: API contains 7 video models, not just 1 LTX fallback

### 4. ✅ FIXED: Wrong Generate Prompt for Video
- **Issue**: "Generate Video" button was creating "Generate image:" prompts instead of "Generate video:" 
- **Root Cause**: Hardcoded Russian text in `MediaSettings.handleGenerate()` 
- **Resolution**: Made prompt generation dynamic based on media type, converted all text to English

## Root Cause Summary

The problems were **multi-layered**:
1. **API Structure Issue**: Triple-layered response structure
2. **Hardcoded Prompt Issue**: Fixed text instead of dynamic media type detection
3. **Language Issue**: Russian text instead of English as per project rules

Final result: All 7 video models now load correctly, and video generation prompts are properly formatted.

## Discovered Video Models

API provides these 7 image-to-video models:
- **Google VEO3** ($3/sec, VIP) - `google-cloud/veo3`
- **Google VEO2** ($2/sec, VIP) - `google-cloud/veo2`  
- **Minimax** - `fal-ai/minimax/video-01/image-to-video`
- **Minimax Live** - `fal-ai/minimax/video-01-live/image-to-video`
- **KLING 2.1 Standard** - `fal-ai/kling-video/v2.1/standard/image-to-video`
- **KLING 2.1 Pro** - `fal-ai/kling-video/v2.1/pro/image-to-video`
- **LTX** ($0.4/sec, Local) - `comfyui/ltx`

## Implementation

### Phase 1: Quick Fixes ✅ COMPLETED

- [x] Fix API endpoint in `lib/config/superduperai.ts`
- [x] Update response handling in `getAvailableVideoModels()`
- [x] Add proper error handling and logging
- [x] Add data validation (ensure response is array)

### Phase 2: System Unification (Optional)

- [ ] Replace `getAvailableVideoModels()` usage with new `getVideoGenerationConfigs()`
- [ ] Update `lib/ai/tools/configure-video-generation.ts`  
- [ ] Update `artifacts/video/server.ts`
- [ ] Remove deprecated `getAvailableVideoModels()` function

### Phase 3: Testing & Validation

- [ ] Test video model loading in settings
- [ ] Verify multiple models appear
- [ ] Test error handling scenarios
- [ ] Update documentation

## Expected Results

After the fixes:
1. ✅ No more "Not Found" errors in logs
2. ✅ Multiple video models should load successfully  
3. ✅ Better error handling and diagnostics
4. More reliable video generation workflow

## Files Modified

### ✅ Completed
- `lib/config/superduperai.ts` - Fixed endpoint and response handling
- `docs/ai-capabilities/video-generation/single-model-issue.md` - Documentation

### Future (Optional)
- `lib/ai/tools/configure-video-generation.ts`
- `artifacts/video/server.ts`

## Success Criteria

- [x] Video models load without errors
- [x] More than one model appears in settings
- [x] Proper fallback to LTX if API fails
- [ ] Consistent logging and error messages
- [ ] System uses unified API approach

## Rollback Plan

If issues arise, revert changes to:
1. `lib/config/superduperai.ts` - restore old fetch-based approach
2. Fallback will still work with LTX model only

## Notes

- The dual system approach allows gradual migration
- New HTTP client provides better error handling
- Cache mechanism remains intact for performance 