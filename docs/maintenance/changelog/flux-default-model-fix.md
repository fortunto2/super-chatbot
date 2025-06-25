# FLUX Default Model Switch

## Issue
Image generation was failing with 409 "Integrity error, create" because the system was defaulting to the expensive `azure-openai/gpt-image-1` model which:
- Costs $2 per generation
- Requires VIP status (`vip_required: true`)
- Has stricter access controls

## Solution
Switched default image model selection to prioritize free models, specifically `comfyui/flux`.

## Changes Made

### 1. Updated Default Model Priority
**File:** `lib/config/superduperai.ts`

```typescript
// Priority order for default image models - prioritize free models
const defaultPriority = [
  'comfyui/flux',     // Free FLUX model (top priority)
  'comfyui/sdxl',     // Free SDXL model
  'flux-dev',         // Alternative FLUX naming
  'sdxl',             // Alternative SDXL naming
];
```

### 2. Added Smart Model Filtering
Added logic to avoid expensive/VIP models:

```typescript
// Fallback: avoid expensive/VIP models
const safeModels = imageModels.filter(m => 
  !m.params?.vip_required && 
  (!m.params?.price || m.params.price <= 1)
);
```

### 3. Enhanced Logging
Added detailed logging to track model selection:
- Shows which models are available
- Logs which model was selected and why
- Warns about fallback selections

### 4. Updated Media Settings Factory
**File:** `lib/config/media-settings-factory.ts`

Now uses the `getDefaultImageModel()` function instead of arbitrary selection:

```typescript
// Get the default model using our priority system
const defaultModel = await getDefaultImageModel();
const defaultAdaptedModel = defaultModel 
  ? adaptModelForMediaSettings(defaultModel)
  : // ... fallback logic with FLUX priority
```

## Model Selection Logic

### Priority Order:
1. **comfyui/flux** - Free FLUX model ✅
2. **comfyui/sdxl** - Free SDXL model ✅
3. **flux-dev** - Alternative FLUX naming
4. **sdxl** - Alternative SDXL naming
5. **Safe models** - Non-VIP, price ≤ $1
6. **First available** - Last resort

### Filtering Criteria:
- ❌ Avoid `vip_required: true` models
- ❌ Avoid models with `price > $1`
- ✅ Prefer ComfyUI models (free)
- ✅ Prefer FLUX over SDXL

## Expected Results

### Before:
```
Model: azure-openai/gpt-image-1
Price: $2 per generation
VIP Required: true
Result: 409 "Integrity error, create"
```

### After:
```
Model: comfyui/flux
Price: $0 (free)
VIP Required: false
Result: Successful generation
```

## Testing

To test the new model selection:

1. **Clear Cache** (in browser console):
```javascript
// Clear any cached configurations
localStorage.clear();
```

2. **Check Logs** for:
```
🎯 Looking for default image model from priority list: ['comfyui/flux', ...]
✅ Selected default image model: comfyui/flux (priority: comfyui/flux)
```

3. **Generate Image** and verify:
- No 409 errors
- Uses comfyui/flux model
- Generation completes successfully

## Cache Clearing

If old models are still being used, clear the cache:

```typescript
import { clearModelCache } from '@/lib/config/superduperai';
import { clearMediaSettingsCache } from '@/lib/config/media-settings-factory';

clearModelCache();
clearMediaSettingsCache();
```

## Files Modified
- `lib/config/superduperai.ts` - Enhanced default model selection
- `lib/config/media-settings-factory.ts` - Uses new default model logic
- `docs/maintenance/changelog/flux-default-model-fix.md` - This documentation

## Next Steps
1. Test image generation with new default
2. Monitor for any remaining 409 errors  
3. Add UI indicators for model costs
4. Consider user model selection preferences 