# SuperDuperAI Video Models Documentation

Based on the SuperDuperAI API specification, this document describes available video generation models and their configuration.

## API Endpoint

```
POST /api/v1/project/video
```

## Request Structure

```json
{
  "config": {
    "prompt": "string",
    "dynamic": 1,
    "aspect_ratio": "string",
    "image_generation_config_name": "comfyui/flux",
    "image_model_type": "flux",
    "quality": "hd",
    "seed": 0,
    "voiceover_volume": 1,
    "music_volume": 1,
    "sound_effect_volume": 1,
    "transition": {
      "type": "fade"
    },
    "zoom": {
      "type": "string",
      "ease": "linear"
    }
  }
}
```

## Available Video Models

### LTX (Lightricks LTX Video)

- **Name**: `comfyui/ltx`
- **Label**: `LTX`
- **Type**: `text_to_video`
- **Workflow Path**: `LTX/default.json`
- **Price**: `0.4` per second
- **Available Durations**: Various durations supported

### Model Configuration Names

Based on the API response, here are the available model configurations:

```json
{
  "video_models": {
    "ltx": {
      "name": "comfyui/ltx",
      "label": "LTX",
      "type": "text_to_video",
      "workflow_path": "LTX/default.json",
      "price_per_second": 0.4,
      "description": "Lightricks LTX Video model for high-quality video generation"
    }
  }
}
```

## Required Configuration Parameters

### Core Parameters

- `prompt`: Text description of the video to generate
- `dynamic`: Set to `1` for dynamic video generation
- `aspect_ratio`: Video aspect ratio (e.g., "16:9", "1:1", "9:16")
- `image_generation_config_name`: Model configuration name (e.g., "comfyui/flux")
- `image_model_type`: Base model type (e.g., "flux")

### Quality Settings

- `quality`: Video quality setting ("hd", "sd")
- `seed`: Random seed for reproducible results (0 for random)

### Audio Settings

- `voiceover_volume`: Volume level for voiceover (0-1)
- `music_volume`: Volume level for background music (0-1)
- `sound_effect_volume`: Volume level for sound effects (0-1)

### Visual Effects

- `transition`: Transition effects configuration
  - `type`: Transition type ("fade", "cut", etc.)
- `zoom`: Zoom effects configuration
  - `type`: Zoom type
  - `ease`: Easing function ("linear", "ease-in", "ease-out")

## Usage Examples

### Basic Video Generation

```json
{
  "config": {
    "prompt": "Ocean waves gently crashing on a sandy beach at golden hour",
    "dynamic": 1,
    "aspect_ratio": "16:9",
    "image_generation_config_name": "comfyui/ltx",
    "image_model_type": "flux",
    "quality": "hd",
    "seed": 0,
    "voiceover_volume": 0,
    "music_volume": 0.5,
    "sound_effect_volume": 0.3,
    "transition": {
      "type": "fade"
    },
    "zoom": {
      "type": "slow",
      "ease": "linear"
    }
  }
}
```

### Cinematic Video with Effects

```json
{
  "config": {
    "prompt": "A futuristic cityscape at sunset with flying cars and neon lights",
    "dynamic": 1,
    "aspect_ratio": "21:9",
    "image_generation_config_name": "comfyui/ltx",
    "image_model_type": "flux",
    "quality": "hd",
    "seed": 42,
    "voiceover_volume": 0,
    "music_volume": 0.8,
    "sound_effect_volume": 0.6,
    "transition": {
      "type": "fade"
    },
    "zoom": {
      "type": "dramatic",
      "ease": "ease-out"
    }
  }
}
```

## Response Format

The API returns a project configuration with:

- Project ID for tracking generation progress
- WebSocket URL for real-time updates
- Estimated generation time and cost

## Error Handling

Common errors:

- `400 Bad Request`: Missing required parameters (e.g., "Template is required")
- `401 Unauthorized`: Invalid API token
- `429 Too Many Requests`: Rate limit exceeded

## Integration Notes

1. **Model Selection**: Use `image_generation_config_name` to specify the video model
2. **Quality vs Speed**: Higher quality settings increase generation time
3. **Cost Calculation**: Based on `price_per_second` and video duration
4. **WebSocket Tracking**: Monitor generation progress via WebSocket connection

## Supported Aspect Ratios

- `16:9` - Widescreen (recommended for most content)
- `1:1` - Square (social media)
- `9:16` - Vertical (mobile/stories)
- `21:9` - Ultra-wide (cinematic)

## Best Practices

1. **Prompts**: Use detailed, descriptive prompts for better results
2. **Seed Values**: Use consistent seeds for reproducible outputs
3. **Audio Balance**: Adjust volume levels based on content type
4. **Quality Settings**: Use "hd" for final output, "sd" for testing
5. **Aspect Ratio**: Choose based on intended platform/use case
