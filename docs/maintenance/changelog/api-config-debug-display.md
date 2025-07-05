# API Configuration Debug Display

## Overview

Added debug functionality to display the full API configuration payload in image artifacts for easier debugging.

## Changes Made

### 1. Server-side Changes (`artifacts/image/server.ts`)
- Added `apiPayload` field to artifact content
- Captures the exact API payload sent to SuperDuperAI
- Includes all parameters: prompt, resolution, style, model, etc.

### 2. Client-side Changes 
- **`artifacts/image/client.tsx`**: Pass `parsedContent` to ImageEditor
- **`components/image-editor.tsx`**: 
  - Accept `parsedContent` prop
  - Pass `apiPayload` to ImageDisplay component
  - Replace "Generate New Image" button with collapsible API config section

## Usage

1. Generate an image through the chat
2. In the artifact, you'll see "Debug: API Configuration" at the bottom
3. Click to expand and view the full API payload
4. Click "📋 Copy API Config" to copy to clipboard

## API Payload Structure

```json
{
  "config": {
    "prompt": "user's prompt",
    "negative_prompt": "",
    "width": 1024,
    "height": 1024,
    "steps": 30,
    "shot_size": "medium_shot",
    "seed": 123456789,
    "generation_config_name": "comfyui/flux",
    "batch_size": 1,
    "style_name": "flux_realistic",
    "references": [],
    "entity_ids": []
  }
}
```

## Benefits

- Easy debugging of API parameters
- Verify correct model/style/resolution selection
- Copy exact payload for API testing
- Understand what AI agent selected

## Notes

- Only shows for new images (old images don't have apiPayload)
- "Generate New Image" button moved inside expandable section
- Dark mode compatible styling 