# Video Model Selection Guide for AI Agents

## Overview

This guide explains how AI agents can dynamically discover and select the best video generation models from the SuperDuperAI API.

## Available Tools

### 1. `listVideoModels` - Discover Available Models

**Purpose**: Get a list of all available video generation models with their capabilities and pricing.

**Usage Examples**:

```typescript
// Get agent-friendly formatted list
await listVideoModels({ format: 'agent-friendly' });

// Get simple list with just names and prices
await listVideoModels({ format: 'simple' });

// Get detailed information
await listVideoModels({ format: 'detailed' });

// Filter by price (max $0.5 per second)
await listVideoModels({ 
  format: 'simple',
  filterByPrice: 0.5 
});

// Filter by duration support (10 seconds)
await listVideoModels({ 
  format: 'detailed',
  filterByDuration: 10 
});

// Exclude VIP models
await listVideoModels({ 
  format: 'simple',
  excludeVip: true 
});
```

### 2. `findBestVideoModel` - Smart Model Selection

**Purpose**: Automatically find the optimal model based on specific requirements.

**Usage Examples**:

```typescript
// Find cheapest model under $0.4/sec
await findBestVideoModel({ 
  maxPrice: 0.4 
});

// Find model for 15-second video
await findBestVideoModel({ 
  preferredDuration: 15 
});

// Find model excluding VIP requirements
await findBestVideoModel({ 
  maxPrice: 0.5,
  vipAllowed: false 
});

// Prioritize quality over price
await findBestVideoModel({ 
  maxPrice: 1.0,
  prioritizeQuality: true 
});
```

### 3. `configureVideoGeneration` - Generate Videos

**Purpose**: Configure settings or generate videos directly with dynamic model selection.

**Usage Examples**:

```typescript
// Generate video with LTX (cheapest option)
await configureVideoGeneration({
  prompt: "A serene ocean sunset with gentle waves",
  model: "comfyui/ltx", // LTX model at $0.4/sec
  duration: 5,
  resolution: "1920x1080"
});

// Generate with VEO3 (premium quality)
await configureVideoGeneration({
  prompt: "High-quality cinematic scene",
  model: "google-cloud/veo3", // VEO3 at $3/sec (VIP required)
  duration: 8,
  resolution: "1920x1080"
});

// Generate with auto-selected model
const bestModel = await findBestVideoModel({ maxPrice: 1.0 });
await configureVideoGeneration({
  prompt: "Futuristic cityscape at night",
  model: bestModel.data.name, // Use recommended model
  duration: 10
});
```

## Available Models (Current API Data)

The following models are currently available from SuperDuperAI API:

### Google VEO Models (VIP Required)
- `google-cloud/veo3-text2video` - Google VEO3 Text-to-Video ($3/sec, 5-8s)
- `google-cloud/veo3` - Google VEO3 Image-to-Video ($3/sec, 5-8s)
- `google-cloud/veo2-text2video` - Google VEO2 Text-to-Video ($2/sec, 5-8s)
- `google-cloud/veo2` - Google VEO2 Image-to-Video ($2/sec, 5-8s)

### LTX Models (Local)
- `comfyui/ltx` - LTX Image-to-Video ($0.4/sec, 5s)
- `comfyui/lip-sync` - LipSync Video-to-Video ($0.4/sec, 5s)

### KLING Models (VIP Required)
- `fal-ai/kling-video/v2.1/standard/image-to-video` - KLING 2.1 Standard ($1/sec, 5-10s)
- `fal-ai/kling-video/v2.1/pro/image-to-video` - KLING 2.1 Pro ($2/sec, 5-10s)

### Minimax Models (VIP Required)
- `fal-ai/minimax/video-01/image-to-video` - Minimax ($1.2/sec, 5s)
- `fal-ai/minimax/video-01-live/image-to-video` - Minimax Live ($1.2/sec, 5s)

### OpenAI Sora (VIP Required)
- `azure-openai/sora` - OpenAI Sora Text-to-Video ($2/sec, 5-20s)


## Agent Workflow Examples

### Example 1: Budget-Conscious Generation (LTX)

```typescript
// Step 1: Find affordable models (non-VIP only)
const affordableModels = await listVideoModels({
  format: 'simple',
  filterByPrice: 0.5,
  excludeVip: true
});

// Step 2: Select best from affordable options (LTX is cheapest at $0.4/sec)
const bestAffordable = await findBestVideoModel({
  maxPrice: 0.5,
  vipAllowed: false
});

// Step 3: Generate video with LTX
if (bestAffordable.success) {
  await configureVideoGeneration({
    prompt: "Beautiful nature landscape with flowing water",
    model: bestAffordable.data.name, // Will be "comfyui/ltx"
    duration: 5 // LTX supports 5-second videos
  });
}
```

