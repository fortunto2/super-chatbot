# Image Artifact Debug Parameters Display

**Date:** January 15, 2025
**Type:** Enhancement
**Status:** Implemented

## Summary

Enhanced image artifact display to show generation parameters for debugging purposes under a collapsible section. Removed the duplicate "Generate New Image" button from the debug section and made the main button always visible.

## Changes Made

### 1. ImageEditor Component Updates

- Changed `apiPayload` prop from `undefined` to `parsedContent` to pass artifact data
- Updated debug section title from "API Configuration" to "Generation Parameters"
- Removed duplicate "Generate New Image" button from debug section
- Made the main "Generate New Image" button always visible at the bottom

### 2. Debug Parameters Display

The debug section now shows all artifact parameters including:
- `status` - Current generation status
- `projectId` - Project identifier
- `requestId` - Request identifier  
- `fileId` - File identifier
- `prompt` - Generation prompt
- `style` - Selected style
- `resolution` - Image resolution
- `model` - Selected model
- `shotSize` - Shot size setting
- `negativePrompt` - Negative prompt if any
- `seed` - Generation seed
- `batchSize` - Batch size
- `timestamp` - Generation timestamp
- `imageUrl` - Final image URL (when completed)

### 3. User Experience

- Parameters are hidden by default under a collapsible "Debug: Generation Parameters" section
- Click the arrow to expand/collapse the debug info
- Copy button allows copying all parameters as JSON
- "Generate New Image" button is always visible for easy access

## Implementation Details

```typescript
// Pass parsedContent for debug display
<ImageDisplay
  imageUrl={displayImageUrl}
  prompt={displayPrompt}
  onCopyUrl={handleCopyUrl}
  onGenerateNew={handleGenerateNew}
  apiPayload={parsedContent} // Changed from undefined
/>
```

## Benefits

- Better debugging capabilities for developers
- Clear visibility of all generation parameters
- No clutter - debug info is hidden by default
- Consistent UI with single "Generate New Image" button 