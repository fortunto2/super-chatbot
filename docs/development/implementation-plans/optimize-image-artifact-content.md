# Optimization Plan: Image Artifact Content Structure

**Date:** January 15, 2025
**Status:** Proposed
**Priority:** Medium

## Problem Statement

Current image artifact content structure includes:
- All available options (90+ styles, 10 models, etc.) - ~15KB
- Debug information (apiPayload) 
- Duplicate data between different fields
- Everything stored as a single JSON string

This makes the content field large and difficult to work with.

## Proposed Solution

### Phase 1: Immediate Improvements (Quick Wins)

1. **Remove Redundant Available Options**
   ```typescript
   // Before: Store all options in content
   content: JSON.stringify({
     settings: {
       availableStyles: [...90 items...],
       availableModels: [...10 items...],
       // Current selections + all options
     }
   })
   
   // After: Store only selected values
   content: JSON.stringify({
     status: 'pending',
     projectId: '...',
     imageUrl: '...',
     selectedStyle: { id: 'watercolor', label: 'Watercolor' },
     selectedModel: { id: 'flux', label: 'Flux Dev' },
     // Only what was selected
   })
   ```

2. **Move Debug Info to Separate Field**
   ```typescript
   // Add new field to artifacts
   interface UIArtifact {
     content: string;        // User data only
     debugInfo?: string;     // API payload, technical data
     metadata?: Record<string, any>; // Additional data
   }
   ```

3. **Load Options On-Demand**
   ```typescript
   // ImageEditor loads options when opened
   useEffect(() => {
     if (isEditing) {
       loadAvailableOptions();
     }
   }, [isEditing]);
   ```

### Phase 2: Architecture Improvements

1. **Separate Content Types**
   ```typescript
   // Define clear interfaces
   interface ImageArtifactContent {
     status: 'pending' | 'processing' | 'completed' | 'failed';
     imageUrl?: string;
     progress?: number;
     error?: string;
   }
   
   interface ImageArtifactSettings {
     prompt: string;
     style: MediaOption;
     resolution: MediaResolution;
     model: ImageModel;
     shotSize: MediaOption;
   }
   ```

2. **Use React Context for Options**
   ```typescript
   // Share loaded options across components
   const MediaOptionsContext = createContext<{
     styles: MediaOption[];
     models: ImageModel[];
     resolutions: MediaResolution[];
   }>({});
   ```

3. **Implement Smart Caching**
   ```typescript
   // Cache options with TTL
   const optionsCache = new Map<string, {
     data: any;
     timestamp: number;
   }>();
   ```

### Phase 3: Database Optimization

1. **Add Metadata Column**
   ```sql
   ALTER TABLE "Document" 
   ADD COLUMN metadata JSONB;
   
   -- Store technical data separately
   UPDATE "Document" 
   SET metadata = content::jsonb - 'availableStyles' - 'availableModels'
   WHERE kind = 'image';
   ```

2. **Create Options Reference Table**
   ```sql
   CREATE TABLE "MediaOptions" (
     id UUID PRIMARY KEY,
     type VARCHAR(50), -- 'styles', 'models', 'resolutions'
     data JSONB,
     created_at TIMESTAMP,
     expires_at TIMESTAMP
   );
   ```

## Implementation Steps

### Step 1: Update Image Artifact Server
```typescript
// artifacts/image/server.ts
export const imageDocumentHandler = createDocumentHandler<'image'>({
  onCreateDocument: async ({ id, title, dataStream }) => {
    // Only include essential data
    const content = {
      status: 'pending',
      projectId: result.projectId,
      fileId: result.fileId,
      prompt: params.prompt,
      // User selections only
      style: params.style,
      resolution: params.resolution,
      model: params.model,
      shotSize: params.shotSize,
    };
    
    // Debug info as separate metadata
    const debugInfo = {
      apiPayload,
      timestamp: Date.now(),
      availableOptionsVersion: '1.0'
    };
    
    return {
      content: JSON.stringify(content),
      metadata: debugInfo // If we add metadata support
    };
  }
});
```

### Step 2: Update Image Editor Component
```typescript
// components/image-editor.tsx
export function ImageEditor({ parsedContent }) {
  // Load options only when needed
  const { styles, models, resolutions } = useMediaOptions();
  
  // Show debug info only in debug mode
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <>
      {/* Main UI */}
      <ImageControls 
        selectedStyle={parsedContent.style}
        availableStyles={styles} // Loaded on demand
      />
      
      {/* Debug toggle */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowDebug(!showDebug)}
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </Button>
      
      {showDebug && <DebugPanel content={parsedContent} />}
    </>
  );
}
```

### Step 3: Create Options API Endpoint
```typescript
// app/api/media-options/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'all', 'styles', 'models'
  
  // Check cache first
  const cached = getCachedOptions(type);
  if (cached) return Response.json(cached);
  
  // Load from API
  const options = await loadMediaOptions(type);
  cacheOptions(type, options);
  
  return Response.json(options);
}
```

## Benefits

1. **Reduced Storage**: ~80% reduction in content size
2. **Better Performance**: Faster artifact loading
3. **Cleaner Code**: Separation of concerns
4. **Improved UX**: Debug info hidden by default
5. **Scalability**: Easy to add new option types

## Migration Strategy

1. **Backward Compatibility**: Support both old and new formats
2. **Gradual Migration**: Update new artifacts first
3. **Data Cleanup**: Script to migrate existing artifacts

## Risks & Mitigation

- **Risk**: Additional API calls for options
  - **Mitigation**: Aggressive caching, preload common options

- **Risk**: Breaking existing artifacts  
  - **Mitigation**: Version field, compatibility layer

## Success Metrics

- Content size reduced from ~20KB to ~4KB
- Page load time improved by 200ms
- Cleaner debug experience
- No breaking changes for users 