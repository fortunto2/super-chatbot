# Debug Parameters Component

**Date:** January 17, 2025  
**Component:** components/debug-parameters.tsx  
**Type:** Refactoring

## Overview

Created a reusable `DebugParameters` component to replace duplicated debug display code across artifacts.

## Changes Made

### 1. New Component Created

Created `components/debug-parameters.tsx`:
- Reusable component for displaying debug parameters
- Collapsible interface with arrow indicator
- JSON display with syntax highlighting
- Copy to clipboard functionality
- Accepts any data object and optional title

### 2. Updated Image Artifact

Modified `components/image-editor.tsx`:
- Removed ~50 lines of duplicated debug display code
- Added import for DebugParameters component
- Replace inline debug section with `<DebugParameters data={apiPayload} />`

### 3. Updated Video Artifact

Modified `components/video-editor.tsx`:
- Added parsedContent prop to VideoEditorProps interface
- Added import for DebugParameters component
- Replace inline debug section with `<DebugParameters data={apiPayload} />`
- Fixed prop passing from artifacts/video/client.tsx

### 4. Text and Sheet Artifacts

Text and sheet artifacts have different architecture where content is rendered inline rather than through separate editor components. They would require more significant refactoring to add debug display.

## Benefits

1. **Code Reusability** - Single component used across artifacts
2. **Maintainability** - Changes to debug display only need to be made in one place
3. **Consistency** - Same UI/UX across all artifacts
4. **Reduced Code** - Removed ~100 lines of duplicated code

## Technical Details

The component accepts:
- `data: any` - The data object to display (usually parsedContent from artifact)
- `title?: string` - Optional title (defaults to "Debug: Generation Parameters")

## Usage Example

```tsx
import { DebugParameters } from '@/components/debug-parameters';

// In your component
<DebugParameters data={parsedContent} title="Custom Debug Title" />
```

## Future Improvements

1. Add support for text and sheet artifacts if needed
2. Add export to file functionality
3. Add syntax highlighting for specific data types 