# Image Generation 409 Error Fix

## Issue Description
Image generation was failing with 409 "Integrity error, create" when trying to generate images through the SuperDuperAI API.

## Error Analysis
From the logs, we identified several issues:

### 1. API Error 409 Conflict
```
📡 API Response Status: 409
❌ API Error Response: {"detail":"Integrity error, create"}
```

This suggests:
- Database integrity constraint violation
- Duplicate project creation attempts
- Concurrent requests with same seed/data
- VIP-only model access issues

### 2. Model Display Issues
```
🎨 ✅ Loaded dynamic image models: [undefined, undefined, ...]
```

Models were loading but displaying as `undefined` due to incorrect field access.

### 3. Expensive Model Selection
The system was defaulting to `azure-openai/gpt-image-1` which:
- Costs $2 per generation
- Requires VIP status (`vip_required: true`)
- May have stricter access controls

## Fixes Applied

### 1. Fixed Model Display
```typescript
// Before: m.id (doesn't exist)
console.log('🎨 ✅ Loaded dynamic image models:', availableModels.map(m => m.id));

// After: Use correct fields
console.log('🎨 ✅ Loaded dynamic image models:', availableModels.map(m => `${m.label || m.name} (${m.name})`));
```

### 2. Fixed Model Name Reference
```typescript
// Before: model.id (doesn't exist)
generation_config_name: model.id,

// After: Use correct field
generation_config_name: model.name,
```

### 3. Added Randomization to Prevent Conflicts
```typescript
// Add randomness to prevent 409 conflicts
const randomizedSeed = seed || Math.floor(Math.random() * 1000000000000);
const payload = createImagePayload(prompt, model, resolution, style, shotSize, null, randomizedSeed);
```

### 4. Fixed WebSocket Configuration
Previously fixed the missing `wsURL` in SuperDuperAI config.

## Model Interface Correction
The correct model interface is `IGenerationConfigRead`:
```typescript
export type IGenerationConfigRead = {
    name: string;           // ✅ Use this as ID
    label?: string | null;  // ✅ Use this for display
    type: GenerationTypeEnum;
    source: GenerationSourceEnum;
    params: Record<string, any>;
};
```

## Recommended Actions

### 1. Check Available Models
The system should prioritize free or budget-friendly models:
- `comfyui/flux` - Free FLUX model
- `comfyui/sdxl` - Free SDXL model
- Avoid expensive models like `azure-openai/gpt-image-1`

### 2. Implement Model Selection Logic
```typescript
// Priority order for default image models
const defaultPriority = [
  'comfyui/flux',     // Free FLUX
  'comfyui/sdxl',     // Free SDXL
  // Avoid expensive models
];
```

### 3. Add Retry Logic
For 409 errors, implement retry with different seeds:
```typescript
if (response.status === 409) {
  // Retry with different seed
  const newSeed = Math.floor(Math.random() * 1000000000000);
  // ... retry logic
}
```

### 4. User Feedback
When VIP models are selected, inform users about costs and requirements.

## Testing
1. Test with different models to identify which ones work
2. Test seed randomization to prevent conflicts
3. Verify WebSocket connections work after fixes
4. Check model loading displays correctly

## Files Modified
- `lib/config/superduperai.ts` - Added wsURL field
- `artifacts/image/server.ts` - Fixed model display logging
- `lib/ai/api/generate-image.ts` - Fixed model field usage and added randomization
- `docs/maintenance/changelog/websocket-config-fix.md` - WebSocket documentation

## Next Steps
1. Test image generation with free models
2. Monitor for remaining 409 errors
3. Implement proper model selection UI
4. Add cost warnings for expensive models 