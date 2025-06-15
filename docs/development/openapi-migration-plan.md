# OpenAPI Client Generation Migration Plan

## Overview

This document outlines the migration from manually defined VideoModel, ImageModel, and other types to auto-generated OpenAPI client from SuperDuperAI API specification.

## Current Problems

1. **Manual type management**: VideoModel, ImageModel types defined in multiple places
2. **Inconsistency**: Different interfaces across files
3. **Maintenance overhead**: Manual synchronization with API changes
4. **Duplication**: Same model definitions in multiple locations
5. **Type conflicts**: Cross-contamination between models

## Solution: OpenAPI Code Generation

Generate TypeScript client from SuperDuperAI OpenAPI specification using `@sobytes/openapi-typescript-codegen`.

### Key Benefits

- ✅ **Single source of truth**: OpenAPI specification from backend
- ✅ **Automatic synchronization**: Updates when API changes
- ✅ **Type safety**: Generated TypeScript interfaces
- ✅ **Complete API coverage**: All endpoints and models
- ✅ **Consistency**: Unified naming and structure
- ✅ **Developer experience**: IntelliSense and type checking

## Implementation Plan

### Phase 1: Setup OpenAPI Generation

1. **Install dependencies**:
   ```bash
   pnpm add -D @sobytes/openapi-typescript-codegen
   ```

2. **Add generation script** to `package.json`:
   ```json
   {
     "scripts": {
       "generate-api": "openapi --input https://dev-editor.superduperai.co/openapi.json --output lib/api --client axios --useOptions"
     }
   }
   ```

3. **Generate initial API client**:
   ```bash
   pnpm run generate-api
   ```

### Phase 2: Replace Manual Types

#### Replace VideoModel Types

**Files to update**:
- `lib/config/superduperai.ts` - Remove VideoModel interface
- `lib/types/media-settings.ts` - Remove VideoModel interface  
- `lib/config/video-model-utils.ts` - Update imports
- `components/artifacts/media-settings.tsx` - Update imports
- `lib/ai/tools/configure-video-generation.ts` - Update imports
- `artifacts/video/server.ts` - Update imports
- `lib/ai/api/generate-video.ts` - Update imports

**Replacement approach**:
```typescript
// OLD: Manual VideoModel interface
interface VideoModel {
  name: string;
  label: string;
  // ...
}

// NEW: Use generated type
import { IGenerationConfigRead } from '@/lib/api/models';
type VideoModel = IGenerationConfigRead;
```

#### Replace ImageModel Types

**Files to update**:
- `lib/config/superduperai.ts` - Remove ImageModel interface
- `lib/ai/tools/configure-image-generation.ts` - Update imports
- `artifacts/image/server.ts` - Update imports
- `hooks/use-image-generation.ts` - Update imports
- `lib/ai/api/generate-image*.ts` - Update imports
- `components/artifacts/media-settings.tsx` - Update imports

### Phase 3: Replace API Calls

#### Current API Functions

Replace manual API calls with generated services:

```typescript
// OLD: Manual API calls
async function getAvailableVideoModels() {
  const response = await fetch('/api/v1/generation-config');
  return response.json();
}

// NEW: Generated service
import { GenerationConfigService } from '@/lib/api/services';

async function getAvailableVideoModels() {
  return GenerationConfigService.generationConfigGetList({
    // typed parameters
  });
}
```

#### API Services to Replace

- `lib/config/superduperai.ts`:
  - `getAvailableVideoModels()` → `GenerationConfigService.generationConfigGetList()`
  - `getAvailableImageModels()` → `GenerationConfigService.generationConfigGetList()`

### Phase 4: Update Configuration System

#### Environment Configuration

Update `lib/config/superduperai.ts`:

```typescript
// Use generated OpenAPI client configuration
import { OpenAPI } from '@/lib/api/core/OpenAPI';

export function configureSuperduperAI() {
  const config = getSuperduperAIConfig();
  
  OpenAPI.BASE = config.url;
  OpenAPI.TOKEN = config.token;
  
  return config;
}
```

#### Model Filtering Logic

Update filtering logic to use generated types:

```typescript
import { IGenerationConfigRead, GenerationTypeEnum } from '@/lib/api/models';

export function getVideoModels(models: IGenerationConfigRead[]) {
  return models.filter(model => 
    model.type === GenerationTypeEnum.IMAGE_TO_VIDEO ||
    model.type === GenerationTypeEnum.TEXT_TO_VIDEO ||
    model.type === GenerationTypeEnum.VIDEO_TO_VIDEO
  );
}

export function getImageModels(models: IGenerationConfigRead[]) {
  return models.filter(model => 
    model.type === GenerationTypeEnum.TEXT_TO_IMAGE ||
    model.type === GenerationTypeEnum.IMAGE_TO_IMAGE
  );
}
```

### Phase 5: Cleanup and Testing

1. **Remove legacy files**:
   - Delete manual type definitions
   - Remove duplicate interfaces
   - Clean up unused imports

2. **Update imports across codebase**:
   ```typescript
   // Update all imports to use generated API
   import { IGenerationConfigRead } from '@/lib/api/models';
   import { GenerationConfigService } from '@/lib/api/services';
   ```

3. **Test functionality**:
   - Verify video model selection works
   - Verify image model selection works
   - Test API calls with generated client
   - Validate type safety

## File Structure After Migration

```
lib/
├── api/                          # Generated OpenAPI client
│   ├── core/
│   │   ├── OpenAPI.ts
│   │   ├── request.ts
│   │   └── CancelablePromise.ts
│   ├── models/
│   │   ├── IGenerationConfigRead.ts
│   │   ├── GenerationTypeEnum.ts
│   │   ├── GenerationSourceEnum.ts
│   │   └── ...
│   ├── services/
│   │   ├── GenerationConfigService.ts
│   │   ├── FileService.ts
│   │   └── ...
│   └── index.ts
├── config/
│   └── superduperai.ts           # Configuration & helper functions
└── utils/
    └── model-helpers.ts          # Model filtering utilities
```

## Benefits After Migration

1. **Reduced complexity**: No more manual type management
2. **Better reliability**: Types always match API
3. **Improved DX**: Full IntelliSense support
4. **Easier maintenance**: Automatic updates with `pnpm run generate-api`
5. **Consistent naming**: Uses backend naming conventions
6. **Complete coverage**: Access to all API endpoints

## Migration Checklist

- [ ] Install OpenAPI codegen dependency
- [ ] Add generation script to package.json
- [ ] Generate initial API client
- [ ] Replace VideoModel types with IGenerationConfigRead
- [ ] Replace ImageModel types with IGenerationConfigRead
- [ ] Update API calls to use generated services
- [ ] Configure OpenAPI client with environment settings
- [ ] Update model filtering logic
- [ ] Remove legacy type definitions
- [ ] Update all imports across codebase
- [ ] Test video model functionality
- [ ] Test image model functionality
- [ ] Verify API integration works
- [ ] Update documentation

## Maintenance

After migration:

1. **Regular updates**: Run `pnpm run generate-api` when API changes
2. **Version control**: Commit generated files to track API changes
3. **CI integration**: Add generation to build process
4. **Type checking**: Generated types will catch API mismatches 