### Example 2: Quality-First Generation (VEO3)

```typescript
// Step 1: Find high-quality models (including VIP)
const qualityModels = await listVideoModels({
  format: 'detailed',
  filterByPrice: 5.0 // Higher budget for premium quality
});

// Step 2: Select best quality model (VEO3 is top-tier)
const bestQuality = await findBestVideoModel({
  maxPrice: 3.0,
  prioritizeQuality: true,
  vipAllowed: true
});

// Step 3: Generate with VEO3 (premium model)
await configureVideoGeneration({
  prompt: "Cinematic masterpiece with dramatic lighting",
  model: bestQuality.data.name, // Will be "google-cloud/veo3"
  duration: 8, // VEO3 supports 5-8 seconds
  frameRate: 24 // VEO3 uses 24fps
});
```

### Example 3: Duration-Specific Selection (Sora)

```typescript
// Step 1: Check which models support longer videos
const longVideoModels = await listVideoModels({
  format: 'detailed',
  filterByDuration: 15 // 15-second videos
});

// Step 2: Find best for longer duration (Sora supports up to 20s)
const bestForLong = await findBestVideoModel({
  preferredDuration: 15,
  maxPrice: 2.0, // Sora at $2/sec
  vipAllowed: true
});

// Step 3: Generate longer video with Sora
await configureVideoGeneration({
  prompt: "Epic cinematic sequence with multiple scenes",
  model: bestForLong.data.name, // Will be "azure-openai/sora"
  duration: 15 // Sora supports 5-20 seconds
});
```

## Model Selection Logic

### Price-Based Selection
Models are sorted by price per second (ascending) when optimizing for cost.

### Quality-Based Selection  
When `prioritizeQuality: true`, models are evaluated by:
1. Source reputation (Google VEO, Runway, etc.)
2. Feature completeness
3. Price as secondary factor

### Duration Compatibility
Models with `available_durations` restrictions are filtered based on requested duration.

### VIP Requirements
Models requiring VIP access are excluded when `vipAllowed: false`.

## Error Handling

### No Models Found
```typescript
const result = await findBestVideoModel({ maxPrice: 0.1 });
if (!result.success) {
  // Fallback: relax constraints or use default
  const fallback = await findBestVideoModel({ maxPrice: 0.5 });
}
```

### API Unavailable
```typescript
const models = await listVideoModels();
if (!models.success) {
  // Use static fallback models
  await configureVideoGeneration({
    prompt: "User request",
    model: "runway-gen3", // Fallback model
    duration: 10
  });
}
```

## Best Practices for Agents

### 1. Always Check Available Models First
```typescript
// Good: Check what's available
const models = await listVideoModels({ format: 'agent-friendly' });
// Then select appropriate model

// Bad: Assume specific model exists
await configureVideoGeneration({ model: "assumed-model" });
```

### 2. Use Smart Selection for User Requests
```typescript
// Good: Let system choose optimal model
const bestModel = await findBestVideoModel({
  maxPrice: userBudget,
  preferredDuration: requestedDuration
});

// Bad: Hardcode model choice
const model = "runway-gen3";
```

### 3. Provide Fallbacks
```typescript
let selectedModel = await findBestVideoModel({ maxPrice: 0.4 });

if (!selectedModel.success) {
  // Fallback to any available model
  const anyModel = await listVideoModels({ format: 'simple' });
  selectedModel = { data: { name: anyModel.data[0].name } };
}
```

### 4. Inform Users About Model Choice
```typescript
const model = await findBestVideoModel({ maxPrice: 0.5 });

if (model.success) {
  return `I'll use ${model.data.label} (${model.data.price_per_second}/sec) for your video generation.`;
}
```

## Caching and Performance

- Model lists are cached for 1 hour
- Subsequent calls use cached data for fast response
- Cache automatically refreshes when expired
- Stale cache used as fallback during API issues

## Troubleshooting

### Common Issues

**"No models found"**
- Check API connectivity
- Verify authentication tokens
- Try relaxing filter criteria

**"Model not available"**
- Use `listVideoModels` to see current options
- Model names change - don't hardcode them
- Use `findBestVideoModel` for automatic selection

**"VIP required"**
- Set `vipAllowed: true` in selection criteria
- Or filter out VIP models with `excludeVip: true`

### Debug Commands

```typescript
// Check cache status
const status = getCacheStatus();

// Force refresh models
const fresh = await getCachedGenerationConfigs(true);

// Test API connectivity
const test = await listVideoModels({ format: 'simple' });
``` 