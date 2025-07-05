# Image Artifact Content Structure

## Overview

When you see the artifact content for images, you might notice it contains a lot of data beyond just the image parameters. This document explains why the content is structured this way and why it's stored as a JSON string.

## Why Content is a JSON String

The `content` field is stored as a JSON string rather than a JSON object because:

1. **Database Schema**: In the PostgreSQL database, the `content` field is defined as `text('content')` not `json` type:
   ```typescript
   // lib/db/schema.ts
   export const document = pgTable('Document', {
     content: text('content'), // Text field, not JSON
     // ... other fields
   })
   ```

2. **Flexibility**: Text fields allow storing different content types (images, text, video, etc.) with different structures

3. **Compatibility**: Easier to migrate and handle different artifact versions

## Content Structure Breakdown

Here's what each part of the content JSON contains:

### 1. Generation Status & IDs
```json
{
  "status": "pending",        // Current generation status
  "projectId": "1b6d856f...", // Primary ID for tracking
  "requestId": "1b6d856f...", // Request tracking ID
  "fileId": "1b6d856f...",    // File storage ID
  "timestamp": 1751738157790  // Creation timestamp
}
```

### 2. User Input Parameters
```json
{
  "prompt": "A breathtaking seascape...", // User's prompt
  "settings": {
    "style": { "id": "flux_watercolor", "label": "Watercolor" },
    "resolution": { "width": 1024, "height": 1024, "label": "1024x1024" },
    "model": { "name": "comfyui/flux", "label": "Flux Dev" },
    "shotSize": { "id": "Medium Shot", "label": "Medium Shot" }
  }
}
```

### 3. Available Options (The "Extra" Data)
```json
{
  "settings": {
    "availableStyles": [...],      // 90+ style options
    "availableResolutions": [...], // 10 resolution options
    "availableModels": [...],      // 10 model options
    "availableShotSizes": [...]    // 8 shot size options
  }
}
```

### 4. Debug Information (API Payload)
```json
{
  "apiPayload": {
    "config": {
      "prompt": "...",
      "negative_prompt": "",
      "width": 1024,
      "height": 1024,
      "generation_config_name": "comfyui/flux",
      // ... exact parameters sent to API
    }
  }
}
```

## Why Include All Available Options?

The available options are included for several important reasons:

1. **Real-time UI Updates**: When the artifact is displayed, the ImageEditor component needs to show dropdowns with all available options so users can modify parameters without additional API calls

2. **Historical Context**: Preserves what options were available at the time of generation (models and styles can change over time)

3. **Offline Capability**: The UI can render even if the API is temporarily unavailable

4. **Performance**: Avoids multiple API calls to fetch options every time the artifact is viewed

5. **Debugging**: Shows exactly what was available when the generation happened

## Why API Payload is Included

The `apiPayload` field is specifically for debugging [[memory:2079783]]:

- **AICODE-DEBUG**: Added to verify exact parameters sent to SuperDuperAI API
- Shows the actual API request structure
- Helps troubleshoot generation issues
- Confirms parameter transformations are correct

## Data Flow

The content structure supports this workflow:

1. **Generation Start**: All data is captured and stored
2. **Real-time Updates**: SSE/WebSocket updates modify the content
3. **UI Display**: Parser extracts current state and available options
4. **Parameter Changes**: User can modify using pre-loaded options
5. **Debug View**: API payload helps troubleshoot issues

## Size Considerations

While the content may seem large (typically 10-20KB), this is acceptable because:

- Text compression in PostgreSQL reduces actual storage
- Faster than making multiple API calls
- Provides better user experience with instant option changes
- Debug information is invaluable for troubleshooting

## Future Improvements

Potential optimizations could include:

1. Storing available options separately and referencing them
2. Using PostgreSQL JSON type for better querying
3. Compressing the content before storage
4. Loading options on-demand for rarely used features
5. Moving debug payload to separate field or metadata

However, the current approach prioritizes developer experience and debugging capabilities over minor storage optimizations.

## Note on Backward Compatibility

Since no artifacts are currently stored in production, we don't support the old format with nested `settings` object. The system only uses the new flat structure. 