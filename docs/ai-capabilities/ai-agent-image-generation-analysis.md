# AI Agent Image Generation Behavior Analysis

## Overview

This document analyzes how the AI agent in the chat interface understands and uses image generation tools. Based on system prompts and code analysis, the AI agent has sophisticated understanding of parameters and automatic enhancement capabilities.

## System Architecture

### Available Tools

The AI agent has access to the following tools for image generation:

1. **enhancePrompt** - Enhances and translates prompts for better results
2. **configureImageGeneration** - Main tool for generating images
3. **createDocument** - Creates image artifacts with real-time progress

### Tool Chain Flow

```
User Input → AI Agent Analysis → Enhancement Decision → Tool Execution → Image Artifact
```

## Key Behaviors

### 1. Automatic Prompt Enhancement

The AI agent automatically enhances prompts when:

- **Russian text** - Any Russian input is translated and enhanced
- **Short English** - Prompts < 50 characters or < 5 words
- **Basic descriptions** - Simple prompts lacking quality descriptors

Example flow:
```
User: "мальчик с мячиком"
↓
AI: enhancePrompt(mediaType='image', enhancementLevel='detailed')
↓
Enhanced: "A young boy playing with a colorful ball in a sunny park, professional photography, high quality, detailed, sharp focus"
↓
AI: configureImageGeneration(prompt=enhanced_prompt)
```

### 2. Parameter Understanding

The AI agent intelligently extracts parameters from natural language:

#### Model Selection
- Understands model names: "FLUX", "Imagen", "DALL-E"
- Dynamically loads available models from SuperDuperAI API
- Defaults to `comfyui/flux` if not specified

#### Resolution Parsing
The AI agent understands various resolution formats:
- Numeric: `"1920x1080"`, `"1024×1024"` 
- Named: `"full hd"`, `"4k"`, `"hd"`
- Descriptive: `"square"`, `"vertical"`, `"horizontal"`
- Aspect ratios: `"16:9"`, `"1:1"`, `"9:16"`

#### Style Recognition
Maps natural language to style IDs:
- `"realistic"` → `flux_realistic`
- `"watercolor"` → `flux_watercolor`
- `"cinematic"` → `flux_cinematic`
- `"anime"`, `"cartoon"`, `"steampunk"`, etc.

#### Shot Size Understanding
- `"portrait"` → `close-up` or `medium-close-up`
- `"close-up"`, `"medium shot"`, `"long shot"`
- `"extreme close-up"`, `"two-shot"`, `"detail shot"`

### 3. Intelligent Tool Usage

#### Settings Request
When user asks for settings without a prompt:
```
User: "show me image generation settings"
AI: configureImageGeneration() // No prompt parameter
Result: Shows configuration panel
```

#### Direct Generation
When user provides a description:
```
User: "beautiful sunset over mountains"
AI: configureImageGeneration(prompt="beautiful sunset...")
Result: Creates image artifact with real-time progress
```

## Implementation Details

### System Prompt Instructions

From `lib/ai/prompts.ts`:

```typescript
**Using `configureImageGeneration`**
- When user requests image generation configuration/settings, call configureImageGeneration WITHOUT prompt parameter
- When user provides specific image description, call configureImageGeneration WITH prompt parameter to generate directly
- With prompt: Immediately creates an image artifact and starts generation with real-time progress tracking via WebSocket
- Without prompt: Shows settings panel for user to configure resolution, style, shot size, model, and seed
```

### Enhancement Rules

The AI agent follows specific rules for enhancement:

1. **Simple prompts that should be enhanced:**
   - Russian text: `"мальчик с мячиком"`, `"красивый закат"`
   - Short English: `"cat on table"`, `"car racing"`, `"portrait girl"`
   - Basic descriptions under 50 characters or 5 words
   - Prompts without quality descriptors

2. **Prompts that don't need enhancement:**
   - Already detailed and professional descriptions
   - Contain artistic/technical terms
   - Longer than 100 characters with good structure

### Model Loading

Models are loaded dynamically from SuperDuperAI API:

```typescript
// From configureImageGeneration tool
const config = await getImageGenerationConfig();
// Returns available models, resolutions, styles, shot sizes
```

## Test Results

Based on our behavior test:

✅ **Working correctly:**
- Automatic enhancement of Russian/short prompts
- Tool call sequencing (enhancePrompt → configureImageGeneration)
- Understanding of settings vs generation requests
- Basic parameter extraction

❌ **Areas for improvement:**
- Parameter extraction from detailed prompts could be more accurate
- Style and resolution parsing needs refinement
- Model selection from natural language

## Best Practices for Users

### For Best Results:

1. **Let AI enhance simple prompts:**
   ```
   ❌ Don't: Force detailed prompts if you're not sure
   ✅ Do: "нарисуй красивый закат" - AI will enhance automatically
   ```

2. **Specify parameters naturally:**
   ```
   ✅ "Create a portrait in watercolor style"
   ✅ "Generate a 4K cinematic landscape"
   ✅ "Make a square image with anime style"
   ```

3. **Use model names when needed:**
   ```
   ✅ "Use FLUX model for high quality"
   ✅ "Generate with Imagen for best results"
   ```

## Technical Implementation

### Tool Configuration

From `lib/ai/tools/configure-image-generation.ts`:

```typescript
parameters: z.object({
  prompt: z.string().optional().describe('Detailed description...'),
  style: z.string().optional().describe('Style of the image...'),
  resolution: z.string().optional().describe('Image resolution...'),
  shotSize: z.string().optional().describe('Shot size/camera angle...'),
  model: z.string().optional().describe('AI model to use...'),
  seed: z.number().optional().describe('Seed for reproducible results'),
  batchSize: z.number().min(1).max(3).optional()
})
```

### Smart Parameter Matching

The tool uses fuzzy matching for parameters:
- Style matching: Searches by ID, label, or partial match
- Resolution matching: Parses various formats
- Model matching: Matches by name or ID

## Conclusion

The AI agent demonstrates sophisticated understanding of image generation parameters:

1. **Automatic enhancement** works well for simple/Russian prompts
2. **Parameter extraction** from natural language is functional but could be improved
3. **Tool orchestration** follows the correct flow
4. **Dynamic model loading** ensures up-to-date options

The system provides a good balance between automation and user control, allowing both quick generation with minimal input and detailed control when needed.

## Recommendations

1. **For developers:** Improve parameter extraction regex patterns
2. **For users:** Trust the AI's enhancement for simple prompts
3. **For system:** Add more detailed logging of parameter extraction 